import Canvas from "./components/Canvas";
import SidePanel from "./components/SidePanel";

function EditorPage() {
  return (
    <div className="flex h-screen">
      <SidePanel />
      <div className="flex-1 relative">
        <Canvas />
      </div>
    </div>
  );
}

export default EditorPage;