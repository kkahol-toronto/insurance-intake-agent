import { useEffect, useCallback, useRef, useMemo, useState } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  Panel,
  useReactFlow,
  ReactFlowProvider,
  NodeChange,
  applyNodeChanges,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useSimulatorStore } from '../../store/simulatorStore';
import { runSimulationStep, stepSimulation } from '../../utils/simulationEngine';
import StageNode from './StageNode';
import GlowingEdge from './GlowingEdge';
import ControlsPanel from './ControlsPanel';
import SidePanel from './SidePanel';
import IngestionMessages from './IngestionMessages';
import FormEnhancementMessages from './FormEnhancementMessages';
import ClassificationMessages from './ClassificationMessages';
import ContentValidationMessages from './ContentValidationMessages';
import DataEnrichmentMessages from './DataEnrichmentMessages';
import ElectronicClaimValidationMessages from './ElectronicClaimValidationMessages';
import GapAssessmentMessages from './GapAssessmentMessages';
import CodeConversionMessages from './CodeConversionMessages';
import ClaimDataEntryMessages from './ClaimDataEntryMessages';
import ExtractionViewer from './ExtractionViewer';
import ChatWidget from '../ChatWidget';
import { applyLayout } from '../../utils/layoutUtils';
import './ClaimsSimulator.css';

const nodeTypes = {
  stageNode: StageNode,
};

const edgeTypes = {
  glowingEdge: GlowingEdge,
};

interface ClaimsSimulatorProps {
  claim?: {
    claimNumber: string;
    patientName: string;
    integrationType?: string;
  };
}

function ClaimsSimulatorInner({ claim }: ClaimsSimulatorProps) {
  const {
    nodes,
    edges,
    isPlaying,
    isPaused,
    currentNodeId,
    activeEdgeId,
    lockLayout,
    speedMultiplier,
    branchPolicy,
    elapsedTime,
    startTime,
    eventLog,
    setNodes,
    setEdges,
    setLockLayout,
    setSpeedMultiplier,
    setBranchPolicy,
    reset,
    setIsPlaying,
    setIsPaused,
    setElapsedTime,
    loadFlow,
    currentFlowKey,
  } = useSimulatorStore();
  const integrationFlowKey = claim?.integrationType === 'CHESS' ? 'chess' : 'default';

  useEffect(() => {
    if (integrationFlowKey !== currentFlowKey) {
      loadFlow(integrationFlowKey);
      setTimeout(() => {
        try {
          fitView({ padding: 0.2 });
        } catch (e) {
          console.warn('fitView error:', e);
        }
      }, 600);
    }
  }, [integrationFlowKey, currentFlowKey, loadFlow, fitView]);
  
  const [showExtractionViewer, setShowExtractionViewer] = useState(false);
  
  const { fitView } = useReactFlow();
  
  // Listen for extraction viewer open event
  useEffect(() => {
    const handleShowExtraction = (event: CustomEvent) => {
      setShowExtractionViewer(true);
    };
    
    window.addEventListener('showExtraction', handleShowExtraction as EventListener);
    
    return () => {
      window.removeEventListener('showExtraction', handleShowExtraction as EventListener);
    };
  }, []);

  // Save event log to backend when it changes (for demo claim)
  useEffect(() => {
    if (!claim || claim.claimNumber !== 'SLF DEN 9997310' || eventLog.length === 0) {
      return;
    }

    // Debounce saves - only save when event log has new entries
    const saveEventLog = async () => {
      try {
        const response = await fetch('http://localhost:8004/api/event-log', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            claim_number: claim.claimNumber,
            patient_name: claim.patientName,
            event_log: eventLog,
          }),
        });

        if (response.ok) {
          const result = await response.json();
          console.log('Event log saved:', result);
        } else {
          console.warn('Failed to save event log:', response.statusText);
        }
      } catch (error) {
        console.warn('Error saving event log:', error);
      }
    };

    // Save after a short delay to batch multiple rapid events
    const timeoutId = setTimeout(saveEventLog, 2000);
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [eventLog, claim]);
  const isUpdatingFromHandler = useRef(false);
  const lastUpdateTime = useRef(0);

  // Convert store nodes to ReactFlow nodes - memoized to prevent unnecessary recalculations
  const reactFlowNodes: Node[] = useMemo(() => {
    const contentValidationNode = nodes.find(n => n.id === 'contentValidation');
    const shouldDisableProvider =
      claim?.claimNumber === 'SLF DEN 9997310' && contentValidationNode?.status === 'done';

    return nodes.map(node => {
      const isProviderNotification = node.id === 'providerNotification';
      const disabled = isProviderNotification && shouldDisableProvider;

      return {
        id: node.id,
        type: 'stageNode',
        position: node.position || { x: 0, y: 0 },
        data: {
          label: node.label,
          status: node.status,
          notes: node.notes,
          disabled,
        },
        draggable: !lockLayout && !disabled,
        selectable: !disabled,
        style: {
          cursor: lockLayout || disabled ? 'default' : 'grab',
        },
      };
    });
  }, [nodes, lockLayout, claim]);

  // Convert store edges to ReactFlow edges
  const reactFlowEdges: Edge[] = useMemo(() => edges.map(edge => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: 'glowingEdge',
    animated: activeEdgeId === edge.id,
    data: {
      isActive: activeEdgeId === edge.id,
      condition: edge.condition,
    },
    markerEnd: {
      type: 'arrowclosed',
      color: activeEdgeId === edge.id ? '#00E5FF' : 'rgba(255, 255, 255, 0.3)',
    },
  })), [edges, activeEdgeId]);

  // Handle node drag - debounce updates to prevent infinite loops
  const onNodesChange = useCallback((changes: NodeChange[]) => {
    // Filter to only handle position changes
    const positionChanges = changes.filter(change => change.type === 'position');
    
    if (lockLayout || positionChanges.length === 0 || isUpdatingFromHandler.current) {
      // Don't save positions when locked, no changes, or if we're already updating
      return;
    }
    
    const now = Date.now();
    // Debounce updates - only update every 200ms to prevent loops
    if (now - lastUpdateTime.current < 200) {
      return;
    }
    
    // Mark that we're updating from handler
    isUpdatingFromHandler.current = true;
    lastUpdateTime.current = now;
    
    // Use setTimeout to batch updates and prevent loops
    setTimeout(() => {
      try {
        // Update store nodes with new positions
        // Apply changes to current nodes to get new positions
        const contentValidationNode = nodes.find(n => n.id === 'contentValidation');
        const shouldDisableProvider =
          claim?.claimNumber === 'SLF DEN 9997310' && contentValidationNode?.status === 'done';

        const currentNodes = nodes.map(node => {
          const isProviderNotification = node.id === 'providerNotification';
          const disabled = isProviderNotification && shouldDisableProvider;

          return {
            id: node.id,
            type: 'stageNode',
            position: node.position || { x: 0, y: 0 },
            data: {
              label: node.label,
              status: node.status,
              notes: node.notes,
              disabled,
            },
            draggable: !lockLayout && !disabled,
            selectable: !disabled,
          };
        });
        
        const updatedReactFlowNodes = applyNodeChanges(changes, currentNodes);
        
        // Update our store with new positions
        const updatedNodes = nodes.map(node => {
          const updated = updatedReactFlowNodes.find(n => n.id === node.id);
          if (updated && updated.position) {
            const newPos = updated.position;
            const oldPos = node.position;
            // Only update if position actually changed
            if (!oldPos || newPos.x !== oldPos.x || newPos.y !== oldPos.y) {
              return {
                ...node,
                position: newPos,
              };
            }
          }
          return node;
        });
        
        // Check if any positions actually changed
        const hasChanges = updatedNodes.some((node, index) => {
          const original = nodes[index];
          return original && node !== original;
        });
        
        if (hasChanges) {
          setNodes(updatedNodes);
        }
      } finally {
        // Reset flag after update completes
        setTimeout(() => {
          isUpdatingFromHandler.current = false;
        }, 50);
      }
    }, 0);
  }, [nodes, lockLayout, setNodes, claim]);

  // Handle play/pause
  useEffect(() => {
    if (isPlaying && !isPaused && currentNodeId !== 'chess') {
      // Start or continue simulation
      const timer = setTimeout(() => {
        if (!currentNodeId) {
          // Start simulation
          runSimulationStep(null, () => {
            setIsPlaying(false);
          });
        } else {
          // Continue simulation
          runSimulationStep(currentNodeId, () => {
            setIsPlaying(false);
          });
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isPlaying, isPaused, currentNodeId, setIsPlaying]);

  // Update elapsed time
  useEffect(() => {
    if (startTime && isPlaying && !isPaused) {
      const interval = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        setElapsedTime(elapsed);
        elapsedTimeRef.current = elapsed;
      }, 100);
      return () => clearInterval(interval);
    }
  }, [startTime, isPlaying, isPaused, setElapsedTime]);

  // Auto-layout and initial layout
  useEffect(() => {
    // Apply initial layout if nodes don't have positions
    const hasPositions = nodes.length > 0 && nodes.every(n => n.position && (n.position.x !== 0 || n.position.y !== 0));
    
    if (!hasPositions && nodes.length > 0) {
      try {
        const layouted = applyLayout(nodes, edges);
        if (layouted && layouted.length > 0) {
          setNodes(layouted);
          // Wait for ReactFlow to initialize before fitting view
          setTimeout(() => {
            try {
              fitView({ padding: 0.2 });
            } catch (e) {
              console.warn('fitView error:', e);
            }
          }, 500);
        }
      } catch (e) {
        console.error('Layout error:', e);
        // Fallback: set basic positions
        const fallbackNodes = nodes.map((node, index) => ({
          ...node,
          position: { x: 100 + (index % 3) * 300, y: 100 + Math.floor(index / 3) * 200 }
        }));
        setNodes(fallbackNodes);
      }
    } else {
      // Just fit view if positions exist
      setTimeout(() => {
        try {
          fitView({ padding: 0.2 });
        } catch (e) {
          console.warn('fitView error:', e);
        }
      }, 500);
    }
  }, []); // Run once on mount

  const handleAutoLayout = useCallback(() => {
    const layouted = applyLayout(nodes, edges);
    setNodes(layouted);
    setTimeout(() => fitView({ padding: 0.2 }), 200);
  }, [nodes, edges, setNodes, fitView]);

  // Handle play
  const handlePlay = useCallback(() => {
    if (currentNodeId === 'chess') {
      reset();
    }
    setIsPlaying(true);
    setIsPaused(false);
  }, [currentNodeId, setIsPlaying, setIsPaused, reset]);

  // Handle pause
  const handlePause = useCallback(() => {
    setIsPaused(true);
  }, [setIsPaused]);

  // Handle step
  const handleStep = useCallback(() => {
    stepSimulation();
  }, []);

  // Handle reset
  const handleReset = useCallback(() => {
    reset();
    setIsPlaying(false);
    setIsPaused(false);
    setTimeout(() => fitView({ padding: 0.2 }), 100);
  }, [reset, setIsPlaying, setIsPaused, fitView]);

  // Safety check
  if (!nodes || nodes.length === 0) {
    return (
      <div className="claims-simulator">
        <div style={{ 
          padding: '40px', 
          color: '#E6EAF2', 
          textAlign: 'center',
          background: '#151A21',
          borderRadius: '8px',
          margin: '20px'
        }}>
          <p>Loading simulator...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="claims-simulator">
      {reactFlowNodes.length === 0 ? (
        <div style={{ 
          padding: '40px', 
          color: '#E6EAF2', 
          textAlign: 'center',
          background: '#151A21',
          borderRadius: '8px',
          margin: '20px'
        }}>
          <p>Loading simulator...</p>
        </div>
      ) : (
        <ReactFlow
          nodes={reactFlowNodes}
          edges={reactFlowEdges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChange}
          className="simulator-flow"
          nodesDraggable={!lockLayout}
          nodesConnectable={false}
          elementsSelectable={true}
          fitViewOnInit={false}
          panOnDrag={lockLayout ? true : [1, 2]}
          panOnScroll={true}
          zoomOnScroll={false}
          zoomOnPinch={true}
          preventScrolling={false}
          zoomOnDoubleClick={false}
          minZoom={0.1}
          maxZoom={2}
          deleteKeyCode={null}
          selectionKeyCode={null}
          onNodesDelete={undefined}
        >
        <Background />
        <Controls />
        <MiniMap />
        
        <Panel position="top-left" className="simulator-header">
          <div className="header-content">
            <h2>Claims Process Agent</h2>
            <div className="header-controls">
              <button
                onClick={() => setLockLayout(!lockLayout)}
                className={lockLayout ? 'active' : ''}
              >
                {lockLayout ? '🔒 Locked' : '🔓 Unlocked'}
              </button>
              <button onClick={handleAutoLayout}>
                📐 Auto Layout
              </button>
            </div>
          </div>
        </Panel>
        </ReactFlow>
      )}

      <ControlsPanel
        isPlaying={isPlaying}
        isPaused={isPaused}
        speedMultiplier={speedMultiplier}
        branchPolicy={branchPolicy}
        onPlay={handlePlay}
        onPause={handlePause}
        onStep={handleStep}
        onReset={handleReset}
        onSpeedChange={setSpeedMultiplier}
        onBranchPolicyChange={setBranchPolicy}
      />

      <SidePanel
        currentNodeId={currentNodeId}
        elapsedTime={elapsedTime}
        nodes={nodes}
        edges={edges}
      />

      {/* Ingestion Messages - only show when ingestion node is active */}
      {currentNodeId === 'ingestion' && claim && (
        <IngestionMessages
          patientName={claim.patientName}
          claimNumber={claim.claimNumber}
        />
      )}

      {/* Form Enhancement Messages - only show when formEnhancement node is active */}
      {currentNodeId === 'formEnhancement' && claim && (
        <FormEnhancementMessages
          patientName={claim.patientName}
          claimNumber={claim.claimNumber}
        />
      )}

      {/* Classification Messages - only show when classification node is active */}
      {currentNodeId === 'classification' && claim && (
        <ClassificationMessages
          patientName={claim.patientName}
          claimNumber={claim.claimNumber}
        />
      )}

      {/* Content Validation Messages - only show when contentValidation node is active */}
      {currentNodeId === 'contentValidation' && claim && (
        <ContentValidationMessages
          patientName={claim.patientName}
          claimNumber={claim.claimNumber}
        />
      )}

      {/* Data Enrichment Messages - only show when dataEnrichment node is active */}
      {currentNodeId === 'dataEnrichment' && claim && (
        <DataEnrichmentMessages
          patientName={claim.patientName}
          claimNumber={claim.claimNumber}
        />
      )}

      {/* Electronic Claim Validation Messages - only show when eClaimValidation node is active */}
      {currentNodeId === 'eClaimValidation' && claim && (
        <ElectronicClaimValidationMessages
          patientName={claim.patientName}
          claimNumber={claim.claimNumber}
        />
      )}

      {/* Gap Assessment Messages - only show when gapAssessment node is active */}
      {currentNodeId === 'gapAssessment' && claim && (
        <GapAssessmentMessages
          patientName={claim.patientName}
          claimNumber={claim.claimNumber}
        />
      )}

      {/* Code Conversion Messages - only show when codeConversion node is active */}
      {currentNodeId === 'codeConversion' && claim && (
        <CodeConversionMessages
          patientName={claim.patientName}
          claimNumber={claim.claimNumber}
        />
      )}

      {/* Claim Data Entry Messages - only show when dataEntryChess node is active */}
      {currentNodeId === 'dataEntryChess' && claim && (
        <ClaimDataEntryMessages
          patientName={claim.patientName}
          claimNumber={claim.claimNumber}
        />
      )}

      {/* Extraction Viewer */}
      {claim && (
        <ExtractionViewer
          isOpen={showExtractionViewer}
          onClose={() => setShowExtractionViewer(false)}
          claimNumber={claim.claimNumber}
          patientName={claim.patientName}
        />
      )}

      {/* Chat Widget - only in simulator */}
      <ChatWidget 
        claims={[]}
        statistics={null}
        cityData={[]}
        eventLog={eventLog}
      />

      {reactFlowNodes.length > 0 && (
        <Panel position="bottom-center" className="simulator-footer">
          <div className="footer-content">
            <span className="footer-text">Node States:</span>
            <span className="footer-legend">
              <span className="legend-item">
                <span className="legend-color idle"></span>
                Idle
              </span>
              <span className="legend-item">
                <span className="legend-color active"></span>
                Active
              </span>
              <span className="legend-item">
                <span className="legend-color done"></span>
                Done
              </span>
            </span>
            <span className="footer-badge">Stop at CHESS</span>
          </div>
        </Panel>
      )}
    </div>
  );
}

export default function ClaimsSimulator({ claim }: { claim?: { claimNumber: string; patientName: string } }) {
  return (
    <ReactFlowProvider>
      <ClaimsSimulatorInner claim={claim} />
    </ReactFlowProvider>
  );
}

