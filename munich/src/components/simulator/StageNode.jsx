import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import classNames from 'classnames';
import './StageNode.css';

function StageNode({ data, selected }) {
  const { label, status, notes = [], disabled = false } = data;
  
  return (
    <div
      className={classNames('stage-node', {
        'node-idle': status === 'idle',
        'node-active': status === 'active',
        'node-done': status === 'done',
        'node-selected': selected,
        'node-disabled': disabled
      })}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="node-handle"
      />
      
      <div className="node-content">
        <div className="node-label">{label}</div>
        
        {status === 'active' && notes.length > 0 && (
          <div className="node-notes">
            {notes.map((note, index) => (
              <div key={index} className="note-item">
                {note}
              </div>
            ))}
          </div>
        )}
      </div>
      
      <Handle
        type="source"
        position={Position.Bottom}
        className="node-handle"
      />
    </div>
  );
}

export default memo(StageNode);

