"use client";

import { useEffect } from "react";

import { WorkflowCanvas } from "@/components/canvas/WorkflowCanvas";
import { Toaster } from "@/components/ui/toast/Toaster";
import { useCanvasStore, type WorkflowNode } from "@/store/useCanvasStore";

const SEED_NODES: WorkflowNode[] = [
  {
    id: "start-llm",
    type: "llm",
    position: { x: 80, y: 80 },
    data: { label: "Generate Response", kind: "llm", status: "success" },
  },
  {
    id: "fetch-db",
    type: "db-query",
    position: { x: 400, y: 80 },
    data: { label: "Fetch User Context", kind: "db-query", status: "running", progress: 62 },
  },
  {
    id: "branch",
    type: "condition",
    position: { x: 720, y: 80 },
    data: { label: "Needs Approval?", kind: "condition", status: "idle" },
  },
];

const SEED_EDGES = [
  { id: "start-llm->fetch-db", source: "start-llm", target: "fetch-db" },
  { id: "fetch-db->branch", source: "fetch-db", target: "branch" },
];

export default function Home() {
  const setNodes = useCanvasStore((state) => state.setNodes);
  const setEdges = useCanvasStore((state) => state.setEdges);

  useEffect(() => {
    setNodes(SEED_NODES);
    setEdges(SEED_EDGES);
  }, [setNodes, setEdges]);

  return (
    <div className="flex h-screen w-screen flex-col">
      <header className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <h1 className="text-sm font-semibold text-gray-900">Visual Workflow Builder</h1>
      </header>
      <main className="flex-1">
        <WorkflowCanvas />
      </main>
      <Toaster />
    </div>
  );
}
