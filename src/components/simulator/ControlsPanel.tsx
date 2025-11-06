import { useSimulatorStore } from '../../store/simulatorStore';
import { BranchPolicy } from '../../types/flow';
import './ControlsPanel.css';

interface ControlsPanelProps {
  isPlaying: boolean;
  isPaused: boolean;
  speedMultiplier: number;
  branchPolicy: BranchPolicy;
  onPlay: () => void;
  onPause: () => void;
  onStep: () => void;
  onReset: () => void;
  onSpeedChange: (speed: number) => void;
  onBranchPolicyChange: (policy: BranchPolicy) => void;
}

function ControlsPanel({
  isPlaying,
  isPaused,
  speedMultiplier,
  branchPolicy,
  onPlay,
  onPause,
  onStep,
  onReset,
  onSpeedChange,
  onBranchPolicyChange,
}: ControlsPanelProps) {
  return (
    <div className="controls-panel">
      <div className="controls-group">
        <button
          onClick={isPlaying && !isPaused ? onPause : onPlay}
          className="control-btn play-btn"
          disabled={isPlaying && !isPaused && useSimulatorStore.getState().currentNodeId === 'chess'}
        >
          {isPlaying && !isPaused ? '⏸️ Pause' : '▶️ Play'}
        </button>
        <button onClick={onStep} className="control-btn step-btn" disabled={isPlaying && !isPaused}>
          ⏭️ Step
        </button>
        <button onClick={onReset} className="control-btn reset-btn">
          🔄 Reset
        </button>
      </div>

      <div className="controls-group">
        <label className="control-label">
          Speed: {speedMultiplier.toFixed(2)}×
          <input
            type="range"
            min="0.25"
            max="3"
            step="0.25"
            value={speedMultiplier}
            onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
            className="speed-slider"
          />
        </label>
      </div>

      <div className="controls-group">
        <label className="control-label">
          Branch Policy:
          <select
            value={branchPolicy}
            onChange={(e) => onBranchPolicyChange(e.target.value as BranchPolicy)}
            className="branch-select"
            disabled={isPlaying && !isPaused}
          >
            <option value="Always IGO">Always IGO</option>
            <option value="Always NIGO (once)">Always NIGO (once)</option>
            <option value="Random p=0.2 NIGO">Random p=0.2 NIGO</option>
          </select>
        </label>
      </div>
    </div>
  );
}

export default ControlsPanel;

