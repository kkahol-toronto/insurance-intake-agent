import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { motion } from 'framer-motion';
import classNames from 'classnames';
import { NodeStatus } from '../../types/flow';
import './StageNode.css';

interface StageNodeData {
  label: string;
  status: NodeStatus;
  notes?: string[];
  disabled?: boolean;
}

function StageNode({ data, selected }: NodeProps<StageNodeData>) {
  const { label, status, notes = [], disabled = false } = data;
  
  return (
    <motion.div
      className={classNames('stage-node', {
        'node-idle': status === 'idle',
        'node-active': status === 'active',
        'node-done': status === 'done',
        'node-selected': selected,
        'node-disabled': disabled
      })}
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.2 }}
      drag={false}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="node-handle"
      />
      
      <div className="node-content">
        <div className="node-label">{label}</div>
        
        {status === 'active' && notes.length > 0 && (
          <motion.div
            className="node-notes"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {notes.map((note, index) => (
              <div key={index} className="note-item">
                {note}
              </div>
            ))}
          </motion.div>
        )}
      </div>
      
      <Handle
        type="source"
        position={Position.Bottom}
        className="node-handle"
      />
    </motion.div>
  );
}

export default memo(StageNode);

