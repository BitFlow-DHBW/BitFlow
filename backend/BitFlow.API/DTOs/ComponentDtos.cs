namespace BitFlow.API.DTOs;

public sealed record TruthTableRowDto(bool[] Inputs, bool[] Outputs);

public sealed record CustomComponentDto(
    string? Id,
    string Name,
    string? Description,
    IReadOnlyList<string> InputLabels,
    IReadOnlyList<string> OutputLabels,
    IReadOnlyList<TruthTableRowDto> TruthTable,
    string? SourceCircuitId,
    string? CreatedAt);
