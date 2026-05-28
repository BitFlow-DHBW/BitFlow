import type { AnnotationDragState, AnnotationResizeState, Circuit, DragState } from '../../types/circuit';

interface LocalInteractionState {
  dragState: DragState | null;
  annotationDragState?: AnnotationDragState | null;
  annotationResizeState?: AnnotationResizeState | null;
}

export function mergeRemoteCircuitWithLocalInteraction(
  remoteCircuit: Circuit,
  localCircuit: Circuit,
  interaction: LocalInteractionState,
): Circuit {
  const draggedAnnotationId =
    interaction.annotationDragState?.annotationId ?? interaction.annotationResizeState?.annotationId;
  if (draggedAnnotationId) {
    const draggedAnnotation = localCircuit.annotations?.find((annotation) => annotation.id === draggedAnnotationId);
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

  const { dragState } = interaction;
  if (!dragState) return remoteCircuit;

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
