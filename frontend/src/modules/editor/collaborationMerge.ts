import type { Circuit, DragState } from '../../types/circuit';

export function mergeRemoteCircuitWithLocalInteraction(
  remoteCircuit: Circuit,
  localCircuit: Circuit,
  dragState: DragState | null,
): Circuit {
  if (!dragState) return remoteCircuit;

  if (dragState.kind === 'selection') {
    const gateIds = new Set(dragState.gates.map((gate) => gate.id));
    const annotationIds = new Set(dragState.annotations.map((annotation) => annotation.id));
    const localGates = localCircuit.gates.filter((gate) => gateIds.has(gate.id));
    const localAnnotations = (localCircuit.annotations ?? []).filter((annotation) => annotationIds.has(annotation.id));
    const localGateMap = new Map(localGates.map((gate) => [gate.id, gate]));
    const localAnnotationMap = new Map(localAnnotations.map((annotation) => [annotation.id, annotation]));
    const remoteAnnotations = remoteCircuit.annotations ?? [];

    return {
      ...remoteCircuit,
      gates: [
        ...remoteCircuit.gates.map((gate) => localGateMap.get(gate.id) ?? gate),
        ...localGates.filter((gate) => !remoteCircuit.gates.some((remoteGate) => remoteGate.id === gate.id)),
      ],
      annotations: [
        ...remoteAnnotations.map((annotation) => localAnnotationMap.get(annotation.id) ?? annotation),
        ...localAnnotations.filter(
          (annotation) => !remoteAnnotations.some((remoteAnnotation) => remoteAnnotation.id === annotation.id),
        ),
      ],
    };
  }

  if (dragState.kind === 'annotation' || dragState.kind === 'annotation-resize') {
    const draggedAnnotation = localCircuit.annotations?.find((annotation) => annotation.id === dragState.annotationId);
    if (!draggedAnnotation) return remoteCircuit;

    const remoteAnnotations = remoteCircuit.annotations ?? [];
    const remoteHasAnnotation = remoteAnnotations.some((annotation) => annotation.id === draggedAnnotation.id);
    return {
      ...remoteCircuit,
      annotations: remoteHasAnnotation
        ? remoteAnnotations.map((annotation) => (annotation.id === draggedAnnotation.id ? draggedAnnotation : annotation))
        : [...remoteAnnotations, draggedAnnotation],
    };
  }

  const draggedGate = localCircuit.gates.find((gate) => gate.id === dragState.gateId);
  if (!draggedGate) return remoteCircuit;

  const remoteHasGate = remoteCircuit.gates.some((gate) => gate.id === draggedGate.id);
  return {
    ...remoteCircuit,
    gates: remoteHasGate
      ? remoteCircuit.gates.map((gate) => (gate.id === draggedGate.id ? draggedGate : gate))
      : [...remoteCircuit.gates, draggedGate],
  };
}
