import React from 'react';
import { ShieldCheck, Cpu } from 'lucide-react';

interface HeaderProps {
  activeTab: 'monitor' | 'evaluator' | 'network' | 'analytics' | 'dataset';
  onSelectTab: (tab: 'monitor' | 'evaluator' | 'network' | 'analytics' | 'dataset') => void;
  onOpenEvaluator: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  onOpenEvaluator,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-6 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
        {/* Zone 1: Brand title, one line */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center shadow-sm shadow-rose-950/50">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <span className="text-base font-bold tracking-tight text-white whitespace-nowrap">
            FraudGuard AI
          </span>
        </div>

        {/* Zone 2: 4-5 single-line navigation links */}
        <nav className="hidden md:flex items-center gap-1.5 text-sm font-medium">
          <button
            onClick={() => onSelectTab('monitor')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'monitor'
                ? 'bg-slate-800 text-white font-semibold shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            Live Monitor
          </button>
          <button
            onClick={() => onSelectTab('evaluator')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'evaluator'
                ? 'bg-slate-800 text-white font-semibold shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            Transaction Evaluator
          </button>
          <button
            onClick={() => onSelectTab('network')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'network'
                ? 'bg-slate-800 text-white font-semibold shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            Neural Network Inspector
          </button>
          <button
            onClick={() => onSelectTab('analytics')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'analytics'
                ? 'bg-slate-800 text-white font-semibold shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            Analytics & Reports
          </button>
          <button
            onClick={() => onSelectTab('dataset')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'dataset'
                ? 'bg-slate-800 text-white font-semibold shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            Dataset Lab
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenEvaluator}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 active:scale-[0.98] transition-all rounded-lg shadow-sm shadow-rose-950/40 whitespace-nowrap shrink-0"
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Evaluate Transaction</span>
          </button>
        </div>
      </div>
    </header>
  );
};
