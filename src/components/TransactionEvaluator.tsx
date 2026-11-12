import React, { useState, useId } from 'react';
import { TransactionInput, TransactionType } from '../types/fraud';
import { evaluateDualModel } from '../ml/randomForestEngine';
import { ShieldAlert, CheckCircle2, AlertTriangle, ArrowRight, RefreshCw, FileText, PlusCircle } from 'lucide-react';

interface TransactionEvaluatorProps {
  onAddToStream?: (input: TransactionInput, annScore: number, rfScore: number, isFraud: boolean) => void;
  onViewNetwork?: () => void;
  initialValues?: Partial<TransactionInput>;
}

// Preset scenarios for instant testing
const PRESETS: Array<{
  id: string;
  name: string;
  badge: string;
  description: string;
  data: TransactionInput;
}> = [
  {
    id: 'ann_colab_test',
    name: 'Colab ANN Test Case (₹3,000 Nocturnal UPI)',
    badge: 'ANN_DL_prj.ipynb',
    description: 'Exact test case from the deep learning notebook: ₹3,000 UPI at 2 AM with 3 failed attempts & unregistered device.',
    data: {
      amount: 3000,
      transaction_type: 'UPI',
      hour: 2,
      location_match: 0,
      device_match: 0,
      daily_transactions: 12,
      failed_attempts: 3,
      new_beneficiary: 1,
    },
  },
  {
    id: 'rf_colab_test',
    name: 'Colab RF Test Case (₹25,000 Crypto Drain)',
    badge: 'PRJ_RF_UPI.ipynb',
    description: 'Exact test case from Random Forest notebook: ₹25,000 UPI transfer at 2 AM resulting in immediate fraud alert.',
    data: {
      amount: 25000,
      transaction_type: 'UPI',
      hour: 2,
      location_match: 0,
      device_match: 0,
      daily_transactions: 12,
      failed_attempts: 3,
      new_beneficiary: 1,
    },
  },
  {
    id: 'legitimate_grocery',
    name: 'Routine Grocery Payment (₹450 POS)',
    badge: 'Normal Baseline',
    description: 'Daytime checkout at habitual store via trusted phone with clean single-attempt authentication.',
    data: {
      amount: 450,
      transaction_type: 'P2M',
      hour: 14,
      location_match: 1,
      device_match: 1,
      daily_transactions: 2,
      failed_attempts: 0,
      new_beneficiary: 0,
    },
  },
  {
    id: 'suspicious_2fa',
    name: 'Late-Night Peer Transfer (₹14,500 Step-Up)',
    badge: 'Suspicious 2FA',
    description: 'Legitimate device but late hour and new payee; requires step-up biometric or SMS challenge.',
    data: {
      amount: 14500,
      transaction_type: 'P2P',
      hour: 23,
      location_match: 1,
      device_match: 1,
      daily_transactions: 5,
      failed_attempts: 1,
      new_beneficiary: 1,
    },
  },
  {
    id: 'pin_spray_takeover',
    name: 'Credential Brute-Force Takeover',
    badge: 'Account Takeover',
    description: 'Multiple consecutive failed attempts from foreign IP at 3:00 AM attempting account drain.',
    data: {
      amount: 9800,
      transaction_type: 'UPI',
      hour: 3,
      location_match: 0,
      device_match: 0,
      daily_transactions: 8,
      failed_attempts: 4,
      new_beneficiary: 1,
    },
  },
];

export const TransactionEvaluator: React.FC<TransactionEvaluatorProps> = ({
  onAddToStream,
  onViewNetwork,
  initialValues,
}) => {
  const [formData, setFormData] = useState<TransactionInput>({
    amount: initialValues?.amount ?? 3000,
    transaction_type: initialValues?.transaction_type ?? 'UPI',
    hour: initialValues?.hour ?? 2,
    location_match: initialValues?.location_match ?? 0,
    device_match: initialValues?.device_match ?? 0,
    daily_transactions: initialValues?.daily_transactions ?? 12,
    failed_attempts: initialValues?.failed_attempts ?? 3,
    new_beneficiary: initialValues?.new_beneficiary ?? 1,
  });

  const [activeModel, setActiveModel] = useState<'ANN' | 'RF' | 'DUAL'>('ANN');
  const [decisionThreshold, setDecisionThreshold] = useState<number>(0.50);
  const [notification, setNotification] = useState<string | null>(null);

  const amountInputId = useId();
  const hourInputId = useId();
  const dailyTxnInputId = useId();

  // Run evaluation in real-time
  const dualResult = evaluateDualModel(formData, decisionThreshold);
  const annPrediction = dualResult.ann;
  const rfPrediction = dualResult.randomForest;

  // Selected model metrics
  const displayProbability =
    activeModel === 'ANN'
      ? annPrediction.probability
      : activeModel === 'RF'
      ? rfPrediction.probability
      : dualResult.consensus.compositeRiskScore / 100;

  const isFraud = displayProbability >= decisionThreshold;
  const isSuspicious = displayProbability >= 0.35 && displayProbability < decisionThreshold;

  const handleApplyPreset = (preset: typeof PRESETS[0]) => {
    setFormData(preset.data);
    setNotification(`Applied preset: ${preset.name}`);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAddCurrentToFeed = () => {
    if (onAddToStream) {
      onAddToStream(formData, annPrediction.probability, rfPrediction.probability, isFraud);
      setNotification('Transaction dispatched to live monitoring queue.');
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleDownloadSlip = () => {
    const slip = `================================================
BANK TRANSACTION FRAUD AUDIT SLIP
Generated: ${new Date().toISOString()}
System: FraudGuard AI (ANN Deep Learning Engine)
================================================
TRANSACTION PARAMETERS:
Amount: ₹${formData.amount.toLocaleString()}
Transaction Type: ${formData.transaction_type}
Timestamp Hour: ${String(formData.hour).padStart(2, '0')}:00 hrs
Location Match: ${formData.location_match === 1 ? 'MATCHED (Verified City)' : 'ANOMALY (Unrecognized Geo-Location)'}
Device Match: ${formData.device_match === 1 ? 'TRUSTED (Hardware Key Verified)' : 'UNRECOGNIZED (New Device/Fingerprint)'}
Daily Txn Velocity: ${formData.daily_transactions} transactions
Failed PIN/OTP Attempts: ${formData.failed_attempts}
New Beneficiary: ${formData.new_beneficiary === 1 ? 'YES (< 24 Hours)' : 'NO (Established Payee)'}

MODEL INFERENCE RESULTS:
Deep Learning ANN Fraud Probability: ${(annPrediction.probability * 100).toFixed(2)}%
Random Forest Ensemble Fraud Probability: ${(rfPrediction.probability * 100).toFixed(2)}%
Decision Threshold: ${(decisionThreshold * 100).toFixed(0)}%
FINAL CLASSIFICATION: ${isFraud ? 'FRAUDULENT / BLOCKED' : isSuspicious ? 'SUSPICIOUS / STEP-UP 2FA' : 'NORMAL / APPROVED'}
Recommendation: ${annPrediction.recommendation}
Inference Latency: ${annPrediction.inferenceTimeMs} ms
================================================`;

    const blob = new Blob([slip], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fraud-audit-slip-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Title & Preset Strip */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 rounded-xl p-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Transaction Fraud Evaluator</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time inference using the Artificial Neural Network (ANN) and Random Forest models trained on UPI banking transactions.
          </p>
        </div>

        {/* Quick presets dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 shrink-0">Benchmark Presets:</span>
          <select
            onChange={(e) => {
              const selected = PRESETS.find((p) => p.id === e.target.value);
              if (selected) handleApplyPreset(selected);
            }}
            className="bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded-lg px-3 py-1.5 focus:outline-hidden focus:border-rose-500"
            defaultValue="ann_colab_test"
          >
            {PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {notification && (
        <div className="bg-rose-950/40 border border-rose-800/80 text-rose-200 text-xs px-4 py-2.5 rounded-lg flex items-center justify-between animate-fade-in">
          <span>{notification}</span>
          <button onClick={() => setNotification(null)} className="text-rose-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Main Grid: Inputs on Left, Real-Time Prediction Gauge on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-semibold text-slate-300">Transaction Parameters</span>
              <button
                onClick={() => handleApplyPreset(PRESETS[0])}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset to Notebook Case</span>
              </button>
            </div>

            {/* 1. Amount */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <label htmlFor={amountInputId} className="font-medium text-slate-300">Transaction Amount (₹ / INR)</label>
                <span className="font-mono text-slate-400">Current: ₹{formData.amount.toLocaleString()}</span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono">₹</span>
                <input
                  id={amountInputId}
                  type="number"
                  min="1"
                  max="1000000"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: Math.max(0, Number(e.target.value)) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-4 py-2 text-sm text-white font-mono tabular-nums focus:outline-hidden focus:border-rose-500"
                />
              </div>
              {/* Quick Amount Pills */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                {[450, 1500, 3000, 12000, 25000, 50000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setFormData({ ...formData, amount: val })}
                    className={`px-2.5 py-1 text-xs font-mono rounded-md border transition-colors ${
                      formData.amount === val
                        ? 'bg-rose-950/60 border-rose-500 text-rose-300'
                        : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    ₹{val.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Transaction Type */}
            <div>
              <div className="text-xs font-medium text-slate-300 mb-1.5">Transaction Type</div>
              <div className="grid grid-cols-3 gap-2">
                {(['UPI', 'P2P', 'P2M'] as TransactionType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFormData({ ...formData, transaction_type: type })}
                    className={`px-3 py-2 text-xs font-semibold rounded-lg border text-center transition-all ${
                      formData.transaction_type === type
                        ? 'bg-slate-800 border-slate-600 text-white shadow-xs'
                        : 'bg-slate-950 border-slate-800/80 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div>{type}</div>
                    <div className="text-[10px] font-normal text-slate-500 mt-0.5">
                      {type === 'UPI' ? 'Unified Payments' : type === 'P2P' ? 'Peer-to-Peer' : 'Peer-to-Merchant'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Hour of Day (Circadian Slider) */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <label htmlFor={hourInputId} className="font-medium text-slate-300">Transaction Time / Hour</label>
                <span className="font-mono text-slate-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  {String(formData.hour).padStart(2, '0')}:00 hrs{' '}
                  {formData.hour >= 1 && formData.hour <= 4 ? (
                    <span className="text-rose-400 font-bold">(High Risk Night Window)</span>
                  ) : formData.hour >= 9 && formData.hour <= 19 ? (
                    <span className="text-emerald-400">(Daytime Business Hours)</span>
                  ) : (
                    <span className="text-amber-400">(Evening / Off-Peak)</span>
                  )}
                </span>
              </div>
              <input
                id={hourInputId}
                type="range"
                min="0"
                max="23"
                value={formData.hour}
                onChange={(e) => setFormData({ ...formData, hour: Number(e.target.value) })}
                className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-rose-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                <span>00:00 (Midnight)</span>
                <span className="text-rose-400 font-bold">02:00 AM (Colab Peak)</span>
                <span>12:00 (Noon)</span>
                <span>23:00</span>
              </div>
            </div>

            {/* 4 & 5: Location & Device Verification (Binary matches) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Location Match */}
              <div className="bg-slate-950 border border-slate-800/90 rounded-lg p-3">
                <div className="text-xs font-medium text-slate-300 mb-1">Location Verification</div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    {formData.location_match === 1 ? 'Matches registered city' : 'Foreign IP / Geo Anomaly'}
                  </span>
                  <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-md border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, location_match: 1 })}
                      className={`px-2 py-1 text-[11px] font-medium rounded transition-colors ${
                        formData.location_match === 1 ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Match
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, location_match: 0 })}
                      className={`px-2 py-1 text-[11px] font-medium rounded transition-colors ${
                        formData.location_match === 0 ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Mismatch
                    </button>
                  </div>
                </div>
              </div>

              {/* Device Match */}
              <div className="bg-slate-950 border border-slate-800/90 rounded-lg p-3">
                <div className="text-xs font-medium text-slate-300 mb-1">Hardware / Device Trust</div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    {formData.device_match === 1 ? 'Registered phone IMEI' : 'Unrecognized Device / Browser'}
                  </span>
                  <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-md border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, device_match: 1 })}
                      className={`px-2 py-1 text-[11px] font-medium rounded transition-colors ${
                        formData.device_match === 1 ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Trusted
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, device_match: 0 })}
                      className={`px-2 py-1 text-[11px] font-medium rounded transition-colors ${
                        formData.device_match === 0 ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Unknown
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 6. Daily Transactions Velocity */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <label htmlFor={dailyTxnInputId} className="font-medium text-slate-300">Daily Transaction Velocity</label>
                <span className="font-mono text-slate-400">{formData.daily_transactions} transactions performed today</span>
              </div>
              <input
                id={dailyTxnInputId}
                type="range"
                min="1"
                max="25"
                value={formData.daily_transactions}
                onChange={(e) => setFormData({ ...formData, daily_transactions: Number(e.target.value) })}
                className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-rose-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                <span>1 (Standard)</span>
                <span>5 (Active)</span>
                <span>12 (Notebook Anomaly)</span>
                <span>25 (Extreme Burst)</span>
              </div>
            </div>

            {/* 7 & 8: Failed Attempts & New Beneficiary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Failed Attempts */}
              <div className="bg-slate-950 border border-slate-800/90 rounded-lg p-3">
                <div className="text-xs font-medium text-slate-300 mb-1.5">Prior Failed PIN / OTP Attempts</div>
                <div className="flex items-center gap-1">
                  {[0, 1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setFormData({ ...formData, failed_attempts: val })}
                      className={`flex-1 py-1.5 text-xs font-mono font-medium rounded transition-colors ${
                        formData.failed_attempts === val
                          ? val >= 3
                            ? 'bg-rose-600 text-white font-bold'
                            : val >= 1
                            ? 'bg-amber-600 text-white font-bold'
                            : 'bg-emerald-700 text-white font-bold'
                          : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  {formData.failed_attempts === 0 ? 'Zero auth resistance' : `${formData.failed_attempts} failed attempts preceding current request`}
                </div>
              </div>

              {/* New Beneficiary */}
              <div className="bg-slate-950 border border-slate-800/90 rounded-lg p-3">
                <div className="text-xs font-medium text-slate-300 mb-1.5">Payee Registration History</div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, new_beneficiary: 0 })}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md border text-center transition-colors ${
                      formData.new_beneficiary === 0
                        ? 'bg-emerald-950 border-emerald-800 text-emerald-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Established Payee
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, new_beneficiary: 1 })}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md border text-center transition-colors ${
                      formData.new_beneficiary === 1
                        ? 'bg-rose-950 border-rose-800 text-rose-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    New Payee (&lt;24h)
                  </button>
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  {formData.new_beneficiary === 1 ? 'High fraud correlation during first 24h of payee addition' : 'Trusted recipient with prior history'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Model Inference Result (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-5">
            {/* Model Selector Tabs */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-semibold text-slate-300">Model Inference Engine</span>
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveModel('ANN')}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                    activeModel === 'ANN' ? 'bg-slate-800 text-white font-semibold shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  ANN (DL)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModel('RF')}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                    activeModel === 'RF' ? 'bg-slate-800 text-white font-semibold shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Random Forest
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModel('DUAL')}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                    activeModel === 'DUAL' ? 'bg-slate-800 text-white font-semibold shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Consensus
                </button>
              </div>
            </div>

            {/* Big Status Banner */}
            <div
              className={`rounded-xl p-4 border text-center transition-all ${
                isFraud
                  ? 'bg-rose-950/40 border-rose-800/80 text-rose-200'
                  : isSuspicious
                  ? 'bg-amber-950/40 border-amber-800/80 text-amber-200'
                  : 'bg-emerald-950/40 border-emerald-800/80 text-emerald-200'
              }`}
            >
              <div className="flex items-center justify-center gap-2 mb-1.5">
                {isFraud ? (
                  <ShieldAlert className="w-6 h-6 text-rose-400" />
                ) : isSuspicious ? (
                  <AlertTriangle className="w-6 h-6 text-amber-400" />
                ) : (
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                )}
                <span className="text-sm font-bold tracking-tight uppercase">
                  {isFraud ? 'Fraudulent Transaction' : isSuspicious ? 'Suspicious Activity' : 'Normal Transaction'}
                </span>
              </div>
              <div className="text-xs text-slate-300">
                {isFraud
                  ? 'High probability of unauthorized account access or credential abuse.'
                  : isSuspicious
                  ? 'Elevated risk parameters. Secondary verification recommended.'
                  : 'Consistent with customer habitual transaction behavior.'}
              </div>
            </div>

            {/* Fraud Probability Meter Gauge */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Fraud Probability Score</span>
                <span className="text-2xl font-bold font-mono tabular-nums text-white">
                  {(displayProbability * 100).toFixed(1)}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden p-0.5 border border-slate-800">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    displayProbability >= 0.75
                      ? 'bg-gradient-to-r from-rose-600 to-rose-400'
                      : displayProbability >= 0.40
                      ? 'bg-gradient-to-r from-amber-600 to-amber-400'
                      : 'bg-gradient-to-r from-emerald-600 to-emerald-400'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(3, displayProbability * 100))}%` }}
                />
              </div>

              {/* Comparison between models */}
              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-900 font-mono">
                <div>
                  <span className="text-slate-500">ANN (Sigmoid): </span>
                  <span className="text-slate-300 font-semibold tabular-nums">
                    {(annPrediction.probability * 100).toFixed(1)}%
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">RF (100 Trees): </span>
                  <span className="text-slate-300 font-semibold tabular-nums">
                    {(rfPrediction.probability * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Threshold Adjuster */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-400">Decision Threshold</span>
                <span className="font-mono text-slate-300">{(decisionThreshold * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="0.8"
                step="0.05"
                value={decisionThreshold}
                onChange={(e) => setDecisionThreshold(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-rose-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                <span>0.20 (Conservative)</span>
                <span>0.50 (Standard)</span>
                <span>0.80 (Permissive)</span>
              </div>
            </div>

            {/* Risk Factor Attribution (Top contributing drivers) */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-300">Forensic Risk Attribution</div>
              <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                {annPrediction.riskContributions.map((contrib, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-950 border border-slate-800/80 rounded-lg p-2.5 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-200">{contrib.label}</span>
                      <span
                        className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded ${
                          contrib.level === 'CRITICAL'
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : contrib.level === 'HIGH'
                            ? 'bg-rose-950/60 text-rose-400'
                            : contrib.level === 'MODERATE'
                            ? 'bg-amber-950 text-amber-300'
                            : 'bg-emerald-950 text-emerald-300'
                        }`}
                      >
                        {contrib.level}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">{contrib.explanation}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 border-t border-slate-800 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleAddCurrentToFeed}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 active:scale-[0.98] transition-all rounded-lg border border-slate-700 shadow-xs"
              >
                <PlusCircle className="w-3.5 h-3.5 text-rose-400" />
                <span>Add to Live Monitoring Feed</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                {onViewNetwork && (
                  <button
                    type="button"
                    onClick={onViewNetwork}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg transition-colors"
                  >
                    <span>Inspect Neural Pass</span>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleDownloadSlip}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg transition-colors"
                >
                  <FileText className="w-3 h-3 text-slate-400" />
                  <span>Audit Slip (.TXT)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
