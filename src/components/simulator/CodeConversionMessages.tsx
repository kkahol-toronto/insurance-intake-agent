import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSimulatorStore } from '../../store/simulatorStore';
import './IngestionMessages.css';
import './CodeConversionPopup.css';

interface CodeConversionMessagesProps {
  patientName: string;
  claimNumber: string;
}

function CodeConversionMessages({ patientName, claimNumber }: CodeConversionMessagesProps) {
  const {
    codeConversionMessages,
    currentCodeConversionMessageIndex,
    currentNodeId,
    nodes,
    showCodeConversionPopup,
    setCodeConversionMessages,
    setCurrentCodeConversionMessageIndex,
    setShowCodeConversionPopup,
    updateNodeStatus
  } = useSimulatorStore();

  const [isVisible, setIsVisible] = useState(false);
  const hasStartedRef = useRef(false);
  const popupShownRef = useRef(false);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const progressionActiveRef = useRef(false);

  useEffect(() => {
    const isDemoClaim = claimNumber === 'SLF DEN 9997310';
    const isAtCodeConversion = currentNodeId === 'codeConversion';
    const codeConversionNode = nodes.find(n => n.id === 'codeConversion');
    const isAlreadyDone = codeConversionNode?.status === 'done';

    if (!isAtCodeConversion) {
      hasStartedRef.current = false;
      popupShownRef.current = false;
      setShowCodeConversionPopup(false);
    }

    if (!isDemoClaim || !isAtCodeConversion || isAlreadyDone) {
      setIsVisible(false);
      if (!isAtCodeConversion || isAlreadyDone) {
        setCodeConversionMessages([]);
        setCurrentCodeConversionMessageIndex(-1);
        setShowCodeConversionPopup(false);
        popupShownRef.current = false;
      }
      return;
    }

    if (hasStartedRef.current) {
      if (codeConversionMessages.length > 0 && !isVisible) {
        setIsVisible(true);
      }
      return;
    }

    hasStartedRef.current = true;

    const messages = [
      'Code Conversion initiated',
      'Gathering standardized dental codes',
      'Generating detailed descriptions',
      'Code summary ready for review'
    ];

    setCodeConversionMessages(messages);
    setCurrentCodeConversionMessageIndex(0);
    setIsVisible(true);

    timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    timeoutsRef.current = [];

    return () => {
      if (!isAtCodeConversion || isAlreadyDone) {
        timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
        timeoutsRef.current = [];
      }
    };
  }, [patientName, claimNumber, currentNodeId, nodes, setCodeConversionMessages, setCurrentCodeConversionMessageIndex, setShowCodeConversionPopup, updateNodeStatus, codeConversionMessages.length, isVisible]);

  useEffect(() => {
    if (currentNodeId !== 'codeConversion' || codeConversionMessages.length === 0) {
      progressionActiveRef.current = false;
      return;
    }

    if (currentCodeConversionMessageIndex >= codeConversionMessages.length - 1) {
      progressionActiveRef.current = false;
      if (!popupShownRef.current) {
        popupShownRef.current = true;
        setShowCodeConversionPopup(true);
        updateNodeStatus('codeConversion', 'done');
      }
      return;
    }

    if (progressionActiveRef.current) {
      return;
    }

    if (currentCodeConversionMessageIndex >= 0 && currentCodeConversionMessageIndex < codeConversionMessages.length - 1) {
      progressionActiveRef.current = true;
      const messageDelays = [3000, 3000, 3000, 3000];
      const nextIndex = currentCodeConversionMessageIndex + 1;
      const delay = messageDelays[nextIndex] || 3000;

      const timeout = setTimeout(() => {
        progressionActiveRef.current = false;
        setCurrentCodeConversionMessageIndex(nextIndex);
        setIsVisible(true);
      }, delay);

      timeoutsRef.current.push(timeout);

      return () => {
        clearTimeout(timeout);
        progressionActiveRef.current = false;
      };
    }
  }, [currentCodeConversionMessageIndex, codeConversionMessages.length, currentNodeId, setCurrentCodeConversionMessageIndex, setShowCodeConversionPopup, updateNodeStatus]);

  useEffect(() => {
    if (codeConversionMessages.length > 0 && !isVisible && currentNodeId === 'codeConversion') {
      setIsVisible(true);
    }
  }, [codeConversionMessages.length, isVisible, currentNodeId]);

  if (!isVisible || codeConversionMessages.length === 0) {
    return (
      <>
        {showCodeConversionPopup && (
          <CodeConversionPopup onClose={() => setShowCodeConversionPopup(false)} />
        )}
      </>
    );
  }

  const messageIndex = currentCodeConversionMessageIndex >= 0 ? currentCodeConversionMessageIndex : 0;
  const currentMessage = codeConversionMessages[messageIndex] || '';

  return (
    <>
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

      {showCodeConversionPopup && (
        <CodeConversionPopup onClose={() => setShowCodeConversionPopup(false)} />
      )}
    </>
  );
}

function CodeConversionPopup({ onClose }: { onClose: () => void }) {
  return (
    <div className="code-conversion-popup-overlay" role="dialog" aria-modal="true">
      <div className="code-conversion-popup">
        <button className="popup-close-btn" onClick={onClose} aria-label="Close code conversion summary">
          ✕
        </button>
        <h2>Medical Codes Gathered</h2>
        <div className="code-conversion-content">
          <section>
            <h3>D1110 – Adult Prophylaxis (Cleaning)</h3>
            <p>
              This code refers to a routine dental cleaning performed on an adult with permanent dentition. The procedure
              involves scaling and polishing the teeth to remove plaque, calculus (tartar), and stains from the tooth surfaces
              above the gum line. It’s primarily a preventive measure meant to maintain oral health, reduce the risk of
              periodontal (gum) disease, and support good hygiene practices. Typically, it is recommended every six months
              for patients without active periodontal disease.
            </p>
          </section>

          <section>
            <h3>D0274 – Bitewing Radiographs (Four Films)</h3>
            <p>
              D0274 is used for a set of four bitewing X-rays, which are diagnostic images showing the upper and lower posterior
              teeth and the height of the alveolar bone. These radiographs help the dentist detect interproximal (between-teeth)
              decay, monitor bone loss due to periodontal disease, and identify any fit issues with existing restorations. Four
              films are generally taken to provide full coverage of both sides of the mouth for adult patients.
            </p>
          </section>

          <section>
            <h3>D0120 – Periodic Oral Evaluation</h3>
            <p>
              This code represents a routine examination performed at periodic intervals (often every six months) for established
              patients. During a D0120 visit, the dentist evaluates the patient’s overall oral health, checks for signs of decay,
              gum disease, or other abnormalities, and assesses any changes since the last visit. It may include reviewing medical
              history, examining soft tissues, charting, and treatment planning as needed. It’s a key component of preventive
              dental care and patient monitoring over time.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

export default CodeConversionMessages;
