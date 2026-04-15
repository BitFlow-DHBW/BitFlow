import { type Gate, type Rotation } from "../../types/Gate";
import { type Input } from "../../types/Input";
import type { Output } from "../../types/Output";
import { gridSize } from "../constants";

function GateComp({gate, onMouseDownGate, onMouseDownInput}: {gate: Gate, onMouseDownGate?: React.MouseEventHandler<SVGRectElement>, onMouseDownInput?: React.MouseEventHandler<SVGPolylineElement>}) {

  let gate_svg_props = {
    strokeWidth: gridSize * 0.15,
    stroke: "black",
    fill: "white",
  }
  
  // Beim Rotieren die Höhe mit der Breite des Gatters tauschen
  const isHorizontal = ["East", "West"].includes(gate.rotation);
  const rotatedWidth = isHorizontal ? gate.width : gate.height;

  const isVertical = ["North", "South"].includes(gate.rotation);
  const rotatedHeight = isVertical ? gate.width : gate.height;

  let svg_pos = {
    x: gate.x * gridSize + 0.5 * gate_svg_props.strokeWidth,
    y: gate.y * gridSize + 0.5 * gate_svg_props.strokeWidth,
    width: rotatedWidth * gridSize - gate_svg_props.strokeWidth,
    height: rotatedHeight * gridSize - gate_svg_props.strokeWidth,
  }

  const rot_distrib_offset: Record<Rotation, { x: number; y: number }> = {
    North: { x: 1, y: 0 },
    East:  { x: 0, y: 1 },
    South: { x: 1, y: 0 },
    West:  { x: 0, y: 1 }
  };

  const rot_start_offset: Record<"input" | "output", Record<Rotation, { x: number; y: number }>> = {
    input: {
      North: { x: 0, y: 1 },
      East:  { x: 0, y: 0 },
      South: { x: 0, y: 0 },
      West:  { x: 1, y: 0 }
    },
    output: {
      North: { x: 0, y: 0 },
      East:  { x: 1, y: 0 },
      South: { x: 0, y: 1 },
      West:  { x: 0, y: 0 }
    }
  };

  const rot_end_offset: Record<"input" | "output", Record<Rotation, { x: number; y: number }>> = {
    input: {
      North: { x: 0, y: 1 },
      East:  { x: -1, y: 0 },
      South: { x: 0, y: -1 },
      West:  { x: 1, y: 0 },
    },
    output: {
      North: { x: 0, y: -1 },
      East:  { x: 1, y: 0 },
      South: { x: 0, y: 1 },
      West:  { x: -1, y: 0 },
    }
  };

  // INPUTS
  let input_svg_props = {
    strokeWidth: gridSize * 0.2,
    stroke: "violet",
    fill: "none",
    cursor: "pointer"
  }

  let input_pos = gate.inputs.map((_input: Input, index: number) => {
    const distrib_offset = rot_distrib_offset[gate.rotation]
    const start_offset = rot_start_offset["input"][gate.rotation]
    const end_offset = rot_end_offset["input"][gate.rotation]

    // Gleichmäßig verteilen
    /* alt (auch zwischen Kästchen möglich)
    let distrib_offset_x = distrib_offset.x * (gate.width / inputs.length) * 0.5 
    let distrib_offset_y = distrib_offset.y * (gate.height / inputs.length) * 0.5
    */

    return {
      x: (gate.x + distrib_offset.x + (index * distrib_offset.x) + (start_offset.x * rotatedWidth)),
      y: (gate.y + distrib_offset.y + (index * distrib_offset.y) + (start_offset.y * rotatedHeight)),
      x_offset: end_offset.x * (gridSize * 0.5),
      y_offset: end_offset.y * (gridSize * 0.5)
    }
  })

  // Input Positionen des Gates anpassen
  gate.inputs = gate.inputs.map((input: Input, i: number) => {
    return {
      gateId: input.gateId,
      xOffset: input_pos[i].x - gate.x,
      yOffset: input_pos[i].y - gate.y
    }
  })

  // OUTPUTS
  let output_svg_props = {
    strokeWidth: gridSize * 0.2,
    stroke: "blue",
    fill: "none",
    cursor: "pointer"
  }

  let output_pos = gate.outputs.map((_output: Output, index: number) => {
    const distrib_offset = rot_distrib_offset[gate.rotation]
    const start_offset = rot_start_offset["output"][gate.rotation]
    const end_offset = rot_end_offset["output"][gate.rotation]

    return {
      x: (gate.x + distrib_offset.x + (index * distrib_offset.x) + (start_offset.x * rotatedWidth)),
      y: (gate.y + distrib_offset.y + (index * distrib_offset.y) + (start_offset.y * rotatedHeight)),
      x_offset: end_offset.x * (gridSize * 0.5),
      y_offset: end_offset.y * (gridSize * 0.5)
    }
  })

  // Input Positionen des Gates anpassen
  gate.outputs = gate.outputs.map((input: Input, i: number) => {
    return {
      gateId: input.gateId,
      xOffset: output_pos[i].x - gate.x,
      yOffset: output_pos[i].y - gate.y
    }
  })
  
  return (
    <g>
      <rect {...gate_svg_props} {...svg_pos} onMouseDown={onMouseDownGate} cursor="grab" />
      <text 
        x={svg_pos.x + (rotatedWidth * gridSize) / 2}
        y={svg_pos.y + (rotatedHeight * gridSize) / 2}
        dominantBaseline="middle"
        textAnchor="middle"
        style={{ pointerEvents: "none", userSelect: "none" }}
      >
        {gate.label}
      </text>
      {input_pos.map((input, index: number) => (
        <polyline
          key={index}
          {...input_svg_props}
          points={`${input.x * gridSize},${input.y * gridSize} ${(input.x * gridSize) + input.x_offset},${(input.y * gridSize) + input.y_offset}`}
          input-id={index}
          pos-x={input.x}
          pos-y={input.y}
          onMouseDown={onMouseDownInput}
        >
          <title>Input {index}</title>
        </polyline>
      ))}
      {output_pos.map((input, index: number) => (
        <polyline
          key={index}
          {...output_svg_props}
          points={`${input.x * gridSize},${input.y * gridSize} ${(input.x * gridSize) + input.x_offset},${(input.y * gridSize) + input.y_offset}`}
          output-id={index}
          pos-x={input.x}
          pos-y={input.y}
          onMouseDown={onMouseDownInput}
        >
          <title>Output {index}</title>
        </polyline>
      ))}
    </g>
  );
}

export default GateComp;