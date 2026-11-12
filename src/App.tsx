/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { MetricCards } from './components/MetricCards';
import { TransactionEvaluator } from './components/TransactionEvaluator';
import { LiveTransactionFeed } from './components/LiveTransactionFeed';
import { NeuralNetworkVisualizer } from './components/NeuralNetworkVisualizer';
import { AnalyticsReports } from './components/AnalyticsReports';
import { DatasetLab } from './components/DatasetLab';
import { TransactionDetailModal } from './components/TransactionDetailModal';
import { INITIAL_TRANSACTIONS, generateSyntheticDataset } from './data/mockTransactions';
import { TransactionRecord, TransactionInput, MetricsSummary } from './types/fraud';
import { predictWithANN } from './ml/annEngine';
import { predictWithRandomForest } from './ml/randomForestEngine';

export default function App() {
  const [activeTab, setActiveTab] = useState<'monitor' | 'evaluator' | 'network' | 'analytics' | 'dataset'>('evaluator');
  const [transactions, setTransactions] = useState<TransactionRecord[]>(INITIAL_TRANSACTIONS);
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionRecord | null>(null);
  const [currentEvalInput, setCurrentEvalInput] = useState<TransactionInput>({
    amount: 3000,
    transaction_type: 'UPI',
    hour: 2,
    location_match: 0,
    device_match: 0,
    daily_transactions: 12,
    failed_attempts: 3,
    new_beneficiary: 1,
  });
  const [isSimulatingStream, setIsSimulatingStream] = useState<boolean>(false);

  // Background stream simulator
  useEffect(() => {
    if (!isSimulatingStream) return;

    const interval = setInterval(() => {
      const newItems = generateSyntheticDataset(1);
      if (newItems.length > 0) {
        setTransactions((prev) => [newItems[0], ...prev.slice(0, 199)]);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [isSimulatingStream]);

  // Compute live metrics
  const totalScanned = transactions.length;
  const totalFraudDetected = transactions.filter((t) => t.isFraud).length;
  const fraudRate = totalScanned > 0 ? (totalFraudDetected / totalScanned) * 100 : 0;
  const blockedVolume = transactions
    .filter((t) => t.isFraud)
    .reduce((sum, t) => sum + t.amount, 0);

  const metrics: MetricsSummary = {
    totalScanned,
    totalFraudDetected,
    fraudRate,
    blockedVolume,
    annAccuracy: 85.8, // From Colab Notebook ANN test benchmarks
    rfAccuracy: 81.0,  // From Colab Notebook Random Forest test benchmarks
    avgLatencyMs: 1.2,
    falsePositiveRate: 2.1,
  };

  const handleAddToStream = (
    input: TransactionInput,
    annScore: number,
    rfScore: number,
    isFraud: boolean
  ) => {
    const newTxn: TransactionRecord = {
      ...input,
      id: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      senderAccount: `AC-USER-XXXX-${Math.floor(1000 + Math.random() * 9000)}`,
      beneficiaryName:
        input.transaction_type === 'P2M'
          ? 'QuickRetail Merchant'
          : input.transaction_type === 'UPI'
          ? 'Digital Peer / Payee'
          : 'Direct Account Transfer',
      locationCity: input.location_match === 1 ? 'Customer City (Verified)' : 'Foreign Anomaly City',
      deviceModel: input.device_match === 1 ? 'Registered Smartphone' : 'Unrecognized Browser / Device',
      ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      annScore,
      rfScore,
      isFraud,
      status: isFraud ? 'BLOCKED' : annScore > 0.35 ? 'FLAGGED' : 'APPROVED',
      notes: isFraud
        ? 'Flagged by Deep Learning ANN automated rule.'
        : 'Approved normal transaction.',
    };

    setTransactions((prev) => [newTxn, ...prev]);
    setCurrentEvalInput(input);
  };

  const handleUpdateStatus = (id: string, newStatus: 'BLOCKED' | 'FLAGGED' | 'VERIFIED' | 'APPROVED') => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: newStatus, isFraud: newStatus === 'BLOCKED' } : t))
    );
  };

  const handleSimulateSingle = () => {
    const newItems = generateSyntheticDataset(1);
    if (newItems.length > 0) {
      setTransactions((prev) => [newItems[0], ...prev]);
    }
  };

  const handleLoadBatch = (batch: TransactionRecord[]) => {
    setTransactions((prev) => [...batch, ...prev]);
    setActiveTab('monitor');
  };

  const handleInspectInNetwork = (record: TransactionRecord) => {
    setCurrentEvalInput({
      amount: record.amount,
      transaction_type: record.transaction_type,
      hour: record.hour,
      location_match: record.location_match,
      device_match: record.device_match,
      daily_transactions: record.daily_transactions,
      failed_attempts: record.failed_attempts,
      new_beneficiary: record.new_beneficiary,
    });
    setActiveTab('network');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* 3-Zone Compliant Top Navigation Bar */}
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenEvaluator={() => setActiveTab('evaluator')}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Metric Cards Banner */}
        <MetricCards metrics={metrics} />

        {/* Tab Content */}
        {activeTab === 'evaluator' && (
          <TransactionEvaluator
            onAddToStream={handleAddToStream}
            onViewNetwork={() => setActiveTab('network')}
            initialValues={currentEvalInput}
          />
        )}

        {activeTab === 'monitor' && (
          <LiveTransactionFeed
            transactions={transactions}
            onSelectTransaction={setSelectedTransaction}
            onSimulateNew={handleSimulateSingle}
            isSimulating={isSimulatingStream}
            onToggleSimulating={() => setIsSimulatingStream(!isSimulatingStream)}
          />
        )}

        {activeTab === 'network' && (
          <NeuralNetworkVisualizer currentTransaction={currentEvalInput} />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsReports transactions={transactions} metrics={metrics} />
        )}

        {activeTab === 'dataset' && (
          <DatasetLab onLoadBatchIntoFeed={handleLoadBatch} />
        )}
      </main>

      {/* Transaction Forensic Modal */}
      {selectedTransaction && (
        <TransactionDetailModal
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
          onUpdateStatus={handleUpdateStatus}
          onInspectInNetwork={handleInspectInNetwork}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 px-6 py-5 text-xs text-slate-500 text-center">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">FraudGuard AI</span>
            <span>·</span>
            <span>Artificial Neural Network (ANN) & Random Forest Fraud Detection</span>
          </div>
          <div className="flex items-center gap-3 font-mono text-[11px]">
            <span>Model Accuracy: 85.8% (ANN) / 81.0% (RF)</span>
            <span>·</span>
            <span>Dataset: upi_fraud_dataset_2000_v2</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
