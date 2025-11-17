import { create } from 'zustand';
import fnolFlowData from '../data/fnolFlowData.json';
import { applyLayout } from '../utils/layoutUtils';

// Apply initial layout to nodes
const initialNodes = fnolFlowData.nodes.map(n => ({ ...n, status: 'idle' }));
const initialEdges = fnolFlowData.edges;
const laidOutNodes = applyLayout(initialNodes, initialEdges);

const initialState = {
  nodes: laidOutNodes,
  edges: initialEdges,
  isPlaying: false,
  isPaused: false,
  currentNodeId: null,
  activeEdgeId: null,
  elapsedTime: 0,
  startTime: null,
  speedMultiplier: 1,
  lockLayout: false,
  eventLog: [],
  stageMessages: {}, // stageId -> messages array
  currentStageMessageIndex: {}, // stageId -> current index
};

export const useFNOLSimulatorStore = create((set, get) => ({
  ...initialState,

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  updateNodeStatus: (nodeId, status) => set((state) => ({
    nodes: state.nodes.map(n => n.id === nodeId ? { ...n, status } : n)
  })),
  setCurrentNode: (nodeId) => set({ currentNodeId: nodeId }),
  setActiveEdge: (edgeId) => set({ activeEdgeId: edgeId }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setIsPaused: (paused) => set({ isPaused: paused }),
  setSpeedMultiplier: (multiplier) => set({ speedMultiplier: multiplier }),
  setLockLayout: (lock) => set({ lockLayout: lock }),
  addLogEvent: (event) => set((state) => ({
    eventLog: [...state.eventLog, event]
  })),
  setElapsedTime: (time) => set({ elapsedTime: time }),
  setStartTime: (time) => set({ startTime: time }),
  setStageMessages: (stageId, messages) => set((state) => ({
    stageMessages: { ...state.stageMessages, [stageId]: messages }
  })),
  setCurrentStageMessageIndex: (stageId, index) => set((state) => ({
    currentStageMessageIndex: { ...state.currentStageMessageIndex, [stageId]: index }
  })),
  updateNodeStatus: (nodeId, status) => set((state) => ({
    nodes: state.nodes.map(n => n.id === nodeId ? { ...n, status } : n)
  })),
  setCurrentNode: (nodeId) => set({ currentNodeId: nodeId }),
  setActiveEdge: (edgeId) => set({ activeEdgeId: edgeId }),
  reset: () => {
    const resetNodes = fnolFlowData.nodes.map(n => ({ ...n, status: 'idle' }));
    const resetEdges = fnolFlowData.edges;
    const laidOut = applyLayout(resetNodes, resetEdges);
    set({
      ...initialState,
      nodes: laidOut,
      edges: resetEdges,
    });
  },
  loadFlow: () => {
    // For now, always use the default FNOL flow
    const newNodes = fnolFlowData.nodes.map(n => ({ ...n, status: 'idle' }));
    const newEdges = fnolFlowData.edges;
    const laidOut = applyLayout(newNodes, newEdges);
    set({
      nodes: laidOut,
      edges: newEdges,
    });
  },
}));

