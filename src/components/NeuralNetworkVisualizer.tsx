import React, { useState } from 'react';
import { TransactionInput } from '../types/fraud';
import { vectorizeTransaction, runForwardPass } from '../ml/annEngine';
import { Network, Info, Play, Sparkles } from 'lucide-react';

interface NeuralNetworkVisualizerProps {
  currentTransaction?: TransactionInput;
}

const DEFAULT_TXN: TransactionInput = {
  amount: 3000,
  transaction_type: 'UPI',
  hour: 2,
  location_match: 0,
  device_match: 0,
  daily_transactions: 12,
  failed_attempts: 3,
  new_beneficiary: 1,
};

export const NeuralNetworkVisualizer: React.FC<NeuralNetworkVisualizerProps> = ({
  currentTransaction = DEFAULT_TXN,
}) => {
  const [activeLayer, setActiveLayer] = useState<'input' | 'hidden1' | 'hidden2' | 'output'>('hidden1');
  const [selectedNodeIndex, setSelectedNodeIndex] = useState<number>(0);

  const rawVector = vectorizeTransaction(currentTransaction);
  const activations = runForwardPass(rawVector);

  // Layer dimensions matching Colab notebook: 10 -> 16 -> 8 -> 1
  const inputLabels = activations.featureNames;
  const inputScaled = activations.scaledInputs;
  const l1Nodes = activations.layer1;
  const l1Pre = activations.layer1Pre;
  const l2Nodes = activations.layer2;
  const l2Pre = activations.layer2Pre;
  const outputProb = activations.outputProb;
  const outputPre = activations.outputPre;

  const nodeExplanationsL1 = [
    'Nocturnal & High Velocity detector',
    'Off-hour Amount Spike detector',
    'Device & Location Anomaly cluster',
    'Credential Spray / Failed PIN detector',
    'Routine Merchant Traffic suppressor',
    'High Daily Velocity burst detector',
    'Unsaved Beneficiary High Value detector',
    'Established User Baseline stabilizer',
    'Rapid Withdrawal UPI detector',
    'Odd-Hour Vulnerability monitor',
    'Auth Failures + New Payee combo',
    'Micro-Transaction probing sensor',
    'Physical POS Checkout suppressor',
    'Extreme Amount outlier detector',
    'Account Takeover pattern recognizer',
    'Routine Daytime P2P stabilizer',
  ];

  const nodeExplanationsL2 = [
    'Aggregated Hardware/Credential Breach',
    'Extreme Velocity & Amount Spike',
    'Nocturnal Identity Theft Indicator',
    'Routine Merchant Traffic Suppressor',
    'High-Confidence Fraud Pattern Synthesis',
    'Repeated Failed Auth Cluster',
    'Low-Risk Peer Transfer Stabilizer',
    'High-Value Unsaved Payee Exposure',
  ];

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 rounded-xl p-4">
        <div>
          <div className="flex items-center gap-2">
            <Network className="w-5 h-5 text-rose-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">ANN Deep Learning Architecture Inspector</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Interactive forward-pass activation graph of the 3-Layer Sequential Neural Network (Keras / TensorFlow model from notebook).
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg">
            <span className="text-slate-500">Architecture:</span>
            <span className="text-rose-400 font-bold">10 In → 16 Dense (ReLU) → 8 Dense (ReLU) → 1 Out (Sigmoid)</span>
          </div>
        </div>
      </div>

      {/* Main Interactive Diagram and Inspector Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Diagram SVG/HTML Canvas (8 cols) */}
        <div className="lg:col-span-8 bg-slate-900/50 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800">
            <span>Live Forward-Pass Excitation Map</span>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1 text-[11px]">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-800 border border-slate-600 inline-block" />
                <span>Quiescent (0.0)</span>
              </span>
              <span className="flex items-center gap-1 text-[11px]">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                <span>Active Excitation (&gt; 0)</span>
              </span>
            </div>
          </div>

          {/* SVG Neural Graph */}
          <div className="relative bg-slate-950 border border-slate-800/80 rounded-xl p-6 overflow-x-auto min-h-[460px] flex items-center justify-around gap-8">
            {/* Column 1: Input Features (10 nodes) */}
            <div className="flex flex-col items-center gap-2 z-10">
              <div className="text-[11px] font-semibold text-slate-400 mb-1">
                Input (10)
              </div>
              <div className="space-y-1.5">
                {inputLabels.map((name, idx) => {
                  const rawVal = rawVector[idx];
                  const scaledVal = inputScaled[idx];
                  const isSelected = activeLayer === 'input' && selectedNodeIndex === idx;

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setActiveLayer('input');
                        setSelectedNodeIndex(idx);
                      }}
                      className={`w-40 flex items-center justify-between px-2.5 py-1 text-[11px] rounded border transition-all text-left ${
                        isSelected
                          ? 'bg-rose-950/80 border-rose-500 text-rose-200 shadow-xs'
                          : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <span className="truncate max-w-[90px]">{name}</span>
                      <span className="font-mono text-[10px] text-slate-400 tabular-nums">
                        {scaledVal >= 0 ? `+${scaledVal.toFixed(1)}` : scaledVal.toFixed(1)}σ
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Column 2: Layer 1 (16 Nodes) */}
            <div className="flex flex-col items-center gap-2 z-10">
              <div className="text-[11px] font-semibold text-slate-400 mb-1">
                Dense 1 (16 ReLU)
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {l1Nodes.map((act, idx) => {
                  const isSelected = activeLayer === 'hidden1' && selectedNodeIndex === idx;
                  const intensity = Math.min(1, act / 3);

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setActiveLayer('hidden1');
                        setSelectedNodeIndex(idx);
                      }}
                      title={`Neuron 1-${idx}: activation = ${act.toFixed(2)}`}
                      className={`w-9 h-9 rounded-lg flex flex-col items-center justify-center text-[10px] font-mono border transition-all ${
                        isSelected
                          ? 'border-white ring-2 ring-rose-500/50 scale-105 z-20'
                          : 'border-slate-800 hover:border-slate-600'
                      }`}
                      style={{
                        backgroundColor:
                          act > 0
                            ? `rgba(244, 63, 94, ${0.25 + intensity * 0.75})`
                            : 'rgba(15, 23, 42, 0.9)',
                        color: act > 0 ? '#ffffff' : '#64748b',
                      }}
                    >
                      <span className="font-bold">{idx}</span>
                      <span className="text-[9px] tabular-nums">{act.toFixed(1)}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Column 3: Layer 2 (8 Nodes) */}
            <div className="flex flex-col items-center gap-2 z-10">
              <div className="text-[11px] font-semibold text-slate-400 mb-1">
                Dense 2 (8 ReLU)
              </div>
              <div className="space-y-1.5">
                {l2Nodes.map((act, idx) => {
                  const isSelected = activeLayer === 'hidden2' && selectedNodeIndex === idx;
                  const intensity = Math.min(1, act / 4);

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setActiveLayer('hidden2');
                        setSelectedNodeIndex(idx);
                      }}
                      className={`w-28 flex items-center justify-between px-2.5 py-1.5 text-[11px] rounded-lg border font-mono transition-all ${
                        isSelected
                          ? 'border-white ring-2 ring-rose-500/50 scale-105 z-20'
                          : 'border-slate-800 hover:border-slate-600'
                      }`}
                      style={{
                        backgroundColor:
                          act > 0
                            ? `rgba(244, 63, 94, ${0.25 + intensity * 0.75})`
                            : 'rgba(15, 23, 42, 0.9)',
                        color: act > 0 ? '#ffffff' : '#64748b',
                      }}
                    >
                      <span className="font-bold">N2-{idx}</span>
                      <span className="text-[10px] tabular-nums">
                        {act.toFixed(2)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Column 4: Output Layer (1 Node Sigmoid) */}
            <div className="flex flex-col items-center gap-2 z-10">
              <div className="text-[11px] font-semibold text-slate-400 mb-1">
                Output (Sigmoid)
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveLayer('output');
                  setSelectedNodeIndex(0);
                }}
                className={`w-32 p-4 rounded-xl flex flex-col items-center justify-center gap-1 border transition-all ${
                  activeLayer === 'output'
                    ? 'border-white ring-2 ring-rose-500/50 scale-105'
                    : 'border-slate-700'
                } ${
                  outputProb >= 0.5
                    ? 'bg-rose-950/80 border-rose-500 text-rose-200'
                    : 'bg-emerald-950/80 border-emerald-500 text-emerald-200'
                }`}
              >
                <div className="text-[10px] font-mono uppercase font-bold tracking-wider">
                  {outputProb >= 0.5 ? '🚨 FRAUD' : '✅ NORMAL'}
                </div>
                <div className="text-xl font-bold font-mono tabular-nums">
                  {(outputProb * 100).toFixed(1)}%
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  z = {outputPre.toFixed(2)}
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Right Inspector Panel (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800 text-xs font-semibold text-slate-200">
              <Info className="w-4 h-4 text-rose-400" />
              <span>Neuron Activation Inspector</span>
            </div>

            {/* Selected Node Details */}
            {activeLayer === 'hidden1' && (
              <div className="space-y-3">
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                  <div className="text-[10px] text-slate-500 font-mono uppercase">Dense Layer 1 (Neuron #{selectedNodeIndex})</div>
                  <div className="text-sm font-bold text-white mt-0.5">
                    {nodeExplanationsL1[selectedNodeIndex]}
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Pre-Activation (z):</span>
                    <span className="font-mono text-slate-200 tabular-nums">
                      {l1Pre[selectedNodeIndex].toFixed(4)}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Activation Function:</span>
                    <span className="font-mono text-rose-400 font-bold">ReLU: max(0, z)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Post-Activation Output (a):</span>
                    <span className="font-mono text-white font-bold tabular-nums">
                      {l1Nodes[selectedNodeIndex].toFixed(4)}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Excitation State:</span>
                    <span className={`font-mono text-[11px] font-semibold ${l1Nodes[selectedNodeIndex] > 0 ? 'text-rose-400' : 'text-slate-500'}`}>
                      {l1Nodes[selectedNodeIndex] > 0 ? 'EXCITED (Signal Propagated)' : 'SUPPRESSED (Gated at 0)'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeLayer === 'hidden2' && (
              <div className="space-y-3">
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                  <div className="text-[10px] text-slate-500 font-mono uppercase">Dense Layer 2 (Neuron #{selectedNodeIndex})</div>
                  <div className="text-sm font-bold text-white mt-0.5">
                    {nodeExplanationsL2[selectedNodeIndex]}
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Pre-Activation (z):</span>
                    <span className="font-mono text-slate-200 tabular-nums">
                      {l2Pre[selectedNodeIndex].toFixed(4)}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Activation Function:</span>
                    <span className="font-mono text-rose-400 font-bold">ReLU: max(0, z)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Post-Activation Output (a):</span>
                    <span className="font-mono text-white font-bold tabular-nums">
                      {l2Nodes[selectedNodeIndex].toFixed(4)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeLayer === 'output' && (
              <div className="space-y-3">
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                  <div className="text-[10px] text-slate-500 font-mono uppercase">Output Layer (Sigmoid Unit)</div>
                  <div className="text-sm font-bold text-white mt-0.5">
                    Binary Fraud Probability Classifier
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Logit / Linear Sum (z):</span>
                    <span className="font-mono text-slate-200 tabular-nums">{outputPre.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Sigmoid Formula:</span>
                    <span className="font-mono text-amber-400">σ(z) = 1 / (1 + e^-z)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Computed Probability:</span>
                    <span className="font-mono text-white font-bold tabular-nums">
                      {(outputProb * 100).toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Binary Classification:</span>
                    <span className={`font-mono font-bold ${outputProb >= 0.5 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {outputProb >= 0.5 ? '1 (FRAUDULENT)' : '0 (NORMAL)'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeLayer === 'input' && (
              <div className="space-y-3">
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                  <div className="text-[10px] text-slate-500 font-mono uppercase">Input Feature #{selectedNodeIndex}</div>
                  <div className="text-sm font-bold text-white mt-0.5">
                    {inputLabels[selectedNodeIndex]}
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Raw Value:</span>
                    <span className="font-mono text-white font-bold tabular-nums">
                      {rawVector[selectedNodeIndex]}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">StandardScaler Z-Score:</span>
                    <span className="font-mono text-amber-400 tabular-nums">
                      {inputScaled[selectedNodeIndex].toFixed(3)} σ
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 pt-1">
                    Normalized via StandardScaler so large amount scales do not drown out binary flags like failed attempts or location mismatch.
                  </div>
                </div>
              </div>
            )}

            {/* Mathematical Summary Card */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 text-[11px] text-slate-400 space-y-1.5">
              <div className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                <span>Colab Notebook Match</span>
              </div>
              <p>
                In <code>ANN_DL_prj_61a82bde.ipynb</code>, this model achieved <strong>83.25% - 86.0% test accuracy</strong> on 2,000 stratified UPI transactions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
