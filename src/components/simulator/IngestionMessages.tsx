import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSimulatorStore } from '../../store/simulatorStore';
import './IngestionMessages.css';

interface IngestionMessagesProps {
  patientName: string;
  claimNumber: string;
}

function IngestionMessages({ patientName, claimNumber }: IngestionMessagesProps) {
  const { 
    ingestionMessages, 
    currentIngestionMessageIndex,
    showExtractionLink,
    currentNodeId,
    nodes,
    setIngestionMessages,
    setCurrentIngestionMessageIndex,
    setShowExtractionLink,
    addLogEvent
  } = useSimulatorStore();
  
  const [isVisible, setIsVisible] = useState(false);
  const hasStartedRef = useRef(false);
  const currentIndexRef = useRef(0);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const progressionActiveRef = useRef(false);

  useEffect(() => {
    // Check if this is the demo claim (or allow all for testing)
    const isDemoClaim = claimNumber === 'SLF DEN 9997310' || true; // Temporarily allow all claims for testing
    
    // Check if we're actually at the ingestion node
    const isAtIngestion = currentNodeId === 'ingestion';
    
    // Check if the node is already done
    const ingestionNode = nodes.find(n => n.id === 'ingestion');
    const isAlreadyDone = ingestionNode?.status === 'done';
    
    // Reset hasStarted if we're no longer at this node
    if (!isAtIngestion) {
      hasStartedRef.current = false;
    }
    
    // Debug: Log the conditions
    console.log('IngestionMessages Conditions:', {
      isDemoClaim,
      isAtIngestion,
      isAlreadyDone,
      hasStarted: hasStartedRef.current,
      claimNumber,
      currentNodeId,
      nodeStatus: ingestionNode?.status
    });
    
    if (!isDemoClaim || !isAtIngestion || isAlreadyDone) {
      console.log('IngestionMessages: Conditions not met, returning early');
      setIsVisible(false);
      if (!isAtIngestion || isAlreadyDone) {
        // Only reset if we're not at this node or it's done
        setIngestionMessages([]);
        setCurrentIngestionMessageIndex(-1);
        setShowExtractionLink(false);
        hasStartedRef.current = false; // Reset when leaving node
      }
      return;
    }
    
    // If already started, don't restart but keep visible
    if (hasStartedRef.current) {
      console.log('IngestionMessages: Already started, keeping visible');
      // Ensure visibility is maintained if messages exist
      if (ingestionMessages.length > 0 && !isVisible) {
        console.log('IngestionMessages: Restoring visibility for existing messages');
        setIsVisible(true);
      }
      // Don't return early - let the message progression continue
      // The separate useEffect will handle continuing the sequence
      return;
    }
    
    // Mark as started to prevent re-triggering
    hasStartedRef.current = true;
    
    console.log('Starting ingestion messages for claim:', claimNumber);
    
    // Set up messages first
    const messages = [
      `I am looking for data related to this case: ${patientName}`,
      'Finding email...',
      'Finding fax...',
      'Data found on email',
      'Extracting data from the file... (utilizing PDF to Knowledge Agent)',
      'Done'
    ];
    
    console.log('Setting ingestion messages:', messages);
    
    // Set messages and index together, then set visible immediately
    setIngestionMessages(messages);
    setCurrentIngestionMessageIndex(0);
    setShowExtractionLink(false);
    setIsVisible(true); // Set visible immediately
    console.log('Set isVisible to true immediately');
    
    // Show messages one by one with delays
    currentIndexRef.current = 0; // Reset index
    const messageDelays = [1000, 1500, 1500, 1000, 2000, 1000]; // milliseconds
    
    // Clear any existing timeouts
    timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    timeoutsRef.current = [];
    
    const showNextMessage = () => {
      if (currentIndexRef.current < messages.length - 1) {
        currentIndexRef.current++;
        console.log('Showing next message, index:', currentIndexRef.current, 'message:', messages[currentIndexRef.current]);
        setCurrentIngestionMessageIndex(currentIndexRef.current);
        
        // Ensure visibility is maintained
        setIsVisible(true);
        
        if (currentIndexRef.current < messages.length - 1) {
          const timeout = setTimeout(showNextMessage, messageDelays[currentIndexRef.current]);
          timeoutsRef.current.push(timeout);
        } else {
          // Add extraction link to event log after "Done"
          const linkTimeout = setTimeout(() => {
            setShowExtractionLink(true);
            // Add log event with extraction link
            addLogEvent({
              timestamp: Date.now(),
              fromNodeId: 'ingestion',
              toNodeId: 'ingestion',
              reason: 'Data extraction completed',
              action: 'showExtraction',
              actionData: { claimNumber, patientName }
            });
          }, 1000);
          timeoutsRef.current.push(linkTimeout);
        }
      }
    };
    
    // First message (index 0) should already be showing since we set currentIndex to 0
    // Start showing next messages after initial delay
    console.log('Starting message sequence, first message should be visible now');
    const initialTimeout = setTimeout(() => {
      console.log('Starting to show next message after delay');
      showNextMessage();
    }, messageDelays[0]);
    timeoutsRef.current.push(initialTimeout);
    
    return () => {
      // Don't clear timeouts on cleanup if messages are in progress
      // This allows the message sequence to continue even if the component re-renders
      // Only clear if we're actually leaving the node
      if (!isAtIngestion || isAlreadyDone) {
        timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
        timeoutsRef.current = [];
      }
    };
  }, [patientName, claimNumber, currentNodeId, nodes, setIngestionMessages, setCurrentIngestionMessageIndex, setShowExtractionLink, addLogEvent]);
  
  // Separate useEffect to continue message progression
  useEffect(() => {
    // Only continue if we're at ingestion, messages exist, and sequence is in progress
    if (currentNodeId !== 'ingestion' || ingestionMessages.length === 0) {
      progressionActiveRef.current = false;
      return;
    }
    
    // If we're at the last message, don't continue
    if (currentIngestionMessageIndex >= ingestionMessages.length - 1) {
      progressionActiveRef.current = false;
      return;
    }
    
    // If progression is already active, don't start another
    if (progressionActiveRef.current) {
      return;
    }
    
    // If we're at index 0 or higher, continue the sequence
    if (currentIngestionMessageIndex >= 0 && currentIngestionMessageIndex < ingestionMessages.length - 1) {
      progressionActiveRef.current = true;
      const messageDelays = [1000, 1500, 1500, 1000, 2000, 1000]; // milliseconds
      const nextIndex = currentIngestionMessageIndex + 1;
      const delay = messageDelays[nextIndex] || 1000;
      
      console.log('IngestionMessages: Continuing sequence, next index:', nextIndex, 'delay:', delay);
      
      const timeout = setTimeout(() => {
        console.log('IngestionMessages: Advancing to next message, index:', nextIndex);
        progressionActiveRef.current = false; // Reset so next message can trigger
        setCurrentIngestionMessageIndex(nextIndex);
        setIsVisible(true);
        
        // If this is the last message, add extraction link
        if (nextIndex === ingestionMessages.length - 1) {
          setTimeout(() => {
            setShowExtractionLink(true);
            addLogEvent({
              timestamp: Date.now(),
              fromNodeId: 'ingestion',
              toNodeId: 'ingestion',
              reason: 'Data extraction completed',
              action: 'showExtraction',
              actionData: { claimNumber, patientName }
            });
          }, 1000);
        }
      }, delay);
      
      timeoutsRef.current.push(timeout);
      
      return () => {
        clearTimeout(timeout);
        progressionActiveRef.current = false;
      };
    }
  }, [currentIngestionMessageIndex, ingestionMessages.length, currentNodeId, claimNumber, patientName, setCurrentIngestionMessageIndex, setShowExtractionLink, addLogEvent]);

  // Debug logging
  useEffect(() => {
    if (currentNodeId === 'ingestion') {
      console.log('IngestionMessages Debug:', {
        isVisible,
        messagesCount: ingestionMessages.length,
        currentIndex: currentIngestionMessageIndex,
        claimNumber,
        isDemoClaim: claimNumber === 'SLF DEN 9997310',
        currentNodeId,
        hasStarted: hasStartedRef.current,
        nodeStatus: nodes.find(n => n.id === 'ingestion')?.status
      });
    }
  }, [isVisible, ingestionMessages.length, currentIngestionMessageIndex, currentNodeId, claimNumber, nodes]);

  // Debug render check
  console.log('IngestionMessages Render Check:', {
    isVisible,
    messagesLength: ingestionMessages.length,
    currentIndex: currentIngestionMessageIndex,
    currentNodeId,
    claimNumber
  });

  // If we have messages but not visible, and we're at the ingestion node, make visible
  useEffect(() => {
    if (ingestionMessages.length > 0 && !isVisible && currentNodeId === 'ingestion') {
      console.log('IngestionMessages: Restoring visibility - messages exist but not visible');
      setIsVisible(true);
    }
  }, [ingestionMessages.length, isVisible, currentNodeId]);

  if (!isVisible || ingestionMessages.length === 0) {
    console.log('IngestionMessages: Not rendering - isVisible:', isVisible, 'messagesLength:', ingestionMessages.length);
    return null;
  }

  // Ensure we have a valid message index
  const messageIndex = currentIngestionMessageIndex >= 0 ? currentIngestionMessageIndex : 0;
  const currentMessage = ingestionMessages[messageIndex] || '';

  console.log('IngestionMessages: Rendering message:', {
    messageIndex,
    currentMessage,
    totalMessages: ingestionMessages.length
  });

  if (!currentMessage) {
    console.log('IngestionMessages: No current message, returning null');
    return null;
  }

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

export default IngestionMessages;

