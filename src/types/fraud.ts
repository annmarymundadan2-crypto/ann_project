export type TransactionType = 'UPI' | 'P2P' | 'P2M';

export interface TransactionInput {
  amount: number;
  transaction_type: TransactionType;
  hour: number; // 0 - 23
  location_match: number; // 0 or 1
  device_match: number; // 0 or 1
  daily_transactions: number; // count >= 1
  failed_attempts: number; // 0 - 5+
  new_beneficiary: number; // 0 or 1
}

export interface LayerActivations {
  featureNames: string[];
  rawInputs: number[];
  scaledInputs: number[];
  layer1: number[]; // 16 nodes post-ReLU
  layer1Pre: number[]; // 16 nodes pre-activation
  layer2: number[]; // 8 nodes post-ReLU
  layer2Pre: number[]; // 8 nodes pre-activation
  outputPre: number;
  outputProb: number;
}

export interface FeatureRiskContribution {
  feature: string;
  label: string;
  value: string | number;
  score: number; // -1 to +1 (negative = lowers fraud risk, positive = increases fraud risk)
  percentageImpact: number;
  explanation: string;
  level: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW' | 'SAFE';
}

export interface ModelPrediction {
  probability: number; // 0 to 1
  isFraud: boolean;
  classification: 'FRAUD' | 'NORMAL' | 'SUSPICIOUS';
  confidence: number; // e.g. 98.7%
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  threshold: number;
  inferenceTimeMs: number;
  layerActivations?: LayerActivations;
  riskContributions: FeatureRiskContribution[];
  recommendation: 'BLOCK_TRANSACTION' | 'STEP_UP_2FA' | 'ALLOW_TRANSACTION' | 'FLAG_FOR_REVIEW';
}

export interface DualModelResult {
  ann: ModelPrediction;
  randomForest: {
    probability: number;
    isFraud: boolean;
    treeVotesFraud: number;
    treeVotesTotal: number;
    inferenceTimeMs: number;
  };
  consensus: {
    agreement: boolean;
    finalDecision: 'FRAUD' | 'NORMAL' | 'REVIEW';
    compositeRiskScore: number; // 0 to 100
  };
}

export interface TransactionRecord extends TransactionInput {
  id: string;
  timestamp: string;
  senderAccount: string;
  beneficiaryName: string;
  upiHandle?: string;
  locationCity: string;
  deviceModel: string;
  ipAddress: string;
  annScore: number;
  rfScore: number;
  isFraud: boolean;
  status: 'BLOCKED' | 'FLAGGED' | 'VERIFIED' | 'APPROVED';
  notes?: string;
}

export interface MetricsSummary {
  totalScanned: number;
  totalFraudDetected: number;
  fraudRate: number; // e.g. 15.2%
  blockedVolume: number; // total amount
  annAccuracy: number; // e.g. 85.8%
  rfAccuracy: number; // e.g. 81.0%
  avgLatencyMs: number; // e.g. 1.2ms
  falsePositiveRate: number; // e.g. 2.1%
}
