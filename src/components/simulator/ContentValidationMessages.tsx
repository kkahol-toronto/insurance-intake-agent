import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSimulatorStore } from '../../store/simulatorStore';
import './IngestionMessages.css';

interface ContentValidationMessagesProps {
  patientName: string;
  claimNumber: string;
}

function ContentValidationMessages({ patientName, claimNumber }: ContentValidationMessagesProps) {
  const { 
    contentValidationMessages, 
    currentContentValidationMessageIndex,
    currentNodeId,
    nodes,
    setContentValidationMessages,
    setCurrentContentValidationMessageIndex,
    updateNodeStatus
  } = useSimulatorStore();
  
  const [isVisible, setIsVisible] = useState(false);
  const hasStartedRef = useRef(false);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const progressionActiveRef = useRef(false);

  useEffect(() => {
    // Check if this is the demo claim
    const isDemoClaim = claimNumber === 'SLF DEN 9997310';
    
    // Check if we're actually at the contentValidation node
    const isAtContentValidation = currentNodeId === 'contentValidation';
    
    // Check if the node is already done
    const contentValidationNode = nodes.find(n => n.id === 'contentValidation');
    const isAlreadyDone = contentValidationNode?.status === 'done';
    
    // Reset hasStarted if we're no longer at this node
    if (!isAtContentValidation) {
      hasStartedRef.current = false;
    }
    
    if (!isDemoClaim || !isAtContentValidation || isAlreadyDone) {
      setIsVisible(false);
      if (!isAtContentValidation || isAlreadyDone) {
        // Only reset if we're not at this node or it's done
        setContentValidationMessages([]);
        setCurrentContentValidationMessageIndex(-1);
        hasStartedRef.current = false; // Reset when leaving node
      }
      return;
    }
    
    // If already started, don't restart but keep visible
    if (hasStartedRef.current) {
      // Ensure visibility is maintained if messages exist
      if (contentValidationMessages.length > 0 && !isVisible) {
        setIsVisible(true);
      }
      return;
    }
    
    // Mark as started to prevent re-triggering
    hasStartedRef.current = true;
    
    // Set up messages
    const messages = [
      'Doing double check of extracted data',
      'Extracting data with Document Intelligence',
      'Data Extracted',
      'Matching with original extraction data...',
      'Match with data 98.9%. Most mismatches are on spaces',
      'Verifying Procedure Codes D1110, D0274, D0120 confirmed',
      'Dentist Fee Requested $130, $80 $100 Confirmed',
      'Checking rule book for additional data completion',
      'Reviewing rule book',
      'No additional document required for the given codes',
      'Done: Documents and Claims are in good order'
    ];
    
    setContentValidationMessages(messages);
    setCurrentContentValidationMessageIndex(0);
    setIsVisible(true); // Set visible immediately
    
    // Clear any existing timeouts
    timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    timeoutsRef.current = [];
    
    return () => {
      // Don't clear timeouts on cleanup if messages are in progress
      // This allows the message sequence to continue even if the component re-renders
      // Only clear if we're actually leaving the node
      if (!isAtContentValidation || isAlreadyDone) {
        timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
        timeoutsRef.current = [];
      }
    };
  }, [patientName, claimNumber, currentNodeId, nodes, setContentValidationMessages, setCurrentContentValidationMessageIndex, updateNodeStatus]);
  
  // Separate useEffect to continue message progression
  useEffect(() => {
    // Only continue if we're at contentValidation, messages exist, and sequence is in progress
    if (currentNodeId !== 'contentValidation' || contentValidationMessages.length === 0) {
      progressionActiveRef.current = false;
      return;
    }
    
    // If we're at the last message, mark as done and don't continue
    if (currentContentValidationMessageIndex >= contentValidationMessages.length - 1) {
      progressionActiveRef.current = false;
      // Mark node as completed after 3 seconds (to keep the Done message visible)
      const contentValidationNode = nodes.find(n => n.id === 'contentValidation');
      if (contentValidationNode?.status !== 'done') {
        setTimeout(() => {
          updateNodeStatus('contentValidation', 'done');
        }, 3000); // 3 seconds delay
      }
      return;
    }
    
    // If progression is already active, don't start another
    if (progressionActiveRef.current) {
      return;
    }
    
    // If we're at index 0 or higher, continue the sequence
    if (currentContentValidationMessageIndex >= 0 && currentContentValidationMessageIndex < contentValidationMessages.length - 1) {
      progressionActiveRef.current = true;
      // Message delays: [0: 1000, 1: 1200, 2: 1500, 3: 1000, 4: 6000 (wait 6 seconds), 5: 2000, 6: 2000, 7: 1500, 8: 1500, 9: 1500, 10: 1000]
      const messageDelays = [1000, 1200, 1500, 1000, 6000, 2000, 2000, 1500, 1500, 1500, 1000]; // milliseconds
      const nextIndex = currentContentValidationMessageIndex + 1;
      const delay = messageDelays[nextIndex] || 1000;
      
      const timeout = setTimeout(() => {
        progressionActiveRef.current = false; // Reset so next message can trigger
        setCurrentContentValidationMessageIndex(nextIndex);
        setIsVisible(true);
      }, delay);
      
      timeoutsRef.current.push(timeout);
      
      return () => {
        clearTimeout(timeout);
        progressionActiveRef.current = false;
      };
    }
  }, [currentContentValidationMessageIndex, contentValidationMessages.length, currentNodeId, nodes, setCurrentContentValidationMessageIndex, updateNodeStatus]);
  
  // If we have messages but not visible, and we're at the contentValidation node, make visible
  useEffect(() => {
    if (contentValidationMessages.length > 0 && !isVisible && currentNodeId === 'contentValidation') {
      setIsVisible(true);
    }
  }, [contentValidationMessages.length, isVisible, currentNodeId]);

  if (!isVisible || contentValidationMessages.length === 0) {
    return null;
  }

  // Ensure we have a valid message index
  const messageIndex = currentContentValidationMessageIndex >= 0 ? currentContentValidationMessageIndex : 0;
  const currentMessage = contentValidationMessages[messageIndex] || '';

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

export default ContentValidationMessages;

