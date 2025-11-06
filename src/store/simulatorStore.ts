import { create } from 'zustand';
import { FlowNode, FlowEdge, NodeStatus, BranchPolicy, LogEvent } from '../types/flow';
import flowDataJson from '../data/flowData.json';

// Type assertion for imported JSON
const flowData = flowDataJson as { nodes: FlowNode[]; edges: FlowEdge[] };

interface SimulatorState {
  // Flow data
  nodes: FlowNode[];
  edges: FlowEdge[];
  
  // Simulation state
  isPlaying: boolean;
  isPaused: boolean;
  currentNodeId: string | null;
  activeEdgeId: string | null;
  elapsedTime: number;
  startTime: number | null;
  
  // Configuration
  speedMultiplier: number; // 0.25 to 3
  branchPolicy: BranchPolicy;
  lockLayout: boolean;
  
  // History
  nigoCount: number; // Track if NIGO has been taken once
  eventLog: LogEvent[];
  
  // Actions
  setNodes: (nodes: FlowNode[]) => void;
  setEdges: (edges: FlowEdge[]) => void;
  updateNodeStatus: (nodeId: string, status: NodeStatus) => void;
  setCurrentNode: (nodeId: string | null) => void;
  setActiveEdge: (edgeId: string | null) => void;
  setIsPlaying: (playing: boolean) => void;
  setIsPaused: (paused: boolean) => void;
  setSpeedMultiplier: (multiplier: number) => void;
  setBranchPolicy: (policy: BranchPolicy) => void;
  setLockLayout: (lock: boolean) => void;
  addLogEvent: (event: LogEvent) => void;
  reset: () => void;
  incrementNigoCount: () => void;
  setElapsedTime: (time: number) => void;
  setStartTime: (time: number | null) => void;
}

const STORAGE_KEY = 'claims-simulator-positions';

const loadSavedPositions = (): Record<string, { x: number; y: number }> => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
};

const savePositions = (nodes: FlowNode[]) => {
  try {
    const positions: Record<string, { x: number; y: number }> = {};
    nodes.forEach(node => {
      if (node.position) {
        positions[node.id] = node.position;
      }
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
  } catch (error) {
    console.error('Failed to save positions:', error);
  }
};

const initialNodes: FlowNode[] = flowData.nodes.map(node => ({
  ...node,
  status: 'idle' as NodeStatus,
  position: loadSavedPositions()[node.id] || undefined
}));

export const useSimulatorStore = create<SimulatorState>((set, get) => ({
  // Initial state
  nodes: initialNodes,
  edges: flowData.edges as FlowEdge[],
  isPlaying: false,
  isPaused: false,
  currentNodeId: null,
  activeEdgeId: null,
  elapsedTime: 0,
  startTime: null,
  speedMultiplier: 1.0,
  branchPolicy: 'Random p=0.2 NIGO',
  lockLayout: false,
  nigoCount: 0,
  eventLog: [],
  
  // Actions
  setNodes: (nodes) => {
    set({ nodes });
    savePositions(nodes);
  },
  
  setEdges: (edges) => set({ edges }),
  
  updateNodeStatus: (nodeId, status) => {
    set((state) => ({
      nodes: state.nodes.map(node =>
        node.id === nodeId ? { ...node, status } : node
      )
    }));
  },
  
  setCurrentNode: (nodeId) => set({ currentNodeId: nodeId }),
  
  setActiveEdge: (edgeId) => set({ activeEdgeId: edgeId }),
  
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  
  setIsPaused: (paused) => set({ isPaused: paused }),
  
  setSpeedMultiplier: (multiplier) => set({ speedMultiplier: multiplier }),
  
  setBranchPolicy: (policy) => set({ branchPolicy: policy }),
  
  setLockLayout: (lock) => set({ lockLayout: lock }),
  
  addLogEvent: (event) => {
    set((state) => ({
      eventLog: [...state.eventLog, event].slice(-100) // Keep last 100 events
    }));
  },
  
  incrementNigoCount: () => {
    set((state) => ({ nigoCount: state.nigoCount + 1 }));
  },
  
  setElapsedTime: (time) => set({ elapsedTime: time }),
  
  setStartTime: (time) => set({ startTime: time }),
  
  reset: () => {
    const savedPositions = loadSavedPositions();
    const resetNodes = flowData.nodes.map(node => ({
      ...node,
      status: 'idle' as NodeStatus,
      position: savedPositions[node.id] || undefined
    }));
    
    set({
      nodes: resetNodes,
      isPlaying: false,
      isPaused: false,
      currentNodeId: null,
      activeEdgeId: null,
      elapsedTime: 0,
      startTime: null,
      nigoCount: 0,
      eventLog: []
    });
  }
}));

