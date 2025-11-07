import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSimulatorStore } from '../../store/simulatorStore';
import './IngestionMessages.css';

interface DataEnrichmentMessagesProps {
  patientName: string;
  claimNumber: string;
}

function DataEnrichmentMessages({ patientName, claimNumber }: DataEnrichmentMessagesProps) {
  const { 
    dataEnrichmentMessages, 
    currentDataEnrichmentMessageIndex,
    currentNodeId,
    nodes,
    setDataEnrichmentMessages,
    setCurrentDataEnrichmentMessageIndex,
    updateNodeStatus
  } = useSimulatorStore();
  
  const [isVisible, setIsVisible] = useState(false);
  const hasStartedRef = useRef(false);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const progressionActiveRef = useRef(false);

  useEffect(() => {
    // Check if this is the demo claim
    const isDemoClaim = claimNumber === 'SLF DEN 9997310';
    
    // Check if we're actually at the dataEnrichment node
    const isAtDataEnrichment = currentNodeId === 'dataEnrichment';
    
    // Check if the node is already done
    const dataEnrichmentNode = nodes.find(n => n.id === 'dataEnrichment');
    const isAlreadyDone = dataEnrichmentNode?.status === 'done';
    
    // Reset hasStarted if we're no longer at this node
    if (!isAtDataEnrichment) {
      hasStartedRef.current = false;
    }
    
    if (!isDemoClaim || !isAtDataEnrichment || isAlreadyDone) {
      setIsVisible(false);
      if (!isAtDataEnrichment || isAlreadyDone) {
        // Only reset if we're not at this node or it's done
        setDataEnrichmentMessages([]);
        setCurrentDataEnrichmentMessageIndex(-1);
        hasStartedRef.current = false; // Reset when leaving node
      }
      return;
    }
    
    // If already started, don't restart but keep visible
    if (hasStartedRef.current) {
      // Ensure visibility is maintained if messages exist
      if (dataEnrichmentMessages.length > 0 && !isVisible) {
        setIsVisible(true);
      }
      return;
    }
    
    // Mark as started to prevent re-triggering
    hasStartedRef.current = true;
    
    // Set up messages
    const messages = [
      'Member ID extracted',
      'Member ID confirmed as being active',
      'Member Plan ID confirmed as active',
      'Connecting to Chess Database...',
      'Chess information verified',
      'Connecting with Pega...',
      'Connection established',
      'Connecting to Specter..',
      'Connection established',
      'Data Enrichment and verification Done'
    ];
    
    setDataEnrichmentMessages(messages);
    setCurrentDataEnrichmentMessageIndex(0);
    setIsVisible(true); // Set visible immediately
    
    // Clear any existing timeouts
    timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    timeoutsRef.current = [];
    
    return () => {
      // Don't clear timeouts on cleanup if messages are in progress
      // This allows the message sequence to continue even if the component re-renders
      // Only clear if we're actually leaving the node
      if (!isAtDataEnrichment || isAlreadyDone) {
        timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
        timeoutsRef.current = [];
      }
    };
  }, [patientName, claimNumber, currentNodeId, nodes, setDataEnrichmentMessages, setCurrentDataEnrichmentMessageIndex, updateNodeStatus]);
  
  // Separate useEffect to continue message progression
  useEffect(() => {
    // Only continue if we're at dataEnrichment, messages exist, and sequence is in progress
    if (currentNodeId !== 'dataEnrichment' || dataEnrichmentMessages.length === 0) {
      progressionActiveRef.current = false;
      return;
    }
    
    // If we're at the last message, mark as done and don't continue
    if (currentDataEnrichmentMessageIndex >= dataEnrichmentMessages.length - 1) {
      progressionActiveRef.current = false;
      // Mark node as completed after 4 seconds (to keep the Done message visible)
      const dataEnrichmentNode = nodes.find(n => n.id === 'dataEnrichment');
      if (dataEnrichmentNode?.status !== 'done') {
        setTimeout(() => {
          updateNodeStatus('dataEnrichment', 'done');
        }, 4000); // 4 seconds delay
      }
      return;
    }
    
    // If progression is already active, don't start another
    if (progressionActiveRef.current) {
      return;
    }
    
    // If we're at index 0 or higher, continue the sequence
    if (currentDataEnrichmentMessageIndex >= 0 && currentDataEnrichmentMessageIndex < dataEnrichmentMessages.length - 1) {
      progressionActiveRef.current = true;
      // Message delays: [0: 1000, 1: 1200, 2: 1500, 3: 4000 (wait 4 seconds), 4: 2000, 5: 1500, 6: 1500, 7: 1500, 8: 1500, 9: 4000 (stay for 4 seconds)]
      const messageDelays = [1000, 1200, 1500, 4000, 2000, 1500, 1500, 1500, 1500, 4000]; // milliseconds
      const nextIndex = currentDataEnrichmentMessageIndex + 1;
      const delay = messageDelays[nextIndex] || 1000;
      
      const timeout = setTimeout(() => {
        progressionActiveRef.current = false; // Reset so next message can trigger
        setCurrentDataEnrichmentMessageIndex(nextIndex);
        setIsVisible(true);
      }, delay);
      
      timeoutsRef.current.push(timeout);
      
      return () => {
        clearTimeout(timeout);
        progressionActiveRef.current = false;
      };
    }
  }, [currentDataEnrichmentMessageIndex, dataEnrichmentMessages.length, currentNodeId, nodes, setCurrentDataEnrichmentMessageIndex, updateNodeStatus]);
  
  // If we have messages but not visible, and we're at the dataEnrichment node, make visible
  useEffect(() => {
    if (dataEnrichmentMessages.length > 0 && !isVisible && currentNodeId === 'dataEnrichment') {
      setIsVisible(true);
    }
  }, [dataEnrichmentMessages.length, isVisible, currentNodeId]);

  if (!isVisible || dataEnrichmentMessages.length === 0) {
    return null;
  }

  // Ensure we have a valid message index
  const messageIndex = currentDataEnrichmentMessageIndex >= 0 ? currentDataEnrichmentMessageIndex : 0;
  const currentMessage = dataEnrichmentMessages[messageIndex] || '';

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

export default DataEnrichmentMessages;

