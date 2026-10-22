import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, AlertCircle, Clock, UtensilsCrossed, Calendar, Layers } from 'lucide-react';
import { useNotifications } from '../../store/NotificationContext';
import { useLanguage } from '../../store/LanguageContext';
import { soundEngine } from '../../utils/soundEffects';
import { hapticEngine } from '../../utils/haptics';

export default function NotificationFilterTabs() {
  const { activeCategory, setActiveCategory, notifications } = useNotifications();
  const { t } = useLanguage();

  const categories = [
    { id: 'all', label: t('filterAllNotifs', 'All Notices'), icon: Layers },
    { id: 'urgent', label: t('filterUrgentNotifs', 'Urgent'), icon: AlertCircle },
    { id: 'cutoff', label: t('filterCutoffNotifs', 'Cutoffs'), icon: Clock },
    { id: 'menu', label: t('filterMenuNotifs', 'Food Menu'), icon: UtensilsCrossed },
    { id: 'feast', label: t('filterFeastNotifs', 'Feast / Events'), icon: Sparkles },
  ];

  const handleSelect = (id) => {
    soundEngine.playPop();
    hapticEngine.lightTap();
    setActiveCategory(id);
  };

  // Compute count for each category
  const getCategoryCount = (id) => {
    if (id === 'all') return notifications.length;
    if (id === 'urgent') {
      return notifications.filter((n) => n.severity === 'critical' || n.severity === 'warning').length;
    }
    return notifications.filter((n) => n.category === id).length;
  };

  return (
    <div className="w-full overflow-x-auto scrollbar-none py-1">
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-gray-100/80 dark:bg-white/5 border border-gray-200/60 dark:border-white/5 min-w-max">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          const count = getCategoryCount(cat.id);

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleSelect(cat.id)}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors select-none ${
                isActive
                  ? 'text-emerald-700 dark:text-emerald-300'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeNotificationFilterPill"
                  className="absolute inset-0 rounded-xl bg-white dark:bg-emerald-950/60 shadow-sm border border-emerald-500/30"
                  transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                />
              )}

              <span className="relative z-10 flex items-center gap-1.5">
                <Icon
                  className={`w-3.5 h-3.5 ${
                    isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'
                  }`}
                />
                <span>{cat.label}</span>
                {count > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      isActive
                        ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                        : 'bg-black/5 dark:bg-white/10 text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
