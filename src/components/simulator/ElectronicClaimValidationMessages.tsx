import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSimulatorStore } from '../../store/simulatorStore';
import './IngestionMessages.css';

interface ElectronicClaimValidationMessagesProps {
  patientName: string;
  claimNumber: string;
}

function ElectronicClaimValidationMessages({ patientName, claimNumber }: ElectronicClaimValidationMessagesProps) {
  const { 
    eClaimValidationMessages, 
    currentEClaimValidationMessageIndex,
    currentNodeId,
    nodes,
    setEClaimValidationMessages,
    setCurrentEClaimValidationMessageIndex,
    updateNodeStatus
  } = useSimulatorStore();
  
  const [isVisible, setIsVisible] = useState(false);
  const hasStartedRef = useRef(false);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const progressionActiveRef = useRef(false);

  useEffect(() => {
    // Check if this is the demo claim
    const isDemoClaim = claimNumber === 'SLF DEN 9997310';
    
    // Check if we're actually at the eClaimValidation node
    const isAtEClaimValidation = currentNodeId === 'eClaimValidation';
    
    // Check if the node is already done
    const eClaimValidationNode = nodes.find(n => n.id === 'eClaimValidation');
    const isAlreadyDone = eClaimValidationNode?.status === 'done';
    
    // Reset hasStarted if we're no longer at this node
    if (!isAtEClaimValidation) {
      hasStartedRef.current = false;
    }
    
    if (!isDemoClaim || !isAtEClaimValidation || isAlreadyDone) {
      setIsVisible(false);
      if (!isAtEClaimValidation || isAlreadyDone) {
        // Only reset if we're not at this node or it's done
        setEClaimValidationMessages([]);
        setCurrentEClaimValidationMessageIndex(-1);
        hasStartedRef.current = false; // Reset when leaving node
      }
      return;
    }
    
    // If already started, don't restart but keep visible
    if (hasStartedRef.current) {
      // Ensure visibility is maintained if messages exist
      if (eClaimValidationMessages.length > 0 && !isVisible) {
        setIsVisible(true);
      }
      return;
    }
    
    // Mark as started to prevent re-triggering
    hasStartedRef.current = true;
    
    // Set up messages
    const messages = [
      'Validating EDI',
      'Retrieving past data',
      'Assessing Data Completion',
      'Data completion Score HIGH',
      'EDI Verified',
      'Portal Validation initiated',
      'Done',
      'Electronic Claim Verification done'
    ];
    
    setEClaimValidationMessages(messages);
    setCurrentEClaimValidationMessageIndex(0);
    setIsVisible(true); // Set visible immediately
    
    // Clear any existing timeouts
    timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    timeoutsRef.current = [];
    
    return () => {
      // Don't clear timeouts on cleanup if messages are in progress
      // This allows the message sequence to continue even if the component re-renders
      // Only clear if we're actually leaving the node
      if (!isAtEClaimValidation || isAlreadyDone) {
        timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
        timeoutsRef.current = [];
      }
    };
  }, [patientName, claimNumber, currentNodeId, nodes, setEClaimValidationMessages, setCurrentEClaimValidationMessageIndex, updateNodeStatus]);
  
  // Separate useEffect to continue message progression
  useEffect(() => {
    // Only continue if we're at eClaimValidation, messages exist, and sequence is in progress
    if (currentNodeId !== 'eClaimValidation' || eClaimValidationMessages.length === 0) {
      progressionActiveRef.current = false;
      return;
    }
    
    // If we're at the last message, mark as done and don't continue
    if (currentEClaimValidationMessageIndex >= eClaimValidationMessages.length - 1) {
      progressionActiveRef.current = false;
      // Mark node as completed after 3 seconds (to keep the Done message visible)
      const eClaimValidationNode = nodes.find(n => n.id === 'eClaimValidation');
      if (eClaimValidationNode?.status !== 'done') {
        setTimeout(() => {
          updateNodeStatus('eClaimValidation', 'done');
        }, 3000); // 3 seconds delay
      }
      return;
    }
    
    // If progression is already active, don't start another
    if (progressionActiveRef.current) {
      return;
    }
    
    // If we're at index 0 or higher, continue the sequence
    if (currentEClaimValidationMessageIndex >= 0 && currentEClaimValidationMessageIndex < eClaimValidationMessages.length - 1) {
      progressionActiveRef.current = true;
      // Message delays: [0: 3000, 1: 3000, 2: 3000, 3: 3000, 4: 3000, 5: 6000, 6: 3000, 7: 3000]
      const messageDelays = [3000, 3000, 3000, 3000, 3000, 6000, 3000, 3000]; // milliseconds
      const nextIndex = currentEClaimValidationMessageIndex + 1;
      const delay = messageDelays[nextIndex] || 3000;
      
      const timeout = setTimeout(() => {
        progressionActiveRef.current = false; // Reset so next message can trigger
        setCurrentEClaimValidationMessageIndex(nextIndex);
        setIsVisible(true);
      }, delay);
      
      timeoutsRef.current.push(timeout);
      
      return () => {
        clearTimeout(timeout);
        progressionActiveRef.current = false;
      };
    }
  }, [currentEClaimValidationMessageIndex, eClaimValidationMessages.length, currentNodeId, nodes, setCurrentEClaimValidationMessageIndex, updateNodeStatus]);
  
  // If we have messages but not visible, and we're at the eClaimValidation node, make visible
  useEffect(() => {
    if (eClaimValidationMessages.length > 0 && !isVisible && currentNodeId === 'eClaimValidation') {
      setIsVisible(true);
    }
  }, [eClaimValidationMessages.length, isVisible, currentNodeId]);

  if (!isVisible || eClaimValidationMessages.length === 0) {
    return null;
  }

  // Ensure we have a valid message index
  const messageIndex = currentEClaimValidationMessageIndex >= 0 ? currentEClaimValidationMessageIndex : 0;
  const currentMessage = eClaimValidationMessages[messageIndex] || '';

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

export default ElectronicClaimValidationMessages;

