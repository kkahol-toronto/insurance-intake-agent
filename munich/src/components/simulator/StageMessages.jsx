import { useEffect, useRef, useState } from 'react';
import { useFNOLSimulatorStore } from '../../store/fnolSimulatorStore';
import './StageMessages.css';

function StageMessages({ stageId, isActive, caseData }) {
  const { stageMessages, setStageMessages, setCurrentStageMessageIndex } = useFNOLSimulatorStore();
  const messagesLoadedRef = useRef(false);
  const [displayedMessages, setDisplayedMessages] = useState([]);
  const messageIndexRef = useRef(0);
  const timeoutRef = useRef(null);

  // Load messages from caseData if available - only once per stageId
  useEffect(() => {
    if (messagesLoadedRef.current) return; // Only load once
    if (!caseData?.statusData?.logs) return;
    
    const logs = caseData.statusData.logs;
    const stageNameMap = {
      'fnolIngestion': 'FNOL Ingestion',
      'metadataExtraction': 'Metadata Extraction',
      'documentClassification': 'Document Classification',
      'addressNormalization': 'Address Normalization',
      'deduplicationCheck': 'Deduplication Check',
      'policyRetrieval': 'Policy Retrieval',
      'coverageMatching': 'Coverage Matching',
      'premiumCheck': 'Premium Check',
      'coverageIntegrityScore': 'Coverage Integrity Score',
      'severityScoring': 'Severity Scoring',
      'fraudAnomalyCheck': 'Fraud/Anomaly Check',
      'inspectionDecisioning': 'Inspection Decisioning',
      'evidenceCollection': 'Evidence Collection',
      'revalidation': 'Revalidation',
      'propertyDamageEstimation': 'Property Damage Estimation',
      'reserveEstimation': 'Reserve Estimation',
      'managerialEscalation': 'Managerial Escalation & Approval',
      'coverageDetermination': 'Coverage Determination',
      'paymentPreparation': 'Payment Preparation',
      'finalOutcome': 'Final Outcome',
    };
    
    const stageName = stageNameMap[stageId];
    if (stageName) {
      const log = logs.find(l => l.stageName === stageName);
      if (log && log.message) {
        messagesLoadedRef.current = true; // Set before calling setState
        setStageMessages(stageId, [log.message]);
      }
    }
  }, []); // Empty dependency array - only run once on mount

  const messages = stageMessages[stageId] || [];

  useEffect(() => {
    if (!isActive || messages.length === 0) {
      setDisplayedMessages([]);
      messageIndexRef.current = 0;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      return;
    }

    // Reset when stage becomes active
    setDisplayedMessages([]);
    messageIndexRef.current = 0;

    const showNextMessage = () => {
      if (messageIndexRef.current < messages.length) {
        const message = messages[messageIndexRef.current];
        setDisplayedMessages(prev => [...prev, message]);
        setCurrentStageMessageIndex(stageId, messageIndexRef.current);
        messageIndexRef.current++;
        
        // Show next message after 2 seconds
        timeoutRef.current = setTimeout(showNextMessage, 2000);
      }
    };

    // Start showing messages
    showNextMessage();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isActive, stageId, messages, setCurrentStageMessageIndex]);

  if (!isActive || displayedMessages.length === 0) {
    return null;
  }

  return (
    <div className="stage-messages">
      {displayedMessages.map((message, index) => (
        <div key={index} className="stage-message">
          {message}
        </div>
      ))}
    </div>
  );
}

export default StageMessages;

