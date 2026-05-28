using System.Text.Json;
using BitFlow.API.DTOs;
using BitFlow.API.Services;
using Xunit;

namespace BitFlow.API.Tests;

public sealed class CollaborationSessionStoreTests
{
    [Fact]
    public void CreateSessionCreatesHostAndStoresCircuit()
    {
        var store = new CollaborationSessionStore();

        var session = store.CreateSession("user_host", "connection_host", "Ada", Circuit("initial"));

        Assert.StartsWith("session_", session.SessionId, StringComparison.Ordinal);
        Assert.Equal("user_host", session.HostUserId);
        Assert.True(session.IsActive);
        Assert.Single(session.Participants);
        Assert.True(session.Participants[0].IsHost);
        Assert.Equal("initial", session.CurrentCircuit.GetProperty("circuit").GetProperty("id").GetString());
    }

    [Fact]
    public void JoinSessionAddsParticipantWithoutReplacingHost()
    {
        var store = new CollaborationSessionStore();
        var session = store.CreateSession("user_host", "connection_host", "Ada", Circuit("initial"));

        var joined = store.JoinSession(session.SessionId, "user_guest", "Bea", "connection_guest");

        Assert.Equal(2, joined.Participants.Count);
        Assert.Contains(joined.Participants, participant => participant.IsHost);
        Assert.Contains(joined.Participants, participant => participant.DisplayName == "Bea" && !participant.IsHost);
    }

    [Fact]
    public void ParticipantLeaveDoesNotEndSession()
    {
        var store = new CollaborationSessionStore();
        var session = store.CreateSession("user_host", "connection_host", "Ada", Circuit("initial"));
        store.JoinSession(session.SessionId, "user_guest", "Bea", "connection_guest");

        var result = store.LeaveSession(session.SessionId, "connection_guest");

        Assert.True(result.Found);
        Assert.False(result.SessionEnded);
        Assert.Equal("Bea", result.Participant?.DisplayName);
    }

    [Fact]
    public void HostLeaveEndsSession()
    {
        var store = new CollaborationSessionStore();
        var session = store.CreateSession("user_host", "connection_host", "Ada", Circuit("initial"));
        store.JoinSession(session.SessionId, "user_guest", "Bea", "connection_guest");

        var result = store.LeaveSession(session.SessionId, "connection_host");

        Assert.True(result.Found);
        Assert.True(result.SessionEnded);
        Assert.Equal("Ada", result.Participant?.DisplayName);
    }

    [Fact]
    public void UpdatesCircuitAndCursorForParticipants()
    {
        var store = new CollaborationSessionStore();
        var session = store.CreateSession("user_host", "connection_host", "Ada", Circuit("initial"));

        var update = store.UpdateCircuit(session.SessionId, "connection_host", Circuit("updated"));
        var participant = store.UpdateCursor(session.SessionId, "connection_host", new CursorPositionDto(24, 48));

        Assert.Equal(session.SessionId, update.SessionId);
        Assert.Equal("updated", update.CurrentCircuit.GetProperty("circuit").GetProperty("id").GetString());
        Assert.Equal(24, participant.CursorPosition?.X);
        Assert.Equal(48, participant.CursorPosition?.Y);
    }

    private static JsonElement Circuit(string circuitId)
    {
        using var document = JsonDocument.Parse($$"""
        {
          "circuit": {
            "id": "{{circuitId}}",
            "name": "Test",
            "version": 1,
            "gates": [],
            "wires": [],
            "customComponents": []
          },
          "inputSignals": {},
          "customComponents": []
        }
        """);

        return document.RootElement.Clone();
    }
}
