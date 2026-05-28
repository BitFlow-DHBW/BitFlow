import type { Circuit, DragState } from '../../types/circuit';

export function mergeRemoteCircuitWithLocalInteraction(
  remoteCircuit: Circuit,
  localCircuit: Circuit,
  dragState: DragState | null,
): Circuit {
  if (!dragState) return remoteCircuit;

  if (dragState.kind === 'annotation') {
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
