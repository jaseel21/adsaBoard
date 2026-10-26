import React from 'react';
import { motion } from 'framer-motion';
import {
  UtensilsCrossed,
  ChefHat,
  Building2,
  Shield,
  Users,
  Compass,
  ArrowRight,
} from 'lucide-react';
import { soundEngine } from '../../../utils/soundEffects';
import { hapticEngine } from '../../../utils/haptics';

/**
 * CampusZoneTopology
 * Visual architectural topology map of institutional campus zones.
 * Displays real-time occupancy distribution and active personnel per sector.
 */
export default function CampusZoneTopology({
  sessions = [],
  selectedZone = 'all',
  onSelectZone,
  onSelectSession,
}) {
  const zones = [
    {
      id: 'canteen_hall',
      name: 'Canteen Dining Hall',
      subtitle: 'Public Dashboard & Walk-in Dining Kiosks',
      icon: UtensilsCrossed,
      color: 'emerald',
      gradient: 'from-emerald-600/20 to-teal-600/20',
      borderColor: 'border-emerald-500/30',
      badgeClass: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
      capacityEstimate: 300,
    },
    {
      id: 'kitchen_ops',
      name: 'Central Kitchen & Pantry',
      subtitle: 'Kitchen Display Systems (KDS) & Cook Terminals',
      icon: ChefHat,
      color: 'purple',
      gradient: 'from-purple-600/20 to-indigo-600/20',
      borderColor: 'border-purple-500/30',
      badgeClass: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
      capacityEstimate: 12,
    },
    {
      id: 'dars_hostel',
      name: 'Dars Hostels & Classrooms',
      subtitle: 'Student Self-Service Token Portals & Leave Hub',
      icon: Building2,
      color: 'teal',
      gradient: 'from-teal-600/20 to-cyan-600/20',
      borderColor: 'border-teal-500/30',
      badgeClass: 'bg-teal-500/20 text-teal-400 border-teal-500/40',
      capacityEstimate: 200,
    },
    {
      id: 'admin_office',
      name: 'Administrative Chambers',
      subtitle: 'Central Committee & Canteen Officers',
      icon: Shield,
      color: 'cyan',
      gradient: 'from-cyan-600/20 to-blue-600/20',
      borderColor: 'border-cyan-500/30',
      badgeClass: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40',
      capacityEstimate: 10,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {zones.map((zone) => {
        const ZoneIcon = zone.icon;
        const zoneSessions = sessions.filter((s) => s.zone === zone.id);
        const count = zoneSessions.length;
        const isSelected = selectedZone === zone.id;

        return (
          <motion.div
            key={zone.id}
            whileHover={{ y: -3 }}
            onClick={() => {
              soundEngine.playPop();
              hapticEngine.lightTap();
              if (onSelectZone) {
                onSelectZone(isSelected ? 'all' : zone.id);
              }
            }}
            className={`cursor-pointer p-5 rounded-3xl border transition-all duration-300 relative overflow-hidden backdrop-blur-xl ${
              isSelected
                ? `bg-gradient-to-br ${zone.gradient} ${zone.borderColor} shadow-xl ring-2 ring-emerald-500/30`
                : 'bg-white/80 dark:bg-[#0c1412]/90 border-gray-200/80 dark:border-white/10 hover:border-emerald-500/40'
            }`}
          >
            {/* Top Row: Zone Icon & Headcount Badge */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/10 dark:bg-white/5 border border-white/10 flex items-center justify-center shrink-0 shadow-inner">
                  <ZoneIcon className="w-6 h-6 text-gray-900 dark:text-white" />
                </div>

                <div>
                  <h4 className="font-extrabold text-base text-gray-900 dark:text-white leading-tight">
                    {zone.name}
                  </h4>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                    {zone.subtitle}
                  </p>
                </div>
              </div>

              <div
                className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border shrink-0 ${zone.badgeClass}`}
              >
                {count} Online
              </div>
            </div>

            {/* Active Members Mini Avatar Ribbon */}
            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/5">
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
                <span>Active Targets in Sector:</span>
                <span className="font-bold text-gray-900 dark:text-white">{count} Devices</span>
              </div>

              {zoneSessions.length === 0 ? (
                <div className="text-[11px] text-gray-400 italic py-1">
                  Sector quiet — no current active connections
                </div>
              ) : (
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                  {zoneSessions.slice(0, 8).map((s) => (
                    <button
                      key={s.sessionId}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        soundEngine.playMechanicalClick();
                        hapticEngine.mediumTick();
                        if (onSelectSession) onSelectSession(s);
                      }}
                      className="px-2.5 py-1 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-emerald-600 hover:text-white border border-gray-200/60 dark:border-white/10 text-[11px] font-black shrink-0 transition-all text-gray-800 dark:text-gray-200"
                    >
                      {s.userType === 'student' && s.tokenNo ? `#${s.tokenNo}` : s.identifier.slice(0, 14)}
                    </button>
                  ))}
                  {zoneSessions.length > 8 && (
                    <span className="text-[10px] font-bold text-gray-400 px-1">
                      +{zoneSessions.length - 8} more
                    </span>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
