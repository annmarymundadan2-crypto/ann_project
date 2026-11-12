import React from 'react';
import { MetricsSummary } from '../types/fraud';
import { ShieldAlert, CheckCircle2, TrendingUp, Zap, Server } from 'lucide-react';

interface MetricCardsProps {
  metrics: MetricsSummary;
}

export const MetricCards: React.FC<MetricCardsProps> = ({ metrics }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {/* 1. Total Scanned */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span>Transactions Evaluated</span>
          <Server className="w-3.5 h-3.5 text-slate-500" />
        </div>
        <div className="text-xl font-bold text-white font-mono tabular-nums">
          {metrics.totalScanned.toLocaleString()}
        </div>
        <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
          <span>Real-time stream</span>
          <span aria-hidden="true">·</span>
          <span>UPI / P2P / P2M</span>
        </div>
      </div>

      {/* 2. Fraud Detected Rate */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span>Fraud Detection Rate</span>
          <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
        </div>
        <div className="text-xl font-bold text-rose-400 font-mono tabular-nums">
          {metrics.fraudRate.toFixed(1)}%
        </div>
        <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
          <span className="font-mono tabular-nums text-rose-300/80">{metrics.totalFraudDetected}</span>
          <span>flagged anomalies</span>
        </div>
      </div>

      {/* 3. Blocked Volume */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span>Protected Capital</span>
          <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
        </div>
        <div className="text-xl font-bold text-emerald-400 font-mono tabular-nums">
          ₹{metrics.blockedVolume >= 100000 ? `${(metrics.blockedVolume / 100000).toFixed(2)} Lakh` : metrics.blockedVolume.toLocaleString()}
        </div>
        <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
          <span>Automated loss prevention</span>
        </div>
      </div>

      {/* 4. Model Accuracy */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span>ANN Test Accuracy</span>
          <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
        </div>
        <div className="text-xl font-bold text-sky-400 font-mono tabular-nums">
          {metrics.annAccuracy.toFixed(1)}%
        </div>
        <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
          <span>RF: {metrics.rfAccuracy.toFixed(1)}%</span>
          <span aria-hidden="true">·</span>
          <span>Colab Stratified</span>
        </div>
      </div>

      {/* 5. Latency */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 col-span-2 md:col-span-1">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span>Inference Latency</span>
          <Zap className="w-3.5 h-3.5 text-amber-400" />
        </div>
        <div className="text-xl font-bold text-amber-400 font-mono tabular-nums">
          {metrics.avgLatencyMs.toFixed(1)} ms
        </div>
        <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
          <span>Sub-second decisioning</span>
        </div>
      </div>
    </div>
  );
};
