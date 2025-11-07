import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSimulatorStore } from '../../store/simulatorStore';
import './IngestionMessages.css';

interface ClaimDataEntryMessagesProps {
  patientName: string;
  claimNumber: string;
}

function ClaimDataEntryMessages({ patientName, claimNumber }: ClaimDataEntryMessagesProps) {
  const {
    claimDataEntryMessages,
    currentClaimDataEntryMessageIndex,
    currentNodeId,
    nodes,
    setClaimDataEntryMessages,
    setCurrentClaimDataEntryMessageIndex,
    updateNodeStatus
  } = useSimulatorStore();

  const [isVisible, setIsVisible] = useState(false);
  const hasStartedRef = useRef(false);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const progressionActiveRef = useRef(false);

  useEffect(() => {
    const isDemoClaim = claimNumber === 'SLF DEN 9997310';
    const isAtDataEntry = currentNodeId === 'dataEntryChess';
    const dataEntryNode = nodes.find(n => n.id === 'dataEntryChess');
    const isAlreadyDone = dataEntryNode?.status === 'done';

    if (!isAtDataEntry) {
      hasStartedRef.current = false;
    }

    if (!isDemoClaim || !isAtDataEntry || isAlreadyDone) {
      setIsVisible(false);
      if (!isAtDataEntry || isAlreadyDone) {
        setClaimDataEntryMessages([]);
        setCurrentClaimDataEntryMessageIndex(-1);
      }
      return;
    }

    if (hasStartedRef.current) {
      if (claimDataEntryMessages.length > 0 && !isVisible) {
        setIsVisible(true);
      }
      return;
    }

    hasStartedRef.current = true;

    const messages = [
      'Connected to CHESS',
      'Data sent to CHESS',
      'Querying CHESS to ensure data is present',
      `Sending query for patient name: ${patientName}`,
      `Patient name retrieved: ${patientName} ✅`,
      'Data entry to CHESS complete'
    ];

    setClaimDataEntryMessages(messages);
    setCurrentClaimDataEntryMessageIndex(0);
    setIsVisible(true);

    timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    timeoutsRef.current = [];

    return () => {
      if (!isAtDataEntry || isAlreadyDone) {
        timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
        timeoutsRef.current = [];
      }
    };
  }, [patientName, claimNumber, currentNodeId, nodes, setClaimDataEntryMessages, setCurrentClaimDataEntryMessageIndex, updateNodeStatus, claimDataEntryMessages.length, isVisible]);

  useEffect(() => {
    if (currentNodeId !== 'dataEntryChess' || claimDataEntryMessages.length === 0) {
      progressionActiveRef.current = false;
      return;
    }

    if (currentClaimDataEntryMessageIndex >= claimDataEntryMessages.length - 1) {
      progressionActiveRef.current = false;
      const dataEntryNode = nodes.find(n => n.id === 'dataEntryChess');
      if (dataEntryNode?.status !== 'done') {
        updateNodeStatus('dataEntryChess', 'done');
      }
      return;
    }

    if (progressionActiveRef.current) {
      return;
    }

    if (currentClaimDataEntryMessageIndex >= 0 && currentClaimDataEntryMessageIndex < claimDataEntryMessages.length - 1) {
      progressionActiveRef.current = true;
      const messageDelays = [3000, 3000, 3000, 3000, 3000, 3000];
      const nextIndex = currentClaimDataEntryMessageIndex + 1;
      const delay = messageDelays[nextIndex] || 3000;

      const timeout = setTimeout(() => {
        progressionActiveRef.current = false;
        setCurrentClaimDataEntryMessageIndex(nextIndex);
        setIsVisible(true);
      }, delay);

      timeoutsRef.current.push(timeout);

      return () => {
        clearTimeout(timeout);
        progressionActiveRef.current = false;
      };
    }
  }, [currentClaimDataEntryMessageIndex, claimDataEntryMessages.length, currentNodeId, nodes, setCurrentClaimDataEntryMessageIndex, updateNodeStatus]);

  useEffect(() => {
    if (claimDataEntryMessages.length > 0 && !isVisible && currentNodeId === 'dataEntryChess') {
      setIsVisible(true);
    }
  }, [claimDataEntryMessages.length, isVisible, currentNodeId]);

  if (!isVisible || claimDataEntryMessages.length === 0) {
    return null;
  }

  const messageIndex = currentClaimDataEntryMessageIndex >= 0 ? currentClaimDataEntryMessageIndex : 0;
  const currentMessage = claimDataEntryMessages[messageIndex] || '';

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

export default ClaimDataEntryMessages;
