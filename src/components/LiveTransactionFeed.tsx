import React, { useState } from 'react';
import { TransactionRecord } from '../types/fraud';
import { Search, Filter, ShieldAlert, CheckCircle2, AlertTriangle, Eye, Play, Pause, Download } from 'lucide-react';
import { exportToCSV } from '../data/mockTransactions';

interface LiveTransactionFeedProps {
  transactions: TransactionRecord[];
  onSelectTransaction: (record: TransactionRecord) => void;
  onSimulateNew: () => void;
  isSimulating: boolean;
  onToggleSimulating: () => void;
}

export const LiveTransactionFeed: React.FC<LiveTransactionFeedProps> = ({
  transactions,
  onSelectTransaction,
  onSimulateNew,
  isSimulating,
  onToggleSimulating,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Filtered list
  const filtered = transactions.filter((t) => {
    const matchesSearch =
      t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.beneficiaryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.senderAccount.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.locationCity.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === 'ALL' || t.transaction_type === typeFilter;

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'FRAUD' && t.isFraud) ||
      (statusFilter === 'NORMAL' && !t.isFraud) ||
      (statusFilter === 'FLAGGED' && t.status === 'FLAGGED');

    return matchesSearch && matchesType && matchesStatus;
  });

  const handleExportCSV = () => {
    const csv = exportToCSV(filtered);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `upi_fraud_export_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Control Strip */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by ID, beneficiary, account, or city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-rose-500"
          />
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Type Filter */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            {['ALL', 'UPI', 'P2P', 'P2M'].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setTypeFilter(type)}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                  typeFilter === type ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            {[
              { id: 'ALL', label: 'All Status' },
              { id: 'FRAUD', label: 'Fraud / Blocked' },
              { id: 'FLAGGED', label: 'Suspicious 2FA' },
              { id: 'NORMAL', label: 'Normal / Approved' },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setStatusFilter(st.id)}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                  statusFilter === st.id ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* Live Simulator Toggle */}
          <button
            type="button"
            onClick={onToggleSimulating}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
              isSimulating
                ? 'bg-amber-950/70 border-amber-600 text-amber-300'
                : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            {isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-rose-400" />}
            <span>{isSimulating ? 'Pause Stream' : 'Auto Stream'}</span>
          </button>

          {/* Single Event Injector */}
          <button
            type="button"
            onClick={onSimulateNew}
            className="px-3 py-1.5 text-xs font-medium bg-slate-950 border border-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors"
          >
            + New Txn
          </button>

          {/* Export CSV */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-950 border border-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* High-Density Data Grid */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold text-[11px]">
                <th className="py-3 px-4">Transaction ID</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Beneficiary & City</th>
                <th className="py-3 px-4 text-right">Amount (₹)</th>
                <th className="py-3 px-4 text-center">Type</th>
                <th className="py-3 px-4 text-center">Hardware / Geo</th>
                <th className="py-3 px-4 text-center">Auth Failures</th>
                <th className="py-3 px-4 text-right">ANN Fraud Prob</th>
                <th className="py-3 px-4 text-center">Classification</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500">
                    No transactions match the selected filter criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => onSelectTransaction(item)}
                    className="hover:bg-slate-800/40 cursor-pointer transition-colors group"
                  >
                    {/* ID */}
                    <td className="py-3 px-4 font-mono font-medium text-slate-300 whitespace-nowrap">
                      {item.id}
                    </td>

                    {/* Timestamp */}
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                      {item.timestamp.substring(11, 19)}
                      <span className="text-slate-600 ml-1">({String(item.hour).padStart(2, '0')}:00h)</span>
                    </td>

                    {/* Beneficiary */}
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-200 truncate max-w-[160px]">
                        {item.beneficiaryName}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate max-w-[160px]">
                        {item.locationCity}
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="py-3 px-4 text-right font-mono font-semibold text-white tabular-nums">
                      ₹{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    {/* Type */}
                    <td className="py-3 px-4 text-center">
                      <span className="font-mono text-[11px] text-slate-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        {item.transaction_type}
                      </span>
                    </td>

                    {/* Hardware & Location */}
                    <td className="py-3 px-4 text-center font-mono text-[11px]">
                      <div className="flex items-center justify-center gap-1.5">
                        <span
                          title={item.device_match === 1 ? 'Trusted Device' : 'Unrecognized Device'}
                          className={`w-2 h-2 rounded-full ${item.device_match === 1 ? 'bg-emerald-400' : 'bg-rose-500'}`}
                        />
                        <span
                          title={item.location_match === 1 ? 'Location Matched' : 'Location Mismatch'}
                          className={`w-2 h-2 rounded-full ${item.location_match === 1 ? 'bg-emerald-400' : 'bg-rose-500'}`}
                        />
                        <span className="text-[10px] text-slate-400">
                          {item.device_match === 1 && item.location_match === 1 ? 'Trusted' : 'Anomaly'}
                        </span>
                      </div>
                    </td>

                    {/* Failed Attempts */}
                    <td className="py-3 px-4 text-center font-mono tabular-nums">
                      {item.failed_attempts > 0 ? (
                        <span className={`font-bold px-1.5 py-0.5 rounded text-[11px] ${item.failed_attempts >= 3 ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-amber-950 text-amber-300'}`}>
                          {item.failed_attempts} fails
                        </span>
                      ) : (
                        <span className="text-slate-500">0</span>
                      )}
                    </td>

                    {/* ANN Probability */}
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold">
                      <span className={item.annScore >= 0.5 ? 'text-rose-400' : item.annScore >= 0.35 ? 'text-amber-400' : 'text-emerald-400'}>
                        {(item.annScore * 100).toFixed(1)}%
                      </span>
                    </td>

                    {/* Classification */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {item.isFraud ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-400">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>BLOCKED</span>
                        </span>
                      ) : item.status === 'FLAGGED' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>FLAGGED</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>APPROVED</span>
                        </span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTransaction(item);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        title="View Forensic Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info strip */}
        <div className="bg-slate-950 px-4 py-2.5 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing <span className="font-mono text-slate-300">{filtered.length}</span> of{' '}
            <span className="font-mono text-slate-300">{transactions.length}</span> recorded transactions
          </div>
          <div className="flex items-center gap-3">
            <span>● Green = Verified</span>
            <span>● Red = Flagged Anomaly</span>
          </div>
        </div>
      </div>
    </div>
  );
};
