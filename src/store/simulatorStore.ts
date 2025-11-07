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
  
  // Ingestion messages
  ingestionMessages: string[];
  currentIngestionMessageIndex: number;
  showExtractionLink: boolean;
  
  // Form Enhancement messages
  formEnhancementMessages: string[];
  currentFormEnhancementMessageIndex: number;
  
  // Classification messages
  classificationMessages: string[];
  currentClassificationMessageIndex: number;
  
  // Content Validation messages
  contentValidationMessages: string[];
  currentContentValidationMessageIndex: number;
  
  // Data Enrichment messages
  dataEnrichmentMessages: string[];
  currentDataEnrichmentMessageIndex: number;
  
  // Electronic Claim Validation messages
  eClaimValidationMessages: string[];
  currentEClaimValidationMessageIndex: number;
  
  // Gap Assessment messages
  gapAssessmentMessages: string[];
  currentGapAssessmentMessageIndex: number;

  // Code Conversion messages
  codeConversionMessages: string[];
  currentCodeConversionMessageIndex: number;
  showCodeConversionPopup: boolean;

  // Claim Data Entry messages
  claimDataEntryMessages: string[];
  currentClaimDataEntryMessageIndex: number;

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
  updateEventLog: (index: number, updatedEvent: LogEvent) => void;
  reset: () => void;
  incrementNigoCount: () => void;
  setElapsedTime: (time: number) => void;
  setStartTime: (time: number | null) => void;
  setIngestionMessages: (messages: string[]) => void;
  setCurrentIngestionMessageIndex: (index: number) => void;
  setShowExtractionLink: (show: boolean) => void;
  setFormEnhancementMessages: (messages: string[]) => void;
  setCurrentFormEnhancementMessageIndex: (index: number) => void;
  setClassificationMessages: (messages: string[]) => void;
  setCurrentClassificationMessageIndex: (index: number) => void;
  setContentValidationMessages: (messages: string[]) => void;
  setCurrentContentValidationMessageIndex: (index: number) => void;
  setDataEnrichmentMessages: (messages: string[]) => void;
  setCurrentDataEnrichmentMessageIndex: (index: number) => void;
  setEClaimValidationMessages: (messages: string[]) => void;
  setCurrentEClaimValidationMessageIndex: (index: number) => void;
  setGapAssessmentMessages: (messages: string[]) => void;
  setCurrentGapAssessmentMessageIndex: (index: number) => void;
  setCodeConversionMessages: (messages: string[]) => void;
  setCurrentCodeConversionMessageIndex: (index: number) => void;
  setShowCodeConversionPopup: (show: boolean) => void;
  setClaimDataEntryMessages: (messages: string[]) => void;
  setCurrentClaimDataEntryMessageIndex: (index: number) => void;
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
  ingestionMessages: [],
  currentIngestionMessageIndex: -1,
  showExtractionLink: false,
  formEnhancementMessages: [],
  currentFormEnhancementMessageIndex: -1,
  classificationMessages: [],
  currentClassificationMessageIndex: -1,
  contentValidationMessages: [],
  currentContentValidationMessageIndex: -1,
  dataEnrichmentMessages: [],
  currentDataEnrichmentMessageIndex: -1,
  eClaimValidationMessages: [],
  currentEClaimValidationMessageIndex: -1,
  gapAssessmentMessages: [],
  currentGapAssessmentMessageIndex: -1,
  codeConversionMessages: [],
  currentCodeConversionMessageIndex: -1,
  showCodeConversionPopup: false,
  claimDataEntryMessages: [],
  currentClaimDataEntryMessageIndex: -1,

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
  
  updateEventLog: (index, updatedEvent) => {
    set((state) => {
      const newEventLog = [...state.eventLog];
      if (newEventLog[index]) {
        newEventLog[index] = updatedEvent;
      }
      return { eventLog: newEventLog };
    });
  },
  
  incrementNigoCount: () => {
    set((state) => ({ nigoCount: state.nigoCount + 1 }));
  },
  
  setElapsedTime: (time) => set({ elapsedTime: time }),
  
  setStartTime: (time) => set({ startTime: time }),
  
  setIngestionMessages: (messages) => set({ ingestionMessages: messages }),
  
  setCurrentIngestionMessageIndex: (index) => set({ currentIngestionMessageIndex: index }),
  
  setShowExtractionLink: (show) => set({ showExtractionLink: show }),
  
  setFormEnhancementMessages: (messages) => set({ formEnhancementMessages: messages }),
  
  setCurrentFormEnhancementMessageIndex: (index) => set({ currentFormEnhancementMessageIndex: index }),
  
  setClassificationMessages: (messages) => set({ classificationMessages: messages }),
  
  setCurrentClassificationMessageIndex: (index) => set({ currentClassificationMessageIndex: index }),
  
  setContentValidationMessages: (messages) => set({ contentValidationMessages: messages }),
  
  setCurrentContentValidationMessageIndex: (index) => set({ currentContentValidationMessageIndex: index }),
  
  setDataEnrichmentMessages: (messages) => set({ dataEnrichmentMessages: messages }),
  
  setCurrentDataEnrichmentMessageIndex: (index) => set({ currentDataEnrichmentMessageIndex: index }),
  
  setEClaimValidationMessages: (messages) => set({ eClaimValidationMessages: messages }),
  
  setCurrentEClaimValidationMessageIndex: (index) => set({ currentEClaimValidationMessageIndex: index }),
  
  setGapAssessmentMessages: (messages) => set({ gapAssessmentMessages: messages }),
  
  setCurrentGapAssessmentMessageIndex: (index) => set({ currentGapAssessmentMessageIndex: index }),
  
  setCodeConversionMessages: (messages) => set({ codeConversionMessages: messages }),
  
  setCurrentCodeConversionMessageIndex: (index) => set({ currentCodeConversionMessageIndex: index }),
  
  setShowCodeConversionPopup: (show) => set({ showCodeConversionPopup: show }),

  setClaimDataEntryMessages: (messages) => set({ claimDataEntryMessages: messages }),

  setCurrentClaimDataEntryMessageIndex: (index) => set({ currentClaimDataEntryMessageIndex: index }),

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
      eventLog: [],
      ingestionMessages: [],
      currentIngestionMessageIndex: -1,
      showExtractionLink: false,
      formEnhancementMessages: [],
      currentFormEnhancementMessageIndex: -1,
      classificationMessages: [],
      currentClassificationMessageIndex: -1,
      contentValidationMessages: [],
      currentContentValidationMessageIndex: -1,
      dataEnrichmentMessages: [],
      currentDataEnrichmentMessageIndex: -1,
      eClaimValidationMessages: [],
      currentEClaimValidationMessageIndex: -1,
      gapAssessmentMessages: [],
      currentGapAssessmentMessageIndex: -1,
      codeConversionMessages: [],
      currentCodeConversionMessageIndex: -1,
      showCodeConversionPopup: false,
      claimDataEntryMessages: [],
      currentClaimDataEntryMessageIndex: -1
    });
  }
}));

