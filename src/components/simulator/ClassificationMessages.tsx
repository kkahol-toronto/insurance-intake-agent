import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSimulatorStore } from '../../store/simulatorStore';
import './IngestionMessages.css';

interface ClassificationMessagesProps {
  patientName: string;
  claimNumber: string;
}

function ClassificationMessages({ patientName, claimNumber }: ClassificationMessagesProps) {
  const { 
    classificationMessages, 
    currentClassificationMessageIndex,
    currentNodeId,
    nodes,
    setClassificationMessages,
    setCurrentClassificationMessageIndex,
    updateNodeStatus,
    addLogEvent
  } = useSimulatorStore();
  
  const [isVisible, setIsVisible] = useState(false);
  const hasStartedRef = useRef(false);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const progressionActiveRef = useRef(false);

  useEffect(() => {
    // Check if this is the demo claim
    const isDemoClaim = claimNumber === 'SLF DEN 9997310';
    
    // Check if we're actually at the classification node
    const isAtClassification = currentNodeId === 'classification';
    
    // Check if the node is already done
    const classificationNode = nodes.find(n => n.id === 'classification');
    const isAlreadyDone = classificationNode?.status === 'done';
    
    // Reset hasStarted if we're no longer at this node
    if (!isAtClassification) {
      hasStartedRef.current = false;
    }
    
    if (!isDemoClaim || !isAtClassification || isAlreadyDone) {
      setIsVisible(false);
      if (!isAtClassification || isAlreadyDone) {
        // Only reset if we're not at this node or it's done
        setClassificationMessages([]);
        setCurrentClassificationMessageIndex(-1);
        hasStartedRef.current = false; // Reset when leaving node
      }
      return;
    }
    
    // If already started, don't restart but keep visible
    if (hasStartedRef.current) {
      // Ensure visibility is maintained if messages exist
      if (classificationMessages.length > 0 && !isVisible) {
        setIsVisible(true);
      }
      return;
    }
    
    // Mark as started to prevent re-triggering
    hasStartedRef.current = true;
    
    // Set up messages
    const messages = [
      'Dental Claim Detected',
      'Verified Dental Provider',
      'Claim Validated independently to be dental',
      'Assessing Priority',
      'Reading Dental Codes',
      'detected D1110, Prophylactic Care',
      'D0274 Radiological Images',
      'D0120 routine evaluation',
      'No emergency procedure detected',
      'detected priority Low'
    ];
    
    setClassificationMessages(messages);
    setCurrentClassificationMessageIndex(0);
    setIsVisible(true); // Set visible immediately
    
    // Clear any existing timeouts
    timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    timeoutsRef.current = [];
    
    return () => {
      // Don't clear timeouts on cleanup if messages are in progress
      // This allows the message sequence to continue even if the component re-renders
      // Only clear if we're actually leaving the node
      if (!isAtClassification || isAlreadyDone) {
        timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
        timeoutsRef.current = [];
      }
    };
  }, [patientName, claimNumber, currentNodeId, nodes, setClassificationMessages, setCurrentClassificationMessageIndex, updateNodeStatus, addLogEvent]);
  
  // Separate useEffect to continue message progression
  useEffect(() => {
    // Only continue if we're at classification, messages exist, and sequence is in progress
    if (currentNodeId !== 'classification' || classificationMessages.length === 0) {
      progressionActiveRef.current = false;
      return;
    }
    
    // If we're at the last message, add priority to event log and mark node as done
    if (currentClassificationMessageIndex >= classificationMessages.length - 1) {
      progressionActiveRef.current = false;
      // Mark node as completed and add log event
      const classificationNode = nodes.find(n => n.id === 'classification');
      if (classificationNode?.status !== 'done') {
        setTimeout(() => {
          // Add log event with priority (editable)
          addLogEvent({
            timestamp: Date.now(),
            fromNodeId: 'classification',
            toNodeId: 'classification',
            reason: 'Claim classified and prioritized',
            action: 'setPriority',
            actionData: { 
              priority: 'Low',
              dentalCodes: ['D1110', 'D0274', 'D0120'],
              codeDescriptions: {
                'D1110': 'Prophylactic Care',
                'D0274': 'Radiological Images',
                'D0120': 'routine evaluation'
              }
            }
          });
          updateNodeStatus('classification', 'done');
        }, 1000);
      }
      return;
    }
    
    // If progression is already active, don't start another
    if (progressionActiveRef.current) {
      return;
    }
    
    // If we're at index 0 or higher, continue the sequence
    if (currentClassificationMessageIndex >= 0 && currentClassificationMessageIndex < classificationMessages.length - 1) {
      progressionActiveRef.current = true;
      const messageDelays = [1000, 1200, 1500, 1000, 1200, 1000, 1000, 1000, 1200, 1000]; // milliseconds
      const nextIndex = currentClassificationMessageIndex + 1;
      const delay = messageDelays[nextIndex] || 1000;
      
      const timeout = setTimeout(() => {
        progressionActiveRef.current = false; // Reset so next message can trigger
        setCurrentClassificationMessageIndex(nextIndex);
        setIsVisible(true);
      }, delay);
      
      timeoutsRef.current.push(timeout);
      
      return () => {
        clearTimeout(timeout);
        progressionActiveRef.current = false;
      };
    }
  }, [currentClassificationMessageIndex, classificationMessages.length, currentNodeId, nodes, setCurrentClassificationMessageIndex, updateNodeStatus, addLogEvent]);
  
  // If we have messages but not visible, and we're at the classification node, make visible
  useEffect(() => {
    if (classificationMessages.length > 0 && !isVisible && currentNodeId === 'classification') {
      setIsVisible(true);
    }
  }, [classificationMessages.length, isVisible, currentNodeId]);

  if (!isVisible || classificationMessages.length === 0) {
    return null;
  }

  // Ensure we have a valid message index
  const messageIndex = currentClassificationMessageIndex >= 0 ? currentClassificationMessageIndex : 0;
  const currentMessage = classificationMessages[messageIndex] || '';

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

export default ClassificationMessages;

