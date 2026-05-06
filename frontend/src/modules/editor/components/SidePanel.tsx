const gates = [
  { type: "AND" },
  { type: "OR" },
  { type: "XOR" },
  { type: "FlipFlop" },
  { type: "Add" },
];

function SidePanel() {
  return (
      <div className="w-48 bg-gray-100 border-r p-2">
      <h3 className="font-bold mb-2">Logikgatter</h3>
      {gates.map((gate) => (
        <div
          key={gate.type}
          className="p-2 bg-white border mb-2 cursor-pointer hover:bg-gray-200"
          draggable
          onDragStart={(e) => {
            
            e.dataTransfer.setData("gateType", gate.type);
          }}
        >
          {gate.type}
        </div>
      ))}
    </div>
  );
}

export default SidePanel;
