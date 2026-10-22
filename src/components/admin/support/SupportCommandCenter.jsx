import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HeartHandshake,
  LayoutGrid,
  Table,
  BarChart3,
  ShieldCheck,
  RefreshCw,
  Plus,
  ArrowLeft,
  Download,
} from 'lucide-react';
import {
  subscribeSupportTickets,
} from '../../../utils/supportTicketService';
import { AuthContext } from '../../../store/AuthContext';
import { useLanguage } from '../../../store/LanguageContext';
import { soundEngine } from '../../../utils/soundEffects';
import { hapticEngine } from '../../../utils/haptics';
import SupportTelemetryRadar from './SupportTelemetryRadar';
import SupportKanbanBoard from './SupportKanbanBoard';
import SupportDataMatrix from './SupportDataMatrix';
import SupportInspectorDrawer from './SupportInspectorDrawer';
import UniversalDocumentModal from '../../export/UniversalDocumentModal';
import { useNavigate } from 'react-router-dom';

export default function SupportCommandCenter() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { user, role, staffProfile, isCentralCommittee, isDeveloper } = useContext(AuthContext);

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSurface, setActiveSurface] = useState('kanban'); // 'kanban' | 'matrix'
  const [inspectingTicket, setInspectingTicket] = useState(null);

  // Universal Document Viewer Modal State
  const [universalDoc, setUniversalDoc] = useState({ isOpen: false, data: null });

  const staffInfo = {
    uid: user?.uid,
    name: staffProfile?.name || user?.email?.split('@')[0] || 'Staff Officer',
    role: role || 'admin',
    email: user?.email,
  };

  // Real-time Firestore subscription
  useEffect(() => {
    setLoading(true);
    const unsub = subscribeSupportTickets(
      (list) => {
        setTickets(list);
        setLoading(false);

        // Keep inspectingTicket in sync if open
        setInspectingTicket((prev) => {
          if (!prev) return null;
          const fresh = list.find((t) => t.id === prev.id);
          return fresh || prev;
        });
      },
      (err) => {
        console.error('Support tickets subscription error:', err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  const handleSelectTicket = (ticket) => {
    soundEngine.playPop();
    hapticEngine.lightTap();
    setInspectingTicket(ticket);
  };

  const handleOpenExport = () => {
    soundEngine.playMechanicalClick();
    hapticEngine.lightTap();

    try {
      // Build export data for Universal Document Hub
      const rows = tickets.map((t, idx) => ({
        index: idx + 1,
        code: t.ticketNumber,
        category: t.category,
        urgency: t.urgency,
        status: t.status,
        token: t.student?.tokenNumber || '--',
        name: t.student?.name || 'Anonymous',
        subject: t.subject,
        createdAt: t.createdAt?.toDate ? t.createdAt.toDate().toLocaleDateString() : 'Recent',
      }));

      const csvContent =
        '#,' +
        'Ticket Code,Category,Urgency,Status,Token,Diner Name,Subject,Date\n' +
        rows
          .map(
            (r) =>
              `${r.index},"${r.code}","${r.category}","${r.urgency}","${r.status}","${r.token}","${r.name}","${r.subject}","${r.createdAt}"`
          )
          .join('\n');

      setUniversalDoc({
        isOpen: true,
        data: {
          type: 'csv',
          filename: `ADSA_Support_Tickets_${new Date().toISOString().slice(0, 10)}.csv`,
          title: 'ADSA Support & Feedback Master Roster',
          csvContent,
          totalCount: rows.length,
        },
      });
    } catch (e) {
      console.error('Export error:', e);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col gap-6 sm:gap-8">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate('/admin')}
            className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
            title="Return to Admin Board"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                {t('adminSupportTitle', 'Apex Support & Feedback Command Center')}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-extrabold uppercase">
                Staff Console
              </span>
            </div>
            <p className="text-xs sm:text-sm text-emerald-100 mt-1 max-w-2xl">
              {t(
                'adminSupportSubtitle',
                'Live diner telemetry, rapid issue triage, student dossiers & SLA control'
              )}
            </p>
          </div>
        </div>

        {/* Surface Switcher Buttons */}
        <div className="flex items-center p-1 rounded-2xl bg-black/30 border border-white/10 backdrop-blur-md">
          <button
            type="button"
            onClick={() => {
              soundEngine.playPop();
              hapticEngine.lightTap();
              setActiveSurface('kanban');
            }}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSurface === 'kanban'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-gray-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>{t('surfaceKanban', 'Kanban Board')}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playPop();
              hapticEngine.lightTap();
              setActiveSurface('matrix');
            }}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSurface === 'matrix'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-gray-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>{t('surfaceMatrix', 'Data Matrix')}</span>
          </button>
        </div>
      </div>

      {/* Real-Time Telemetry Bar */}
      <SupportTelemetryRadar tickets={tickets} />

      {/* Main Surface View */}
      {loading ? (
        <div className="p-16 flex flex-col items-center justify-center gap-3 text-center">
          <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
          <span className="text-xs font-semibold text-gray-500">Connecting to real-time ticket stream...</span>
        </div>
      ) : activeSurface === 'kanban' ? (
        <SupportKanbanBoard
          tickets={tickets}
          onSelectTicket={handleSelectTicket}
          selectedTicketId={inspectingTicket?.id}
          staffInfo={staffInfo}
        />
      ) : (
        <SupportDataMatrix
          tickets={tickets}
          onSelectTicket={handleSelectTicket}
          onOpenExport={handleOpenExport}
          staffInfo={staffInfo}
        />
      )}

      {/* Deep Inspector Drawer */}
      <SupportInspectorDrawer
        isOpen={Boolean(inspectingTicket)}
        ticket={inspectingTicket}
        onClose={() => setInspectingTicket(null)}
        staffInfo={staffInfo}
        isCentralCommittee={isCentralCommittee || isDeveloper}
      />

      {/* Universal Document Hub Modal for Export */}
      <UniversalDocumentModal
        isOpen={universalDoc.isOpen}
        onClose={() => setUniversalDoc({ isOpen: false, data: null })}
        documentData={universalDoc.data}
      />
    </div>
  );
}
