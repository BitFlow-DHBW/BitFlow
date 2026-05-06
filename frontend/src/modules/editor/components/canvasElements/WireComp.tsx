import { type Wire } from "../../types/Wire";
import { gridSize } from "../constants";

function WireComp({wire, remove, onMouseDownNode, onMouseUpNode}: {wire: Wire, remove: Function, onMouseDownNode?: React.MouseEventHandler<SVGCircleElement>, onMouseUpNode?: React.MouseEventHandler<SVGCircleElement>}) {

  let wire_svg_props = {
    strokeWidth: gridSize * 0.125,
    fill: "none",
  }

  let svg_points = wire.points.map((point: number[]) => (
    point.map((coord: number) => (
      coord * gridSize
    ))
  ))

  const handleMouseDownWire = (e: React.MouseEvent<SVGPolylineElement, MouseEvent>) => {
    if (e.button !== 0) return;
    e.stopPropagation();

    remove();
  }
  
  const fillColor =
    wire.state === "error"   ? "red" :
    wire.state === "preview" ? "gray" :
    wire.state === "high"    ? "green" :
    "black";

  return (
    <g id={`wire_${wire.id}`}>
      <polyline 
        {...wire_svg_props} 
        cursor={((wire.state === "preview") ? undefined : "not-allowed")}
        stroke={fillColor}
        points={svg_points.toString()} 
        onMouseDown={handleMouseDownWire}
      />
      {
        wire.points.map((point: [number, number], index: number) => (
          <circle 
            key={index}
            r={gridSize * 0.125} 
            cx={point[0] * gridSize} 
            cy={point[1] * gridSize} 
            fill={fillColor}
            cursor={((wire.state === "preview") ? undefined : "grab")}
            node-id={index}
            pos-x= {point[0]}
            pos-y= {point[1]}
            onMouseDown={onMouseDownNode}
            onMouseUp={onMouseUpNode}
          />
        ))
      }
    </g>
  );
}

export default WireComp;