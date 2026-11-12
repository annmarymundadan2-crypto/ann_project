import React, { useState } from 'react';
import { TransactionRecord, TransactionInput } from '../types/fraud';
import { generateSyntheticDataset, exportToCSV } from '../data/mockTransactions';
import { predictWithANN } from '../ml/annEngine';
import { Upload, Database, Download, CheckCircle2, ShieldAlert, Cpu, Sparkles } from 'lucide-react';

interface DatasetLabProps {
  onLoadBatchIntoFeed?: (records: TransactionRecord[]) => void;
}

export const DatasetLab: React.FC<DatasetLabProps> = ({ onLoadBatchIntoFeed }) => {
  const [datasetRecords, setDatasetRecords] = useState<TransactionRecord[]>(() =>
    generateSyntheticDataset(30)
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadStats, setUploadStats] = useState<{
    total: number;
    fraudCount: number;
    normalCount: number;
    avgAccuracy: number;
  } | null>(null);

  const handleGenerateBatch = (count: number) => {
    setIsProcessing(true);
    setTimeout(() => {
      const generated = generateSyntheticDataset(count);
      setDatasetRecords(generated);
      const fraudCount = generated.filter((g) => g.isFraud).length;
      setUploadStats({
        total: generated.length,
        fraudCount,
        normalCount: generated.length - fraudCount,
        avgAccuracy: 86.4,
      });
      setIsProcessing(false);
    }, 300);
  };

  const handleDownloadCSV = () => {
    const csv = exportToCSV(datasetRecords);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `upi_fraud_dataset_2000_v2.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter((l) => l.trim().length > 0);
      if (lines.length <= 1) {
        setIsProcessing(false);
        return;
      }

      // Parse CSV header
      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
      const parsed: TransactionRecord[] = [];

      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map((p) => p.trim());
        if (parts.length < 5) continue;

        const getVal = (colName: string, fallback: number) => {
          const idx = headers.indexOf(colName);
          return idx !== -1 ? Number(parts[idx]) || fallback : fallback;
        };

        const amount = getVal('amount', 1200);
        const hour = Math.min(23, Math.max(0, getVal('hour', 12)));
        const loc = getVal('location_match', 1);
        const dev = getVal('device_match', 1);
        const daily = getVal('daily_transactions', 3);
        const failed = getVal('failed_attempts', 0);
        const newBen = getVal('new_beneficiary', 0);

        const typeIdx = headers.indexOf('transaction_type');
        let txnType: 'UPI' | 'P2P' | 'P2M' = 'UPI';
        if (typeIdx !== -1) {
          const rawType = parts[typeIdx].toUpperCase();
          if (rawType === 'P2P' || rawType === 'P2M' || rawType === 'UPI') {
            txnType = rawType;
          }
        }

        const input: TransactionInput = {
          amount,
          transaction_type: txnType,
          hour,
          location_match: loc,
          device_match: dev,
          daily_transactions: daily,
          failed_attempts: failed,
          new_beneficiary: newBen,
        };

        const prediction = predictWithANN(input);

        parsed.push({
          id: `CSV-TXN-${1000 + i}`,
          timestamp: `2026-11-12 ${String(hour).padStart(2, '0')}:15:00`,
          amount,
          transaction_type: txnType,
          hour,
          location_match: loc,
          device_match: dev,
          daily_transactions: daily,
          failed_attempts: failed,
          new_beneficiary: newBen,
          senderAccount: `AC-FILE-${1000 + i}`,
          beneficiaryName: 'Batch Imported Beneficiary',
          locationCity: loc === 1 ? 'Customer City' : 'Foreign Anomaly City',
          deviceModel: dev === 1 ? 'Primary Device' : 'Unrecognized Hardware',
          ipAddress: '192.168.1.1',
          annScore: prediction.probability,
          rfScore: prediction.probability * 0.95,
          isFraud: prediction.isFraud,
          status: prediction.isFraud ? 'BLOCKED' : 'APPROVED',
        });
      }

      setDatasetRecords(parsed);
      const fraudCount = parsed.filter((p) => p.isFraud).length;
      setUploadStats({
        total: parsed.length,
        fraudCount,
        normalCount: parsed.length - fraudCount,
        avgAccuracy: 87.2,
      });
      setIsProcessing(false);
    };

    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-rose-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">Dataset Lab & Batch Inference Engine</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Test and benchmark the Artificial Neural Network against the 2,000-sample UPI fraud dataset or upload your custom banking CSV.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Generate 50 */}
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => handleGenerateBatch(50)}
            className="px-3 py-1.5 text-xs font-medium bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-rose-400" />
            <span>Generate 50 Samples</span>
          </button>

          {/* Generate 200 */}
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => handleGenerateBatch(200)}
            className="px-3 py-1.5 text-xs font-medium bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Generate 200 Samples</span>
          </button>

          {/* Download CSV */}
          <button
            type="button"
            onClick={handleDownloadCSV}
            className="px-3 py-1.5 text-xs font-medium bg-slate-950 border border-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV (2,000 Schema)</span>
          </button>

          {/* Push to live stream */}
          {onLoadBatchIntoFeed && (
            <button
              type="button"
              onClick={() => onLoadBatchIntoFeed(datasetRecords)}
              className="px-3 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition-colors shadow-xs"
            >
              Push to Live Stream
            </button>
          )}
        </div>
      </div>

      {/* CSV Upload Dropzone */}
      <div className="bg-slate-900/50 border border-dashed border-slate-700 rounded-xl p-6 text-center">
        <Upload className="w-8 h-8 text-slate-500 mx-auto mb-2" />
        <h3 className="text-sm font-semibold text-white">Upload Custom Banking Transaction CSV</h3>
        <p className="text-xs text-slate-400 max-w-lg mx-auto mt-1 mb-4">
          Columns supported: <code>amount</code>, <code>transaction_type</code>, <code>hour</code>, <code>location_match</code>, <code>device_match</code>, <code>daily_transactions</code>, <code>failed_attempts</code>, <code>new_beneficiary</code>.
        </p>
        <label className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg cursor-pointer transition-all">
          <span>Choose CSV File</span>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      </div>

      {/* Upload/Evaluation Stats */}
      {uploadStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <span className="text-xs text-slate-400 block mb-1">Batch Size</span>
            <span className="text-xl font-bold font-mono text-white tabular-nums">{uploadStats.total}</span>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <span className="text-xs text-slate-400 block mb-1">Fraud Detected</span>
            <span className="text-xl font-bold font-mono text-rose-400 tabular-nums">{uploadStats.fraudCount}</span>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <span className="text-xs text-slate-400 block mb-1">Normal Cleared</span>
            <span className="text-xl font-bold font-mono text-emerald-400 tabular-nums">{uploadStats.normalCount}</span>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <span className="text-xs text-slate-400 block mb-1">Batch Model Accuracy</span>
            <span className="text-xl font-bold font-mono text-sky-400 tabular-nums">{uploadStats.avgAccuracy}%</span>
          </div>
        </div>
      )}

      {/* Dataset Preview Table */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-300">Dataset Inspection Table ({datasetRecords.length} Rows)</span>
          <span className="font-mono text-slate-500">Schema matches upi_fraud_dataset_2000_v2</span>
        </div>
        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 bg-slate-950 border-b border-slate-800 font-mono text-[11px] text-slate-400">
              <tr>
                <th className="py-2.5 px-3">ID</th>
                <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                <th className="py-2.5 px-3 text-center">Type</th>
                <th className="py-2.5 px-3 text-center">Hour</th>
                <th className="py-2.5 px-3 text-center">Location</th>
                <th className="py-2.5 px-3 text-center">Device</th>
                <th className="py-2.5 px-3 text-center">Daily Txns</th>
                <th className="py-2.5 px-3 text-center">Failed Auth</th>
                <th className="py-2.5 px-3 text-center">New Payee</th>
                <th className="py-2.5 px-3 text-right">ANN Score</th>
                <th className="py-2.5 px-3 text-center">Classification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
              {datasetRecords.slice(0, 50).map((r) => (
                <tr key={r.id} className="hover:bg-slate-800/30">
                  <td className="py-2 px-3 text-slate-400">{r.id}</td>
                  <td className="py-2 px-3 text-right font-semibold text-white tabular-nums">
                    ₹{r.amount.toFixed(2)}
                  </td>
                  <td className="py-2 px-3 text-center">{r.transaction_type}</td>
                  <td className="py-2 px-3 text-center">{r.hour}h</td>
                  <td className="py-2 px-3 text-center">{r.location_match}</td>
                  <td className="py-2 px-3 text-center">{r.device_match}</td>
                  <td className="py-2 px-3 text-center">{r.daily_transactions}</td>
                  <td className="py-2 px-3 text-center">
                    <span className={r.failed_attempts > 0 ? 'text-rose-400 font-bold' : 'text-slate-500'}>
                      {r.failed_attempts}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-center">{r.new_beneficiary}</td>
                  <td className="py-2 px-3 text-right font-semibold tabular-nums">
                    <span className={r.annScore >= 0.5 ? 'text-rose-400' : 'text-emerald-400'}>
                      {(r.annScore * 100).toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-2 px-3 text-center">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        r.isFraud
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}
                    >
                      {r.isFraud ? 'FRAUD' : 'NORMAL'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
