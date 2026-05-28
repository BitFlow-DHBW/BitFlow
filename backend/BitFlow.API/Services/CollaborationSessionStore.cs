using System.Text.Json;
using BitFlow.API.DTOs;
using BitFlow.API.Infrastructure;
using BitFlow.API.Models;

namespace BitFlow.API.Services;

public sealed class CollaborationSessionStore
{
    private readonly object syncRoot = new();
    private readonly Dictionary<string, CollaborationSessionState> sessions = [];

    public CollaborationSessionDto CreateSession(
        string hostUserId,
        string hostConnectionId,
        string displayName,
        JsonElement currentCircuit)
    {
        lock (syncRoot)
        {
            var sessionId = IdFactory.Create("session");
            var participant = CollaborationParticipantState.Create(
                IdFactory.Create("participant"),
                hostUserId,
                displayName,
                hostConnectionId,
                isHost: true);

            var session = new CollaborationSessionState(
                sessionId,
                hostUserId,
                participant.ParticipantId,
                currentCircuit.Clone(),
                DateTimeOffset.UtcNow);

            session.Participants[participant.ParticipantId] = participant;
            sessions[sessionId] = session;

            return ToDto(session);
        }
    }

    public CollaborationSessionDto JoinSession(
        string sessionId,
        string? userId,
        string displayName,
        string connectionId)
    {
        lock (syncRoot)
        {
            var session = GetActiveSession(sessionId);
            var existing = session.Participants.Values.FirstOrDefault(participant => participant.ConnectionId == connectionId);

            if (existing is null)
            {
                var participant = CollaborationParticipantState.Create(
                    IdFactory.Create("participant"),
                    userId,
                    displayName,
                    connectionId,
                    isHost: false);
                session.Participants[participant.ParticipantId] = participant;
            }

            return ToDto(session);
        }
    }

    public CollaborationParticipantDto? GetParticipant(string sessionId, string connectionId)
    {
        lock (syncRoot)
        {
            if (!sessions.TryGetValue(sessionId, out var session) || !session.IsActive)
            {
                return null;
            }

            var participant = session.Participants.Values.FirstOrDefault(entry => entry.ConnectionId == connectionId);
            return participant is null ? null : ToDto(participant);
        }
    }

    public CircuitUpdatedDto UpdateCircuit(string sessionId, string connectionId, JsonElement currentCircuit)
    {
        lock (syncRoot)
        {
            var session = GetActiveSession(sessionId);
            var participant = RequireParticipant(session, connectionId);
            session.CurrentCircuit = currentCircuit.Clone();
            session.UpdatedAt = DateTimeOffset.UtcNow;

            return new CircuitUpdatedDto(
                session.SessionId,
                participant.ParticipantId,
                session.CurrentCircuit.Clone(),
                DateTimeFormat.ToIsoString(session.UpdatedAt));
        }
    }

    public CollaborationParticipantDto UpdateCursor(string sessionId, string connectionId, CursorPositionDto cursorPosition)
    {
        lock (syncRoot)
        {
            var session = GetActiveSession(sessionId);
            var participant = RequireParticipant(session, connectionId);
            participant.CursorPosition = cursorPosition;
            return ToDto(participant);
        }
    }

    public CollaborationLeaveResult LeaveSession(string sessionId, string connectionId)
    {
        lock (syncRoot)
        {
            if (!sessions.TryGetValue(sessionId, out var session) || !session.IsActive)
            {
                return CollaborationLeaveResult.NotFound(sessionId);
            }

            return LeaveSessionUnsafe(session, connectionId);
        }
    }

    public IReadOnlyList<CollaborationLeaveResult> LeaveSessionsForConnection(string connectionId)
    {
        lock (syncRoot)
        {
            var results = new List<CollaborationLeaveResult>();
            foreach (var session in sessions.Values.ToList())
            {
                if (session.Participants.Values.Any(participant => participant.ConnectionId == connectionId))
                {
                    results.Add(LeaveSessionUnsafe(session, connectionId));
                }
            }

            return results;
        }
    }

    private CollaborationLeaveResult LeaveSessionUnsafe(CollaborationSessionState session, string connectionId)
    {
        var participant = session.Participants.Values.FirstOrDefault(entry => entry.ConnectionId == connectionId);

        if (participant is null)
        {
            return CollaborationLeaveResult.NotFound(session.SessionId);
        }

        var participantDto = ToDto(participant);
        if (participant.IsHost)
        {
            session.IsActive = false;
            sessions.Remove(session.SessionId);
            return CollaborationLeaveResult.Ended(session.SessionId, participantDto);
        }

        session.Participants.Remove(participant.ParticipantId);
        return CollaborationLeaveResult.ParticipantLeft(session.SessionId, participantDto);
    }

    private CollaborationSessionState GetActiveSession(string sessionId)
    {
        if (!sessions.TryGetValue(sessionId, out var session) || !session.IsActive)
        {
            throw new ApiException(StatusCodes.Status404NotFound, "Session wurde nicht gefunden.");
        }

        return session;
    }

    private static CollaborationParticipantState RequireParticipant(CollaborationSessionState session, string connectionId)
    {
        return session.Participants.Values.FirstOrDefault(participant => participant.ConnectionId == connectionId)
            ?? throw new ApiException(StatusCodes.Status403Forbidden, "Du bist kein Teilnehmer dieser Session.");
    }

    private static CollaborationSessionDto ToDto(CollaborationSessionState session)
    {
        var host = session.Participants.GetValueOrDefault(session.HostParticipantId);

        return new CollaborationSessionDto(
            session.SessionId,
            session.HostUserId,
            session.HostParticipantId,
            host?.ConnectionId,
            session.CurrentCircuit.Clone(),
            session.Participants.Values.Select(ToDto).ToList(),
            DateTimeFormat.ToIsoString(session.CreatedAt),
            session.IsActive);
    }

    private static CollaborationParticipantDto ToDto(CollaborationParticipantState participant)
    {
        return new CollaborationParticipantDto(
            participant.ParticipantId,
            participant.UserId,
            participant.DisplayName,
            participant.ConnectionId,
            participant.CursorPosition,
            participant.IsHost);
    }

    private sealed class CollaborationSessionState(
        string sessionId,
        string hostUserId,
        string hostParticipantId,
        JsonElement currentCircuit,
        DateTimeOffset createdAt)
    {
        public string SessionId { get; } = sessionId;
        public string HostUserId { get; } = hostUserId;
        public string HostParticipantId { get; } = hostParticipantId;
        public DateTimeOffset CreatedAt { get; } = createdAt;
        public DateTimeOffset UpdatedAt { get; set; } = createdAt;
        public bool IsActive { get; set; } = true;
        public JsonElement CurrentCircuit { get; set; } = currentCircuit;
        public Dictionary<string, CollaborationParticipantState> Participants { get; } = [];
    }

    private sealed class CollaborationParticipantState
    {
        public required string ParticipantId { get; init; }
        public string? UserId { get; init; }
        public required string DisplayName { get; init; }
        public required string ConnectionId { get; init; }
        public CursorPositionDto? CursorPosition { get; set; }
        public bool IsHost { get; init; }

        public static CollaborationParticipantState Create(
            string participantId,
            string? userId,
            string displayName,
            string connectionId,
            bool isHost)
        {
            return new CollaborationParticipantState
            {
                ParticipantId = participantId,
                UserId = userId,
                DisplayName = displayName,
                ConnectionId = connectionId,
                IsHost = isHost
            };
        }
    }
}

public sealed record CollaborationLeaveResult(
    string SessionId,
    CollaborationParticipantDto? Participant,
    bool SessionEnded,
    bool Found)
{
    public static CollaborationLeaveResult NotFound(string sessionId)
    {
        return new CollaborationLeaveResult(sessionId, null, SessionEnded: false, Found: false);
    }

    public static CollaborationLeaveResult ParticipantLeft(string sessionId, CollaborationParticipantDto participant)
    {
        return new CollaborationLeaveResult(sessionId, participant, SessionEnded: false, Found: true);
    }

    public static CollaborationLeaveResult Ended(string sessionId, CollaborationParticipantDto participant)
    {
        return new CollaborationLeaveResult(sessionId, participant, SessionEnded: true, Found: true);
    }
}
