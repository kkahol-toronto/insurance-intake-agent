export type NodeStatus = 'idle' | 'active' | 'done';

export type FlowNode = {
  id: string;
  label: string;
  status: NodeStatus;
  durationMs: number;
  notes?: string[];
  position?: { x: number; y: number };
};

export type FlowEdge = {
  id: string;
  source: string;
  target: string;
  condition?: 'IGO' | 'NIGO';
};

export type BranchPolicy = 'Always IGO' | 'Always NIGO (once)' | 'Random p=0.2 NIGO';

export type SimulationConfig = {
  defaultDurationMs: number;
  branchPolicy: BranchPolicy;
  speedMultiplier: number; // 0.25 .. 3
};

export type LogEvent = {
  timestamp: number;
  fromNodeId: string | null;
  toNodeId: string;
  reason?: string;
  action?: string; // e.g., 'showExtraction'
  actionData?: any; // Additional data for the action
};

export type FlowData = {
  nodes: FlowNode[];
  edges: FlowEdge[];
};

