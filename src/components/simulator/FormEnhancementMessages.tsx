import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSimulatorStore } from '../../store/simulatorStore';
import './IngestionMessages.css';

interface FormEnhancementMessagesProps {
  patientName: string;
  claimNumber: string;
}

function FormEnhancementMessages({ patientName, claimNumber }: FormEnhancementMessagesProps) {
  const { 
    formEnhancementMessages, 
    currentFormEnhancementMessageIndex,
    currentNodeId,
    nodes,
    setFormEnhancementMessages,
    setCurrentFormEnhancementMessageIndex,
    updateNodeStatus
  } = useSimulatorStore();
  
  const [isVisible, setIsVisible] = useState(false);
  const hasStartedRef = useRef(false);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const progressionActiveRef = useRef(false);

  useEffect(() => {
    // Check if this is the demo claim
    const isDemoClaim = claimNumber === 'SLF DEN 9997310';
    
    // Check if we're actually at the formEnhancement node
    const isAtFormEnhancement = currentNodeId === 'formEnhancement';
    
    // Check if the node is already done
    const formEnhancementNode = nodes.find(n => n.id === 'formEnhancement');
    const isAlreadyDone = formEnhancementNode?.status === 'done';
    
    // Reset hasStarted if we're no longer at this node
    if (!isAtFormEnhancement) {
      hasStartedRef.current = false;
    }
    
    if (!isDemoClaim || !isAtFormEnhancement || isAlreadyDone) {
      setIsVisible(false);
      if (!isAtFormEnhancement || isAlreadyDone) {
        // Only reset if we're not at this node or it's done
        setFormEnhancementMessages([]);
        setCurrentFormEnhancementMessageIndex(-1);
        hasStartedRef.current = false; // Reset when leaving node
      }
      return;
    }
    
    // If already started, don't restart but keep visible
    if (hasStartedRef.current) {
      // Ensure visibility is maintained if messages exist
      if (formEnhancementMessages.length > 0 && !isVisible) {
        setIsVisible(true);
      }
      return;
    }
    
    // Mark as started to prevent re-triggering
    hasStartedRef.current = true;
    
    // Set up messages
    const messages = [
      'Detecting PDF for claims...',
      'Single claim detected',
      'Image quality assessment initiated',
      'Image quality: High',
      'Edge detection: High',
      'DPI: 160',
      'Signature of Subscriber: Clear',
      'Signature of Patient: Clear',
      'Provider Signature: Clear',
      'Daytime phone number: Out of the box but readable',
      'Claim form enhancement completed'
    ];
    
    setFormEnhancementMessages(messages);
    setCurrentFormEnhancementMessageIndex(0);
    setIsVisible(true); // Set visible immediately
    
    // Clear any existing timeouts
    timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    timeoutsRef.current = [];
    
    return () => {
      // Don't clear timeouts on cleanup if messages are in progress
      // This allows the message sequence to continue even if the component re-renders
      // Only clear if we're actually leaving the node
      if (!isAtFormEnhancement || isAlreadyDone) {
        timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
        timeoutsRef.current = [];
      }
    };
  }, [patientName, claimNumber, currentNodeId, nodes, setFormEnhancementMessages, setCurrentFormEnhancementMessageIndex, updateNodeStatus]);
  
  // Separate useEffect to continue message progression
  useEffect(() => {
    // Only continue if we're at formEnhancement, messages exist, and sequence is in progress
    if (currentNodeId !== 'formEnhancement' || formEnhancementMessages.length === 0) {
      progressionActiveRef.current = false;
      return;
    }
    
    // If we're at the last message, mark as done and don't continue
    if (currentFormEnhancementMessageIndex >= formEnhancementMessages.length - 1) {
      progressionActiveRef.current = false;
      // Mark node as completed after 3 seconds (to keep the Done message visible)
      const formEnhancementNode = nodes.find(n => n.id === 'formEnhancement');
      if (formEnhancementNode?.status !== 'done') {
        setTimeout(() => {
          updateNodeStatus('formEnhancement', 'done');
        }, 3000); // 3 seconds delay
      }
      return;
    }
    
    // If progression is already active, don't start another
    if (progressionActiveRef.current) {
      return;
    }
    
    // If we're at index 0 or higher, continue the sequence
    if (currentFormEnhancementMessageIndex >= 0 && currentFormEnhancementMessageIndex < formEnhancementMessages.length - 1) {
      progressionActiveRef.current = true;
      // Each message stays for 2 seconds, last one stays for 3 seconds
      const messageDelays = [2000, 2000, 2000, 2000, 2000, 2000, 2000, 2000, 2000, 2000, 3000]; // milliseconds
      const nextIndex = currentFormEnhancementMessageIndex + 1;
      const delay = messageDelays[nextIndex] || 2000;
      
      const timeout = setTimeout(() => {
        progressionActiveRef.current = false; // Reset so next message can trigger
        setCurrentFormEnhancementMessageIndex(nextIndex);
        setIsVisible(true);
      }, delay);
      
      timeoutsRef.current.push(timeout);
      
      return () => {
        clearTimeout(timeout);
        progressionActiveRef.current = false;
      };
    }
  }, [currentFormEnhancementMessageIndex, formEnhancementMessages.length, currentNodeId, nodes, setCurrentFormEnhancementMessageIndex, updateNodeStatus]);
  
  // If we have messages but not visible, and we're at the formEnhancement node, make visible
  useEffect(() => {
    if (formEnhancementMessages.length > 0 && !isVisible && currentNodeId === 'formEnhancement') {
      setIsVisible(true);
    }
  }, [formEnhancementMessages.length, isVisible, currentNodeId]);

  if (!isVisible || formEnhancementMessages.length === 0) {
    return null;
  }

  const currentMessage = formEnhancementMessages[currentFormEnhancementMessageIndex] || '';

  return (
    <div className="ingestion-messages-container">
      <AnimatePresence mode="wait">
        {currentMessage && (
          <motion.div
            key={currentFormEnhancementMessageIndex}
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

export default FormEnhancementMessages;

