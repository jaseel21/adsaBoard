import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Inbox,
  Clock,
  Flame,
  CheckCircle2,
  Smile,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Star,
} from 'lucide-react';
import { useLanguage } from '../../../store/LanguageContext';
import { SUPPORT_CATEGORIES } from '../../../utils/supportTicketService';

export default function SupportTelemetryRadar({ tickets = [] }) {
  const { t } = useLanguage();

  const metrics = useMemo(() => {
    const total = tickets.length;
    const open = tickets.filter((t) => t.status === 'new' || t.status === 'triaged' || t.status === 'in_progress').length;
    const critical = tickets.filter((t) => t.urgency === 'critical' && t.status !== 'resolved' && t.status !== 'closed').length;
    const resolved = tickets.filter((t) => t.status === 'resolved' || t.status === 'closed').length;

    // Satisfaction score from 1-5 ratings
    const ratedTickets = tickets.filter((t) => typeof t.rating === 'number' && t.rating > 0);
    const avgRating = ratedTickets.length > 0
      ? (ratedTickets.reduce((acc, t) => acc + t.rating, 0) / ratedTickets.length).toFixed(1)
      : '5.0';
    const satisfactionPercent = Math.round((Number(avgRating) / 5) * 100);

    // Category breakdown
    const categoryCounts = {};
    Object.keys(SUPPORT_CATEGORIES).forEach((key) => {
      categoryCounts[key] = 0;
    });
    tickets.forEach((t) => {
      if (categoryCounts[t.category] !== undefined) {
        categoryCounts[t.category]++;
      }
    });

    return {
      total,
      open,
      critical,
      resolved,
      avgRating,
      satisfactionPercent,
      categoryCounts,
    };
  }, [tickets]);

  return (
    <div className="w-full grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
      {/* 1. Total Inbound */}
      <motion.div
        whileHover={{ y: -2 }}
        className="p-4 rounded-3xl bg-white dark:bg-[#0c1412] border border-gray-200/80 dark:border-white/10 shadow-sm flex flex-col justify-between"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
            {t('totalTickets', 'Total Inbound')}
          </span>
          <div className="w-7 h-7 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 flex items-center justify-center">
            <Inbox className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-2">
          <span className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white font-mono">
            {metrics.total}
          </span>
          <span className="text-[10px] text-gray-400 block mt-0.5">All logged requests</span>
        </div>
      </motion.div>

      {/* 2. Active Pending Triage */}
      <motion.div
        whileHover={{ y: -2 }}
        className="p-4 rounded-3xl bg-white dark:bg-[#0c1412] border border-gray-200/80 dark:border-white/10 shadow-sm flex flex-col justify-between"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
            {t('openTickets', 'Active Triage')}
          </span>
          <div className="w-7 h-7 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Clock className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-2">
          <span className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 font-mono">
            {metrics.open}
          </span>
          <span className="text-[10px] text-gray-400 block mt-0.5">Awaiting resolution</span>
        </div>
      </motion.div>

      {/* 3. Urgent Lockouts */}
      <motion.div
        whileHover={{ y: -2 }}
        className={`p-4 rounded-3xl border shadow-sm flex flex-col justify-between transition-all ${
          metrics.critical > 0
            ? 'bg-rose-50/80 dark:bg-rose-950/20 border-rose-500/40'
            : 'bg-white dark:bg-[#0c1412] border-gray-200/80 dark:border-white/10'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
            {t('criticalTickets', 'Urgent Lockouts')}
          </span>
          <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${
            metrics.critical > 0
              ? 'bg-rose-600 text-white animate-pulse'
              : 'bg-gray-100 dark:bg-white/10 text-gray-400'
          }`}>
            <Flame className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-2">
          <span className={`text-2xl sm:text-3xl font-black font-mono ${
            metrics.critical > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-gray-900 dark:text-white'
          }`}>
            {metrics.critical}
          </span>
          <span className="text-[10px] text-gray-400 block mt-0.5">High priority queue</span>
        </div>
      </motion.div>

      {/* 4. Resolved Tickets */}
      <motion.div
        whileHover={{ y: -2 }}
        className="p-4 rounded-3xl bg-white dark:bg-[#0c1412] border border-gray-200/80 dark:border-white/10 shadow-sm flex flex-col justify-between"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
            Resolved
          </span>
          <div className="w-7 h-7 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-2">
          <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            {metrics.resolved}
          </span>
          <span className="text-[10px] text-gray-400 block mt-0.5">Cases closed</span>
        </div>
      </motion.div>

      {/* 5. Diner Satisfaction Health */}
      <motion.div
        whileHover={{ y: -2 }}
        className="p-4 rounded-3xl bg-white dark:bg-[#0c1412] border border-gray-200/80 dark:border-white/10 shadow-sm flex flex-col justify-between col-span-2 sm:col-span-1"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
            {t('sentimentScore', 'Diner Satisfaction')}
          </span>
          <div className="w-7 h-7 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center">
            <Smile className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-2">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-teal-600 dark:text-teal-400 font-mono">
              {metrics.satisfactionPercent}%
            </span>
            <span className="text-xs font-mono font-bold text-gray-500 inline-flex items-center gap-0.5">
              <span>({metrics.avgRating}</span>
              <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400 inline -mt-0.5" />
              <span>)</span>
            </span>
          </div>
          <span className="text-[10px] text-gray-400 block mt-0.5">Real-time diner sentiment</span>
        </div>
      </motion.div>
    </div>
  );
}
