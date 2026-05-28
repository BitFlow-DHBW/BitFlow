using System.Text.Json;
using BitFlow.API.DTOs;
using BitFlow.API.Infrastructure;
using BitFlow.API.Models;
using BitFlow.API.Services;
using Microsoft.AspNetCore.SignalR;

namespace BitFlow.API.Hubs;

public sealed class CollaborationHub(CollaborationSessionStore sessions, UserService users) : Hub
{
    public async Task<CollaborationSessionDto> CreateSession(JsonElement currentCircuit, string? displayName)
    {
        var user = await ResolveUserAsync();
        var name = ResolveDisplayName(displayName, user?.Name);
        var userId = user?.Id ?? Context.ConnectionId;
        var session = sessions.CreateSession(userId, Context.ConnectionId, name, currentCircuit);

        await Groups.AddToGroupAsync(Context.ConnectionId, GroupName(session.SessionId));
        await Clients.Caller.SendAsync("SessionCreated", session);
        return session;
    }

    public async Task<CollaborationSessionDto> JoinSession(string sessionId, string? displayName)
    {
        try
        {
            var user = await ResolveUserAsync();
            var name = ResolveDisplayName(displayName, user?.Name);
            var session = sessions.JoinSession(sessionId, user?.Id, name, Context.ConnectionId);
            var participant = sessions.GetParticipant(sessionId, Context.ConnectionId);

            await Groups.AddToGroupAsync(Context.ConnectionId, GroupName(sessionId));
            if (participant is not null)
            {
                await Clients.GroupExcept(GroupName(sessionId), Context.ConnectionId).SendAsync("ParticipantJoined", participant);
            }

            await Clients.Caller.SendAsync("SessionJoined", session);
            return session;
        }
        catch (ApiException exception)
        {
            throw new HubException(exception.Message);
        }
    }

    public async Task LeaveSession(string sessionId)
    {
        await HandleLeaveResultAsync(sessions.LeaveSession(sessionId, Context.ConnectionId));
    }

    public async Task UpdateCircuit(string sessionId, JsonElement currentCircuit)
    {
        try
        {
            var update = sessions.UpdateCircuit(sessionId, Context.ConnectionId, currentCircuit);
            await Clients.GroupExcept(GroupName(sessionId), Context.ConnectionId).SendAsync("CircuitUpdated", update);
        }
        catch (ApiException exception)
        {
            throw new HubException(exception.Message);
        }
    }

    public async Task UpdateCursor(string sessionId, CursorPositionDto cursorPosition)
    {
        try
        {
            var participant = sessions.UpdateCursor(sessionId, Context.ConnectionId, cursorPosition);
            await Clients.GroupExcept(GroupName(sessionId), Context.ConnectionId).SendAsync("CursorUpdated", participant);
        }
        catch (ApiException exception)
        {
            throw new HubException(exception.Message);
        }
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        foreach (var result in sessions.LeaveSessionsForConnection(Context.ConnectionId))
        {
            await HandleLeaveResultAsync(result);
        }

        await base.OnDisconnectedAsync(exception);
    }

    private async Task HandleLeaveResultAsync(CollaborationLeaveResult result)
    {
        if (!result.Found)
        {
            return;
        }

        var groupName = GroupName(result.SessionId);
        if (result.SessionEnded)
        {
            await Clients.Group(groupName).SendAsync("SessionEnded", new SessionEndedDto(result.SessionId, "Session wurde vom Host beendet."));
            return;
        }

        if (result.Participant is not null)
        {
            await Clients.Group(groupName).SendAsync("ParticipantLeft", result.Participant.ParticipantId);
            await Groups.RemoveFromGroupAsync(result.Participant.ConnectionId ?? Context.ConnectionId, groupName);
        }
    }

    private async Task<User?> ResolveUserAsync()
    {
        var httpContext = Context.GetHttpContext();
        var token = AuthHeader.GetBearerToken(httpContext?.Request.Headers.Authorization);

        if (string.IsNullOrWhiteSpace(token)
            && httpContext?.Request.Query.TryGetValue("access_token", out var accessToken) == true)
        {
            token = accessToken.ToString();
        }

        return await users.FindUserByTokenAsync(token, Context.ConnectionAborted);
    }

    private static string ResolveDisplayName(string? requestedName, string? userName)
    {
        if (!string.IsNullOrWhiteSpace(requestedName))
        {
            return requestedName.Trim();
        }

        if (!string.IsNullOrWhiteSpace(userName))
        {
            return userName.Trim();
        }

        return $"Guest {IdFactory.Create("guest")[..12]}";
    }

    private static string GroupName(string sessionId)
    {
        return $"collaboration:{sessionId}";
    }
}

