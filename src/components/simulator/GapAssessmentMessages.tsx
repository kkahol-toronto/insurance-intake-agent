import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSimulatorStore } from '../../store/simulatorStore';
import './IngestionMessages.css';

interface GapAssessmentMessagesProps {
  patientName: string;
  claimNumber: string;
}

function GapAssessmentMessages({ patientName, claimNumber }: GapAssessmentMessagesProps) {
  const { 
    gapAssessmentMessages, 
    currentGapAssessmentMessageIndex,
    currentNodeId,
    nodes,
    setGapAssessmentMessages,
    setCurrentGapAssessmentMessageIndex,
    updateNodeStatus
  } = useSimulatorStore();
  
  const [isVisible, setIsVisible] = useState(false);
  const hasStartedRef = useRef(false);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const progressionActiveRef = useRef(false);

  useEffect(() => {
    // Check if this is the demo claim
    const isDemoClaim = claimNumber === 'SLF DEN 9997310';
    
    // Check if we're actually at the gapAssessment node
    const isAtGapAssessment = currentNodeId === 'gapAssessment';
    
    // Check if the node is already done
    const gapAssessmentNode = nodes.find(n => n.id === 'gapAssessment');
    const isAlreadyDone = gapAssessmentNode?.status === 'done';
    
    // Reset hasStarted if we're no longer at this node
    if (!isAtGapAssessment) {
      hasStartedRef.current = false;
    }
    
    if (!isDemoClaim || !isAtGapAssessment || isAlreadyDone) {
      setIsVisible(false);
      if (!isAtGapAssessment || isAlreadyDone) {
        // Only reset if we're not at this node or it's done
        setGapAssessmentMessages([]);
        setCurrentGapAssessmentMessageIndex(-1);
        hasStartedRef.current = false; // Reset when leaving node
      }
      return;
    }
    
    // If already started, don't restart but keep visible
    if (hasStartedRef.current) {
      // Ensure visibility is maintained if messages exist
      if (gapAssessmentMessages.length > 0 && !isVisible) {
        setIsVisible(true);
      }
      return;
    }
    
    // Mark as started to prevent re-triggering
    hasStartedRef.current = true;
    
    // Set up messages
    const messages = [
      'Gap Assessment initiated',
      'Re-Analyzing existing data',
      'All data detected',
      'No gaps identified',
      'Gap Assessment complete'
    ];
    
    setGapAssessmentMessages(messages);
    setCurrentGapAssessmentMessageIndex(0);
    setIsVisible(true); // Set visible immediately
    
    // Clear any existing timeouts
    timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    timeoutsRef.current = [];
    
    return () => {
      // Don't clear timeouts on cleanup if messages are in progress
      // This allows the message sequence to continue even if the component re-renders
      // Only clear if we're actually leaving the node
      if (!isAtGapAssessment || isAlreadyDone) {
        timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
        timeoutsRef.current = [];
      }
    };
  }, [patientName, claimNumber, currentNodeId, nodes, setGapAssessmentMessages, setCurrentGapAssessmentMessageIndex, updateNodeStatus]);
  
  // Separate useEffect to continue message progression
  useEffect(() => {
    // Only continue if we're at gapAssessment, messages exist, and sequence is in progress
    if (currentNodeId !== 'gapAssessment' || gapAssessmentMessages.length === 0) {
      progressionActiveRef.current = false;
      return;
    }
    
    // If we're at the last message, mark as done and don't continue
    if (currentGapAssessmentMessageIndex >= gapAssessmentMessages.length - 1) {
      progressionActiveRef.current = false;
      // Mark node as completed after 3 seconds (to keep the Done message visible)
      const gapAssessmentNode = nodes.find(n => n.id === 'gapAssessment');
      if (gapAssessmentNode?.status !== 'done') {
        setTimeout(() => {
          updateNodeStatus('gapAssessment', 'done');
        }, 3000); // 3 seconds delay
      }
      return;
    }
    
    // If progression is already active, don't start another
    if (progressionActiveRef.current) {
      return;
    }
    
    // If we're at index 0 or higher, continue the sequence
    if (currentGapAssessmentMessageIndex >= 0 && currentGapAssessmentMessageIndex < gapAssessmentMessages.length - 1) {
      progressionActiveRef.current = true;
      // Message delays: each message stays for 3 seconds
      const messageDelays = [3000, 3000, 3000, 3000, 3000]; // milliseconds
      const nextIndex = currentGapAssessmentMessageIndex + 1;
      const delay = messageDelays[nextIndex] || 3000;
      
      const timeout = setTimeout(() => {
        progressionActiveRef.current = false; // Reset so next message can trigger
        setCurrentGapAssessmentMessageIndex(nextIndex);
        setIsVisible(true);
      }, delay);
      
      timeoutsRef.current.push(timeout);
      
      return () => {
        clearTimeout(timeout);
        progressionActiveRef.current = false;
      };
    }
  }, [currentGapAssessmentMessageIndex, gapAssessmentMessages.length, currentNodeId, nodes, setCurrentGapAssessmentMessageIndex, updateNodeStatus]);
  
  // If we have messages but not visible, and we're at the gapAssessment node, make visible
  useEffect(() => {
    if (gapAssessmentMessages.length > 0 && !isVisible && currentNodeId === 'gapAssessment') {
      setIsVisible(true);
    }
  }, [gapAssessmentMessages.length, isVisible, currentNodeId]);

  if (!isVisible || gapAssessmentMessages.length === 0) {
    return null;
  }

  // Ensure we have a valid message index
  const messageIndex = currentGapAssessmentMessageIndex >= 0 ? currentGapAssessmentMessageIndex : 0;
  const currentMessage = gapAssessmentMessages[messageIndex] || '';

  return (
    <div className="ingestion-messages-container">
      <AnimatePresence mode="wait">
        {currentMessage && (
          <motion.div
            key={messageIndex}
            className="ingestion-message"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {currentMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default GapAssessmentMessages;

