import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  SlidersHorizontal,
  Flame,
  CheckCircle2,
  Clock,
  ArrowUpDown,
  Download,
  Eye,
  Trash2,
  Filter,
} from 'lucide-react';
import {
  SUPPORT_STATUSES,
  SUPPORT_CATEGORIES,
  SUPPORT_URGENCIES,
  updateTicketStatus,
} from '../../../utils/supportTicketService';
import { soundEngine } from '../../../utils/soundEffects';
import { hapticEngine } from '../../../utils/haptics';
import { useLanguage } from '../../../store/LanguageContext';

export default function SupportDataMatrix({
  tickets = [],
  onSelectTicket,
  onOpenExport,
  staffInfo = {},
}) {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState([]);

  // Filtered and sorted ticket list
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;

      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase().trim();
      const code = (t.ticketNumber || '').toLowerCase();
      const name = (t.student?.name || '').toLowerCase();
      const token = String(t.student?.tokenNumber || '');
      const subject = (t.subject || '').toLowerCase();

      return code.includes(q) || name.includes(q) || token.includes(q) || subject.includes(q);
    });
  }, [tickets, statusFilter, categoryFilter, searchTerm]);

  const handleSelectAll = (e) => {
    soundEngine.playPop();
    hapticEngine.lightTap();
    if (e.target.checked) {
      setSelectedIds(filteredTickets.map((t) => t.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id) => {
    soundEngine.playPop();
    hapticEngine.lightTap();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBatchResolve = async () => {
    if (selectedIds.length === 0) return;
    soundEngine.playMechanicalClick();
    hapticEngine.mediumTick();

    try {
      await Promise.all(
        selectedIds.map((id) =>
          updateTicketStatus(id, 'resolved', staffInfo, 'Batch marked resolved from Data Matrix')
        )
      );
      soundEngine.playSoftChime();
      setSelectedIds([]);
    } catch (err) {
      console.error('Batch resolve error:', err);
    }
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Controls Bar: Search, Filters, Batch Actions, Export */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-3xl bg-white dark:bg-[#0c1412] border border-gray-200/80 dark:border-white/10 shadow-sm">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Code, Token #, Name, or Subject..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-700 dark:text-gray-300 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            {Object.values(SUPPORT_STATUSES).map((st) => (
              <option key={st.id} value={st.id}>
                {st.label}
              </option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-700 dark:text-gray-300 focus:outline-none"
          >
            <option value="all">All Categories</option>
            {Object.values(SUPPORT_CATEGORIES).map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.label}
              </option>
            ))}
          </select>

          {/* Batch Resolve Button */}
          {selectedIds.length > 0 && (
            <button
              type="button"
              onClick={handleBatchResolve}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/25 active:scale-95 transition-all"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Resolve Selected ({selectedIds.length})</span>
            </button>
          )}

          {/* Export Report Trigger */}
          {onOpenExport && (
            <button
              type="button"
              onClick={() => {
                soundEngine.playPop();
                hapticEngine.lightTap();
                onOpenExport();
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-700 dark:text-gray-200 font-bold text-xs transition-all border border-gray-200/60 dark:border-white/10"
              title="Export Support Roster to PDF / CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
          )}
        </div>
      </div>

      {/* High-Performance Data Table */}
      <div className="w-full overflow-x-auto rounded-3xl bg-white dark:bg-[#0c1412] border border-gray-200/80 dark:border-white/10 shadow-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-200/80 dark:border-white/10 bg-gray-50/70 dark:bg-white/[0.02] text-[11px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">
              <th className="py-3 px-4 w-10 text-center">
                <input
                  type="checkbox"
                  checked={
                    filteredTickets.length > 0 && selectedIds.length === filteredTickets.length
                  }
                  onChange={handleSelectAll}
                  className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 cursor-pointer"
                />
              </th>
              <th className="py-3 px-4">Code</th>
              <th className="py-3 px-4">Diner / Token</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Subject</th>
              <th className="py-3 px-4">Urgency</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-xs font-medium">
            {filteredTickets.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-gray-400">
                  No support tickets match the current filter.
                </td>
              </tr>
            ) : (
              filteredTickets.map((ticket) => {
                const isSelected = selectedIds.includes(ticket.id);
                const isCritical = ticket.urgency === 'critical';
                const statusInfo = SUPPORT_STATUSES[ticket.status] || {};
                const categoryInfo = SUPPORT_CATEGORIES[ticket.category] || {};

                return (
                  <tr
                    key={ticket.id}
                    onClick={() => onSelectTicket && onSelectTicket(ticket)}
                    className={`hover:bg-gray-50/80 dark:hover:bg-white/5 transition-colors cursor-pointer ${
                      isSelected ? 'bg-emerald-50/40 dark:bg-emerald-950/20' : ''
                    }`}
                  >
                    <td
                      className="py-3 px-4 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(ticket.id)}
                        className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 cursor-pointer"
                      />
                    </td>
                    <td className="py-3 px-4 font-mono font-black text-emerald-600 dark:text-emerald-400">
                      {ticket.ticketNumber}
                    </td>
                    <td className="py-3 px-4 text-gray-900 dark:text-white font-semibold">
                      {ticket.student?.tokenNumber ? (
                        <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 mr-1.5">
                          #{ticket.student.tokenNumber}
                        </span>
                      ) : null}
                      <span>{ticket.student?.name || 'Anonymous'}</span>
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-300">
                      {categoryInfo.label || ticket.category}
                    </td>
                    <td className="py-3 px-4 text-gray-800 dark:text-gray-200 max-w-xs truncate">
                      {ticket.subject}
                    </td>
                    <td className="py-3 px-4">
                      {isCritical ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 text-[10px] font-extrabold animate-pulse">
                          <Flame className="w-3 h-3" /> Critical
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-gray-500 uppercase">
                          {ticket.urgency}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          ticket.status === 'resolved'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                        }`}
                      >
                        {statusInfo.label || ticket.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          soundEngine.playMechanicalClick();
                          if (onSelectTicket) onSelectTicket(ticket);
                        }}
                        className="p-1.5 rounded-xl hover:bg-gray-200 dark:hover:bg-white/10 text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                        title="Inspect ticket"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
