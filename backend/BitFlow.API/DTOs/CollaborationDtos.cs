using System.Text.Json;

namespace BitFlow.API.DTOs;

public sealed record CursorPositionDto(double X, double Y);

public sealed record CollaborationParticipantDto(
    string ParticipantId,
    string? UserId,
    string DisplayName,
    string? ConnectionId,
    CursorPositionDto? CursorPosition,
    bool IsHost);

public sealed record CollaborationSessionDto(
    string SessionId,
    string HostUserId,
    string HostParticipantId,
    string? HostConnectionId,
    JsonElement CurrentCircuit,
    IReadOnlyList<CollaborationParticipantDto> Participants,
    string CreatedAt,
    bool IsActive);

public sealed record CircuitUpdatedDto(
    string SessionId,
    string SourceParticipantId,
    JsonElement CurrentCircuit,
    string UpdatedAt);

public sealed record SessionEndedDto(string SessionId, string Reason);

