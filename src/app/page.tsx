"use client";

import { useEffect } from "react";

import { seedFromSearch } from "@/components/canvas/canvas.seed";
import { WorkflowCanvas } from "@/components/canvas/WorkflowCanvas";
import { LogViewer } from "@/components/log-viewer/LogViewer";
import { NodeSettingsDrawer } from "@/components/node-settings/NodeSettingsDrawer";
import { RunControls } from "@/components/run/RunControls";
import { Toaster } from "@/components/ui/toast/Toaster";
import { useCanvasStore } from "@/store/useCanvasStore";

export default function Home() {
  const setNodes = useCanvasStore((state) => state.setNodes);
  const setEdges = useCanvasStore((state) => state.setEdges);

  useEffect(() => {
    const { nodes, edges } = seedFromSearch(window.location.search);
    setNodes(nodes);
    setEdges(edges);
  }, [setNodes, setEdges]);

  return (
    <div className="flex h-screen w-screen flex-col">
      <header className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <h1 className="text-sm font-semibold text-gray-900">Visual Workflow Builder</h1>
        <RunControls workflowId="demo" />
      </header>
      <main className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1">
          <WorkflowCanvas />
        </div>
        <LogViewer className="h-72 shrink-0 border-t border-gray-200" />
      </main>
      <NodeSettingsDrawer />
      <Toaster />
    </div>
  );
}
