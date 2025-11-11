import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSimulatorStore } from '../../store/simulatorStore';
import './IngestionMessages.css';

type ClaimInfo = {
  claimNumber?: string;
  patientName?: string;
  integrationType?: string;
  memberId?: string;
  policyNumber?: string;
  submittedDate?: string;
  city?: string;
  rawData?: Record<string, any>;
};

type ChessStageContext = {
  claimNumber: string;
  patientName: string;
  providerName: string;
  serviceDate: string;
  memberId: string;
  policyNumber: string;
  dossierNumber: string;
  claimType: string;
  facilityAddress: string;
  facilityId: string;
  tpCode: string;
  referralDoctor: string;
  totalAmount: string;
  currency: string;
  finalDecisionStatus: string;
  finalDecisionReason: string;
};

type ChessStageConfig = {
  title: string;
  getMessages: (context: ChessStageContext) => string[];
  delays?: number[];
  doneDelay?: number;
  completionLog?: (context: ChessStageContext) => string;
};

const fallback = (value: string | undefined | null, fallbackValue: string) =>
  value && typeof value === 'string' && value.trim().length > 0 ? value : fallbackValue;

const formatDate = (date: string | undefined): string => {
  if (!date) return 'recent service date';
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? date : parsed.toISOString().split('T')[0];
};

const buildContext = (claim?: ClaimInfo): ChessStageContext => {
  const raw = claim?.rawData ?? {};
  const claimantInfo = raw.ClaimantInformation ?? {};
  const expense = raw.ClaimDetails?.Expense ?? {};
  const invoice = raw.Invoice ?? {};
  const providerInfo = raw.ProviderInformation ?? {};
  const facilityAddress =
    invoice.Address ||
    [providerInfo.Address?.Line1, providerInfo.Address?.City, providerInfo.Address?.Province]
      .filter(Boolean)
      .join(', ') ||
    claim?.city ||
    'listed facility location';

  const providerName =
    fallback(expense.ProviderName, '').trim() ||
    `${fallback(providerInfo.FirstName, '')} ${fallback(providerInfo.LastName, '')}`.trim() ||
    'certified provider';

  const tpCode = fallback(invoice.TP, '').trim();

  const memberId =
    claim?.memberId ||
    fallback(claimantInfo.CertificateOrMemberID, '') ||
    'member identifier';

  const policyNumber =
    claim?.policyNumber ||
    fallback(claimantInfo.PolicyNumber, '') ||
    'policy reference';

  const referralDoctor =
    raw.PrescriptionRequest?.Clinician?.Name ||
    (claim?.patientName?.toUpperCase() === 'ROBIN NOAH' ? 'Dr. Kevin Lauppert' : 'referring clinician');

  const dossierNumber = fallback(invoice.FileNumber, claim?.claimNumber ?? 'case record');

  const claimType = fallback(expense.TypeOfService, 'claim type');

  return {
    claimNumber: claim?.claimNumber || dossierNumber,
    patientName: fallback(claim?.patientName, 'Member'),
    providerName: providerName || 'certified provider',
    serviceDate: formatDate(expense.ServiceDate || claim?.submittedDate),
    memberId,
    policyNumber,
    dossierNumber,
    claimType,
    facilityAddress,
    facilityId: fallback(expense.FacilityId, providerInfo.GenericID || 'facility id'),
    tpCode: tpCode || 'TP reference',
    referralDoctor,
    totalAmount: (() => {
      const amount = raw.total_amount ?? expense.ClaimAmount ?? 0;
      return typeof amount === 'number' ? amount.toFixed(2) : String(amount || '0.00');
    })(),
    currency: raw.currency || expense.Currency || 'CAD',
    finalDecisionStatus: raw.final_decision?.status || 'resolved',
    finalDecisionReason: raw.final_decision?.reason || 'Final decision recorded.'
  };
};

const chessStageConfig: Record<string, ChessStageConfig> = {
  stage1: {
    title: 'Stage 1 – Data Extraction',
    getMessages: (ctx) => [
      '🟩 Stage 1 – Data Extraction',
      'Extracting text and metadata from uploaded claim documents...',
      `Detected claimant: ${ctx.patientName} | Provider: ${ctx.providerName} | Service Date: ${ctx.serviceDate}.`,
      'Located referral note and prescription indicators within document set.'
    ],
    delays: [1000, 1800, 2000, 2000],
    doneDelay: 1800,
    completionLog: (ctx) => `Data extraction completed for ${ctx.patientName}.`
  },
  stage2: {
    title: 'Stage 2 – Claim Identification',
    getMessages: (ctx) => [
      '🟩 Stage 2 – Claim Identification',
      `Using extracted member ID ${ctx.memberId} and policy ${ctx.policyNumber} to search existing CHESS claims.`,
      `Found related ${ctx.claimType.toLowerCase()} entry tagged for review.`,
      'Claim metadata loaded successfully for validation.'
    ],
    delays: [1000, 1800, 2000, 2000],
    doneDelay: 1800,
    completionLog: (ctx) => `Claim lookup completed for member ${ctx.memberId}.`
  },
  stage3: {
    title: 'Stage 3 – Claim Found?',
    getMessages: (ctx) => [
      '🟩 Stage 3 – Claim Found?',
      `Existing claim reference located under dossier ${ctx.dossierNumber}.`,
      'Marking as existing orthotic claim for update rather than creation.',
      'Proceeding to referral and documentation verification.'
    ],
    delays: [1000, 1600, 1800, 1800],
    doneDelay: 1600,
    completionLog: (ctx) => `Existing dossier ${ctx.dossierNumber} confirmed.`
  },
  stage4: {
    title: 'Stage 4 – Policy Check',
    getMessages: (ctx) => [
      '🟩 Stage 4 – Policy Check',
      `Validating policy number ${ctx.policyNumber} against 025907 (AAM special handling).`,
      'Policy not equal to 025907 – standard processing path selected.',
      'Proceeding with CHESS claim validation rules.'
    ],
    delays: [1000, 1600, 1800, 1800],
    doneDelay: 1600,
    completionLog: (ctx) => `Policy ${ctx.policyNumber} cleared for standard processing.`
  },
  stage5: {
    title: 'Stage 5 – Identify Pend Type',
    getMessages: () => [
      '🟩 Stage 5 – Identify Pend Type',
      'Pend reason identified: Missing referral document.',
      'Orthotic claims require a referral less than 12 months old per Sun Life guidelines.',
      'Triggering provider and document verification flow.',
      'Entering an orthotic claim validation path.'
    ],
    delays: [1000, 1600, 1800, 1800, 1800],
    doneDelay: 1800,
    completionLog: () => 'Pend reason confirmed as referral verification.'
  },
  stage6: {
    title: 'Stage 6 – Provider Verification',
    getMessages: (ctx) => [
      '🟩 Stage 6 – Provider Verification',
      `Querying Spectre for provider ${ctx.providerName}${ctx.tpCode ? ` – TP ${ctx.tpCode}` : ''}.`,
      'Provider validated as Certified Orthotist in region.',
      `Facility ID ${ctx.facilityId} confirmed active in registry.`
    ],
    delays: [1000, 1600, 2000, 2000],
    doneDelay: 1800,
    completionLog: (ctx) => `Provider ${ctx.providerName} verified via Spectre.`
  },
  stage7: {
    title: 'Stage 7 – Address & Document Validation',
    getMessages: (ctx) => [
      '🟩 Stage 7 – Address & Document Validation',
      `Matching facility address (${ctx.facilityAddress}) with invoice.`,
      'Cross-checking claim image for attached referral or prescription pages.',
      'Found PDF contains additional page with clinician information — pending review.'
    ],
    delays: [1000, 1600, 1800, 2000],
    doneDelay: 1800,
    completionLog: () => 'Facility address and supporting documents validated.'
  },
  stage8: {
    title: 'Stage 8 – Information Found?',
    getMessages: (ctx) => [
      '🟩 Stage 8 – Information Found?',
      'Extracted referral details from Page 3 of the PDF.',
      `Referral identified as signed by ${ctx.referralDoctor}.`,
      'Referral dated within 12-month window — meets Sun Life criteria for orthotics approval.'
    ],
    delays: [1000, 1600, 1800, 2000],
    doneDelay: 1800,
    completionLog: (ctx) => `Referral from ${ctx.referralDoctor} validated.`
  },
  stage9: {
    title: 'Stage 9 – Document Review',
    getMessages: () => [
      '🟩 Stage 9 – Document Review',
      'Verifying custom-made indication on receipt ("orthèses plantaires moulées à partir d’un moule 3D en cire").',
      'Label qualifies as custom orthotics per policy.',
      'Referral and receipt cross-referenced — criteria satisfied.'
    ],
    delays: [1000, 1600, 1800, 2000],
    doneDelay: 1800,
    completionLog: () => 'Receipt and referral documents reviewed successfully.'
  },
  stage10: {
    title: 'Stage 10 – Related Note Found?',
    getMessages: () => [
      '🟩 Stage 10 – Related Note Found?',
      'Checking CHESS for previous notes or member referral history.',
      'Prior remark found for orthotic claim from same provider.',
      'Merging current referral with existing claim thread for audit continuity.'
    ],
    delays: [1000, 1600, 1800, 2000],
    doneDelay: 1800,
    completionLog: () => 'Linked current referral with prior CHESS notes.'
  },
  stage11: {
    title: 'Stage 11 – Translation & Extraction',
    getMessages: () => [
      '🟩 Stage 11 – Translation & Extraction',
      'Detected bilingual documents (English + French).',
      'Translated clinical sections and referral note for English audit record.',
      'Extracted final service type: Custom Orthotic Pair – Biomechanical Support.'
    ],
    delays: [1000, 1600, 1800, 2000],
    doneDelay: 2000,
    completionLog: () => 'Translation and service extraction completed.'
  },
  stage12: {
    title: 'Stage 12 – Policy Validation Branch',
    getMessages: (ctx) => [
      '🟩 Stage 12 – Policy Validation Branch',
      `Re-checking policy limits and orthotic frequency under plan ${ctx.policyNumber}.`,
      'Policy permits one custom orthotic pair per 12 months.',
      'No frequency conflict detected — eligible for payment.'
    ],
    delays: [1000, 1600, 1800, 2000],
    doneDelay: 2000,
    completionLog: (ctx) => `Policy ${ctx.policyNumber} validated for orthotics.`
  },
  stage13: {
    title: 'Stage 13 – Letter Generation',
    getMessages: (ctx) => [
      '🟩 Stage 13 – Letter Generation',
      'No denial required — generating confirmation note in HEMSTER.',
      `Documenting referral source as ${ctx.referralDoctor} (Page 3).`,
      'Letter queued for member notification and provider confirmation.'
    ],
    delays: [1000, 1600, 1800, 2000],
    doneDelay: 2000,
    completionLog: () => 'Confirmation letter prepared.'
  },
  stage14: {
    title: 'Stage 14 – Update CHESS',
    getMessages: (ctx) => [
      '🟩 Stage 14 – Update CHESS',
      'Updating CHESS record with validated referral and translated notes.',
      `Flagging claim ${ctx.dossierNumber} as referral verified – custom orthotic approved.`,
      `All supporting docs archived under claimant ${ctx.patientName}.`
    ],
    delays: [1000, 1600, 1800, 2000],
    doneDelay: 2000,
    completionLog: (ctx) => `CHESS updated for dossier ${ctx.dossierNumber}.`
  },
  stage15: {
    title: 'Stage 15 – Outcomes',
    getMessages: (ctx) => [
      '🟩 Stage 15 – Outcomes',
      'All verification stages complete — claim ready for release.',
      `CHESS status: Paid – Referral validated from ${ctx.referralDoctor}.`,
      'Workflow marked as resolved and logged for audit review.'
    ],
    delays: [1000, 1600, 2000, 2200],
    doneDelay: 2200,
    completionLog: (ctx) => `Claim ${ctx.dossierNumber} ready for payout.`
  }
};

export const chessStageIds = Object.keys(chessStageConfig);

type StageOverride = Partial<Omit<ChessStageConfig, 'getMessages'>> & {
  getMessages?: (context: ChessStageContext) => string[];
};

const claimStageOverrides: Record<string, Record<string, StageOverride>> = {
  '2024160967595412': {
    stage1: {
      getMessages: () => [
        '🟩 Stage 1 – Data Extraction',
        'Claim PDF uploaded — extracting patient and provider details from the document.'
      ]
    },
    stage2: {
      getMessages: (ctx) => [
        '🟩 Stage 2 – Claim Identification',
        `Claim ${ctx.claimNumber} identified for claimant ${ctx.patientName} under policy ${ctx.policyNumber}.`
      ]
    },
    stage3: {
      getMessages: () => [
        '🟩 Stage 3 – Claim Found?',
        'Existing pended claim located in CHESS system (reason: Unspecified Service).'
      ]
    },
    stage4: {
      getMessages: () => [
        '🟩 Stage 4 – Policy Check',
        'Policy verified as active — no coordination of benefits (COB: N).'
      ]
    },
    stage5: {
      getMessages: () => [
        '🟩 Stage 5 – Identify Pend Type',
        'Pend category determined: Missing supporting document (e.g., referral or diagnostic note).'
      ]
    },
    stage6: {
      getMessages: (ctx) => [
        '🟩 Stage 6 – Provider Verification',
        `Provider “${ctx.providerName}” validated — diagnostic radiology facility, license ID 004321600 (QC).`
      ]
    },
    stage7: {
      getMessages: () => [
        '🟩 Stage 7 – Address & Document Validation',
        'Provider location (QC, J4Y 0E2) and contact verified with facility records.'
      ],
      completionLog: (ctx) => `QC facility verification completed for ${ctx.providerName}.`
    },
    stage8: {
      getMessages: () => [
        '🟩 Stage 8 – Information Found?',
        "Referral text “Ref: Dr. Pam Shrivatsa” detected within the claim document."
      ]
    },
    stage9: {
      getMessages: () => [
        '🟩 Stage 9 – Document Review',
        'Referral verified and correctly associated with MRI Lumbar Spine (8576L) service.'
      ]
    },
    stage10: {
      getMessages: () => [
        '🟩 Stage 10 – Related Note Found?',
        'Linked note and medical record validated; data consistency confirmed.'
      ]
    },
    stage11: {
      getMessages: () => [
        '🟩 Stage 11 – Translation & Extraction',
        'Standardized diagnostic and referral details prepared for policy validation pipeline.'
      ]
    },
    stage12: {
      getMessages: (ctx) => [
        '🟩 Stage 12 – Policy Validation Branch',
        `Radiology claim amount $${ctx.totalAmount} < $1000 threshold — meets criteria for automatic approval.`
      ],
      completionLog: (ctx) => `Policy approval threshold met for $${ctx.totalAmount} ${ctx.currency}.`
    },
    stage13: {
      getMessages: (ctx) => [
        '🟩 Stage 13 – Letter Generation',
        `Approval communication generated for claimant ${ctx.patientName}.`
      ]
    },
    stage14: {
      getMessages: (ctx) => [
        '🟩 Stage 14 – Update CHESS',
        `CHESS status updated — claim moved from PENDED to APPROVED for dossier ${ctx.dossierNumber}.`
      ],
      completionLog: (ctx) => `CHESS record ${ctx.dossierNumber} set to APPROVED.`
    },
    stage15: {
      getMessages: (ctx) => [
        '🟩 Stage 15 – Outcomes',
        `Claim approved and reimbursement of $${ctx.totalAmount} scheduled to the claimant’s bank account.`,
        `Reason: ${ctx.finalDecisionReason}`
      ],
      completionLog: (ctx) => `Final outcome recorded: ${ctx.finalDecisionStatus} for $${ctx.totalAmount} ${ctx.currency}.`
    }
  }
};

type ChessStageMessagesProps = {
  stageId: string;
  isActive: boolean;
  claim?: ClaimInfo;
};

function ChessStageMessages({ stageId, isActive, claim }: ChessStageMessagesProps) {
  const {
    currentNodeId,
    nodes,
    chessStageMessages,
    chessStageMessageIndex,
    setChessStageMessages,
    setChessStageMessageIndex,
    updateNodeStatus,
    addLogEvent
  } = useSimulatorStore();

  const [isVisible, setIsVisible] = useState(false);
  const hasStartedRef = useRef(false);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const progressionActiveRef = useRef(false);
  const completionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const loggedIndexesRef = useRef<Set<number>>(new Set());

  const baseConfig = chessStageConfig[stageId];
  const context = useMemo(() => buildContext(claim), [claim]);
  const claimIdentifier = useMemo(() => {
    if (!claim) return '';
    return (claim.claimNumber || claim.patientName || '').toString().toUpperCase();
  }, [claim]);
  const stageOverride = claimIdentifier ? claimStageOverrides[claimIdentifier]?.[stageId] : undefined;
  const config = useMemo(() => {
    if (!baseConfig && !stageOverride) {
      return null;
    }
    if (!stageOverride) {
      return baseConfig;
    }
    const merged: ChessStageConfig = {
      title: baseConfig?.title ?? `Stage ${stageId}`,
      getMessages: stageOverride.getMessages ?? baseConfig?.getMessages ?? (() => []),
      delays: stageOverride.delays ?? baseConfig?.delays,
      doneDelay: stageOverride.doneDelay ?? baseConfig?.doneDelay,
      completionLog: stageOverride.completionLog ?? baseConfig?.completionLog
    };
    return merged;
  }, [baseConfig, stageId, stageOverride]);

  const messages = chessStageMessages[stageId] || [];
  const currentIndex = chessStageMessageIndex[stageId] ?? -1;
  const stageNode = nodes.find((node) => node.id === stageId);
  const isChessClaim = claim?.integrationType === 'CHESS';
  const isAlreadyDone = stageNode?.status === 'done';

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];
      if (completionTimeoutRef.current) {
        clearTimeout(completionTimeoutRef.current);
        completionTimeoutRef.current = null;
      }
    };
  }, []);

  // Reset logged indexes when stage deactivates
  useEffect(() => {
    if (!isActive) {
      loggedIndexesRef.current.clear();
    }
  }, [isActive]);

  // Initialize messages when stage becomes active
  useEffect(() => {
    if (!isChessClaim || !config) {
      return;
    }

    if (!isActive) {
      setIsVisible(false);
      hasStartedRef.current = false;
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];
      if (completionTimeoutRef.current) {
        clearTimeout(completionTimeoutRef.current);
        completionTimeoutRef.current = null;
      }
      return;
    }

    if (isAlreadyDone) {
      setIsVisible(false);
      return;
    }

    if (hasStartedRef.current) {
      if (messages.length > 0 && !isVisible) {
        setIsVisible(true);
      }
      return;
    }

    const generatedMessages = config.getMessages(context);
    setChessStageMessages(stageId, generatedMessages);
    setChessStageMessageIndex(stageId, 0);
    setIsVisible(true);
    hasStartedRef.current = true;
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    progressionActiveRef.current = false;
    loggedIndexesRef.current.clear();
  }, [
    isActive,
    isAlreadyDone,
    isChessClaim,
    config,
    context,
    messages.length,
    isVisible,
    stageId,
    setChessStageMessageIndex,
    setChessStageMessages
  ]);

  // Progress through messages
  useEffect(() => {
    if (!isChessClaim || !config || !isActive) {
      progressionActiveRef.current = false;
      return;
    }

    if (messages.length === 0) {
      return;
    }

    if (currentIndex >= messages.length - 1) {
      progressionActiveRef.current = false;
      if (!isAlreadyDone && !completionTimeoutRef.current) {
        const doneDelay = config.doneDelay ?? 2000;
        completionTimeoutRef.current = setTimeout(() => {
          completionTimeoutRef.current = null;
          updateNodeStatus(stageId, 'done');
          const reason = config.completionLog ? config.completionLog(context) : `${config.title} completed.`;
          addLogEvent({
            timestamp: Date.now(),
            fromNodeId: stageId,
            toNodeId: stageId,
            reason
          });
        }, doneDelay);
      }
      return;
    }

    if (progressionActiveRef.current) {
      return;
    }

    const delays = config.delays ?? new Array(messages.length).fill(2000);
    const nextIndex = currentIndex + 1;
    const delay = delays[nextIndex] ?? delays[delays.length - 1] ?? 1800;

    progressionActiveRef.current = true;
    const timeout = setTimeout(() => {
      progressionActiveRef.current = false;
      setChessStageMessageIndex(stageId, nextIndex);
    }, delay);

    timeoutsRef.current.push(timeout);

    return () => {
      clearTimeout(timeout);
      progressionActiveRef.current = false;
    };
  }, [
    isActive,
    isChessClaim,
    config,
    messages,
    currentIndex,
    isAlreadyDone,
    stageId,
    setChessStageMessageIndex,
    updateNodeStatus,
    addLogEvent,
    context
  ]);

  // Log messages to event log once
  useEffect(() => {
    if (!isChessClaim || !config || !isActive) {
      return;
    }
    if (messages.length === 0 || currentIndex < 0) {
      return;
    }
    if (loggedIndexesRef.current.has(currentIndex)) {
      return;
    }

    const message = messages[currentIndex];
    if (!message) {
      return;
    }

    loggedIndexesRef.current.add(currentIndex);
    addLogEvent({
      timestamp: Date.now(),
      fromNodeId: stageId,
      toNodeId: stageId,
      reason: message
    });
  }, [
    addLogEvent,
    config,
    currentIndex,
    isActive,
    isChessClaim,
    messages,
    stageId
  ]);

  if (!isChessClaim || !config) {
    return null;
  }

  if (!isVisible || messages.length === 0) {
    return null;
  }

  const messageIndex = currentIndex >= 0 ? currentIndex : 0;
  const currentMessage = messages[messageIndex];

  if (!currentMessage) {
    return null;
  }

  const isCurrentStage = currentNodeId === stageId;
  if (!isCurrentStage) {
    return null;
  }

  return (
    <div className="ingestion-messages-container chess-stage-messages">
      <AnimatePresence mode="wait">
        <motion.div
          key={`${stageId}-${messageIndex}`}
          className="ingestion-message"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          {currentMessage}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default ChessStageMessages;


