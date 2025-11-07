import { useState } from 'react';
import { useSimulatorStore } from '../../store/simulatorStore';
import { FlowNode, FlowEdge, LogEvent } from '../../types/flow';
import './SidePanel.css';

interface SidePanelProps {
  currentNodeId: string | null;
  elapsedTime: number;
  nodes: FlowNode[];
  edges: FlowEdge[];
}

function SidePanel({ currentNodeId, elapsedTime, nodes, edges }: SidePanelProps) {
  const { eventLog, updateEventLog } = useSimulatorStore();
  
  const currentNode = nodes.find(n => n.id === currentNodeId);
  const nextNode = currentNodeId ? getNextNode(currentNodeId, nodes, edges) : nodes.find(n => n.id === 'start');

  return (
    <div className="side-panel">
      <div className="panel-section">
        <h3>Current Status</h3>
        <div className="status-item">
          <span className="status-label">Current Node:</span>
          <span className="status-value">{currentNode?.label || 'Not started'}</span>
        </div>
        <div className="status-item">
          <span className="status-label">Next Node:</span>
          <span className="status-value">{nextNode?.label || 'N/A'}</span>
        </div>
        <div className="status-item">
          <span className="status-label">Elapsed Time:</span>
          <span className="status-value">{elapsedTime.toFixed(1)}s</span>
        </div>
      </div>

      <div className="panel-section">
        <h3>Event Log</h3>
        <div className="event-log" role="log" aria-live="polite">
          {eventLog.length === 0 ? (
            <div className="log-empty">No events yet</div>
          ) : (
            eventLog.slice().reverse().map((event, reverseIndex) => {
              const actualIndex = eventLog.length - 1 - reverseIndex;
              return (
              <div key={actualIndex} className="log-event">
                <div className="log-time">
                  {new Date(event.timestamp).toLocaleTimeString()}
                </div>
                <div className="log-content">
                  {event.fromNodeId ? (
                    <>
                      <span className="log-from">
                        {nodes.find(n => n.id === event.fromNodeId)?.label || event.fromNodeId}
                      </span>
                      {' → '}
                      <span className="log-to">
                        {nodes.find(n => n.id === event.toNodeId)?.label || event.toNodeId}
                      </span>
                    </>
                  ) : (
                    <span className="log-to">
                      Started: {nodes.find(n => n.id === event.toNodeId)?.label || event.toNodeId}
                    </span>
                  )}
                  {event.reason && (
                    <div className="log-reason">{event.reason}</div>
                  )}
                  {event.action === 'showExtraction' && event.actionData && (
                    <button
                      className="log-action-btn"
                      onClick={() => {
                        const customEvent = new CustomEvent('showExtraction', {
                          detail: event.actionData
                        });
                        window.dispatchEvent(customEvent);
                      }}
                    >
                      📄 View Extracted Information
                    </button>
                  )}
                  {event.action === 'setPriority' && event.actionData && (
                    <PrioritySelector event={event} eventIndex={actualIndex} />
                  )}
                </div>
              </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function getNextNode(currentNodeId: string, nodes: FlowNode[], edges: FlowEdge[]): FlowNode | null {
  const outgoingEdges = edges.filter(e => e.source === currentNodeId);
  if (outgoingEdges.length === 0) return null;
  
  // For now, just get the first edge's target
  // The actual branching logic is in the simulation engine
  const nextNodeId = outgoingEdges[0].target;
  return nodes.find(n => n.id === nextNodeId) || null;
}

// Priority Selector Component
function PrioritySelector({ event, eventIndex }: { event: LogEvent; eventIndex: number }) {
  const { updateEventLog } = useSimulatorStore();
  const [priority, setPriority] = useState(event.actionData?.priority || 'Low');
  const [isEditing, setIsEditing] = useState(false);

  const handlePriorityChange = (newPriority: string) => {
    setPriority(newPriority);
    setIsEditing(false);
    
    // Update the event log with new priority
    const updatedEvent = {
      ...event,
      actionData: {
        ...event.actionData,
        priority: newPriority
      }
    };
    updateEventLog(eventIndex, updatedEvent);
  };

  const priorities = ['Low', 'Medium', 'High', 'Emergency'];

  return (
    <div className="priority-selector-container">
      <div className="priority-label">Priority:</div>
      {isEditing ? (
        <select
          className="priority-dropdown"
          value={priority}
          onChange={(e) => handlePriorityChange(e.target.value)}
          onBlur={() => setIsEditing(false)}
          autoFocus
        >
          {priorities.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      ) : (
        <div className="priority-display" onClick={() => setIsEditing(true)}>
          <span className="priority-value">{priority}</span>
          <span className="priority-edit-hint">(click to edit)</span>
        </div>
      )}
      {event.actionData?.dentalCodes && (
        <div className="dental-codes-info">
          <div className="codes-label">Dental Codes:</div>
          <div className="codes-list">
            {event.actionData.dentalCodes.map((code: string, idx: number) => (
              <div key={idx} className="code-item">
                <span className="code-value">{code}</span>
                {event.actionData.codeDescriptions?.[code] && (
                  <span className="code-description"> - {event.actionData.codeDescriptions[code]}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default SidePanel;

