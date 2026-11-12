import React from 'react';
import { TransactionRecord } from '../types/fraud';
import { X, ShieldAlert, CheckCircle2, AlertTriangle, Cpu, MapPin, Smartphone, Clock, FileText, Check, Ban } from 'lucide-react';
import { vectorizeTransaction, runForwardPass } from '../ml/annEngine';

interface TransactionDetailModalProps {
  transaction: TransactionRecord | null;
  onClose: () => void;
  onUpdateStatus?: (id: string, newStatus: 'BLOCKED' | 'FLAGGED' | 'VERIFIED' | 'APPROVED') => void;
  onInspectInNetwork?: (txn: TransactionRecord) => void;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  transaction,
  onClose,
  onUpdateStatus,
  onInspectInNetwork,
}) => {
  if (!transaction) return null;

  const rawVector = vectorizeTransaction(transaction);
  const activations = runForwardPass(rawVector);

  const handleDownloadSlip = () => {
    const slip = `================================================
BANK TRANSACTION FRAUD AUDIT DOSSIER
Reference ID: ${transaction.id}
Date/Time: ${transaction.timestamp}
================================================
PAYMENT DETAILS:
Amount: ₹${transaction.amount.toLocaleString()}
Rail / Method: ${transaction.transaction_type}
Sender Account: ${transaction.senderAccount}
Beneficiary: ${transaction.beneficiaryName}
VPA / Handle: ${transaction.upiHandle ?? 'N/A'}

ENVIRONMENTAL METRICS:
Hour of Day: ${String(transaction.hour).padStart(2, '0')}:00 hrs
Location Status: ${transaction.location_match === 1 ? 'MATCHED' : 'ANOMALY'} (${transaction.locationCity})
Device Status: ${transaction.device_match === 1 ? 'TRUSTED' : 'UNRECOGNIZED'} (${transaction.deviceModel})
IP Address: ${transaction.ipAddress}
Daily Velocity: ${transaction.daily_transactions} transactions
Failed PIN/OTP Attempts: ${transaction.failed_attempts}
New Payee Status: ${transaction.new_beneficiary === 1 ? 'YES (< 24h)' : 'NO (Established)'}

INFERENCE FORENSICS:
Artificial Neural Network (ANN) Probability: ${(transaction.annScore * 100).toFixed(2)}%
Random Forest (100 Trees) Probability: ${(transaction.rfScore * 100).toFixed(2)}%
Final Classification: ${transaction.isFraud ? 'FRAUDULENT' : 'NORMAL'}
Current State: ${transaction.status}
Notes: ${transaction.notes ?? 'Standard automated processing.'}
================================================`;

    const blob = new Blob([slip], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-${transaction.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                transaction.isFraud
                  ? 'bg-rose-950 text-rose-400 border border-rose-800'
                  : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
              }`}
            >
              {transaction.isFraud ? <ShieldAlert className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-base font-bold text-white">{transaction.id}</span>
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                    transaction.isFraud
                      ? 'bg-rose-950 text-rose-300 border border-rose-800'
                      : transaction.status === 'FLAGGED'
                      ? 'bg-amber-950 text-amber-300 border border-amber-800'
                      : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  }`}
                >
                  {transaction.status}
                </span>
              </div>
              <div className="text-xs text-slate-400 font-mono mt-0.5">{transaction.timestamp}</div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Top Key Numbers */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
              <span className="text-[11px] text-slate-400 block mb-0.5">Transaction Amount</span>
              <span className="text-lg font-bold font-mono text-white tabular-nums">
                ₹{transaction.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">{transaction.transaction_type} Rail</span>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
              <span className="text-[11px] text-slate-400 block mb-0.5">ANN Fraud Probability</span>
              <span
                className={`text-lg font-bold font-mono tabular-nums ${
                  transaction.annScore >= 0.5 ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {(transaction.annScore * 100).toFixed(1)}%
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Deep Learning Keras</span>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
              <span className="text-[11px] text-slate-400 block mb-0.5">Random Forest Vote</span>
              <span
                className={`text-lg font-bold font-mono tabular-nums ${
                  transaction.rfScore >= 0.5 ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {(transaction.rfScore * 100).toFixed(1)}%
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">100 Trees Ensemble</span>
            </div>
          </div>

          {/* Forensic Parameters Grid */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="text-xs font-semibold text-slate-300">Transaction & Forensic Parameters</div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Beneficiary:</span>
                <span className="font-medium text-slate-200">{transaction.beneficiaryName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Sender Account:</span>
                <span className="font-mono text-slate-200">{transaction.senderAccount}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Location Verification:</span>
                <span className={transaction.location_match === 1 ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                  {transaction.location_match === 1 ? 'Matched' : 'Anomaly'} ({transaction.locationCity})
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Hardware / Device:</span>
                <span className={transaction.device_match === 1 ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                  {transaction.device_match === 1 ? 'Trusted' : 'Unrecognized'} ({transaction.deviceModel})
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Time / Circadian Hour:</span>
                <span className="font-mono text-slate-200">{String(transaction.hour).padStart(2, '0')}:00 hrs</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Failed PIN Attempts:</span>
                <span className={`font-mono ${transaction.failed_attempts > 0 ? 'text-rose-400 font-bold' : 'text-slate-200'}`}>
                  {transaction.failed_attempts} attempts
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Daily Txn Velocity:</span>
                <span className="font-mono text-slate-200">{transaction.daily_transactions} transactions</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">New Beneficiary (&lt;24h):</span>
                <span className={transaction.new_beneficiary === 1 ? 'text-rose-400 font-semibold' : 'text-slate-300'}>
                  {transaction.new_beneficiary === 1 ? 'YES (High Risk)' : 'NO (Established)'}
                </span>
              </div>
            </div>
          </div>

          {/* Deep Learning Layer 1 & 2 Activations */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>Artificial Neural Network Internal Activations</span>
              <span className="font-mono text-[10px] text-slate-400">10 In → 16 Dense → 8 Dense → 1 Out</span>
            </div>
            <div className="space-y-1.5 pt-1">
              <div className="text-[11px] text-slate-400">Layer 1 Excitation (16 ReLU nodes):</div>
              <div className="grid grid-cols-8 gap-1">
                {activations.layer1.map((act, idx) => (
                  <div
                    key={idx}
                    className={`p-1 rounded text-center font-mono text-[10px] border ${
                      act > 0
                        ? 'bg-rose-950/70 border-rose-800 text-rose-300 font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-500'
                    }`}
                  >
                    {act.toFixed(1)}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Notes */}
          {transaction.notes && (
            <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3 text-xs text-slate-400">
              <span className="text-slate-300 font-semibold block mb-0.5">Audit Log Observation:</span>
              <p>{transaction.notes}</p>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {onInspectInNetwork && (
              <button
                type="button"
                onClick={() => {
                  onInspectInNetwork(transaction);
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-900 border border-slate-800 text-slate-200 hover:text-white rounded-lg transition-colors"
              >
                <Cpu className="w-3.5 h-3.5 text-rose-400" />
                <span>Open in Neural Inspector</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleDownloadSlip}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-900 border border-slate-800 text-slate-200 hover:text-white rounded-lg transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Download Slip</span>
            </button>
          </div>

          {onUpdateStatus && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onUpdateStatus(transaction.id, 'APPROVED');
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 rounded-lg transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Mark Verified</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onUpdateStatus(transaction.id, 'BLOCKED');
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300 rounded-lg transition-colors"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Block Account/Txn</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
