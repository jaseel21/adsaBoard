import React from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../../store/LanguageContext';
import { useFeedback } from '../../utils/useFeedback';
import { ArrowDown, Navigation, Bell, HelpCircle } from 'lucide-react';

/**
 * Universal Skip-to-Content Navigation Hub
 * WCAG 2.2 Level AAA (Criterion 2.4.1 Bypass Blocks)
 * Remains invisible until focused by keyboard Tab navigation, then expands as a premium floating dock.
 */
export default function SkipToContent() {
  const { language } = useLanguage();
  const { feedback } = useFeedback();
  const location = useLocation();

  const isAdminRoute =
    location.pathname.startsWith('/admin') ||
    location.pathname === '/student-management' ||
    location.pathname === '/alogin';

  const handleSkipClick = (targetId) => {
    feedback('tick');
    const target = document.getElementById(targetId);
    if (target) {
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: false });
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const skipLinks = [
    {
      id: 'main-content',
      labelEn: 'Skip to Main Content',
      labelMl: 'പ്രധാന ഉള്ളടക്കത്തിലേക്ക് പോകുക',
      icon: ArrowDown,
    },
    {
      id: 'nav-landmark',
      labelEn: 'Skip to Navigation Menu',
      labelMl: 'മെനുവിലേക്ക് പോകുക',
      icon: Navigation,
    },
    {
      id: 'announcements-landmark',
      labelEn: 'Skip to Announcements & Cutoff Alerts',
      labelMl: 'അറിയിപ്പുകളിലേക്ക് പോകുക',
      icon: Bell,
    },
    ...(!isAdminRoute
      ? [
          {
            id: 'footer-landmark',
            labelEn: 'Skip to Footer & Care Hub',
            labelMl: 'ഫൂട്ടറിലേക്ക് പോകുക',
            icon: HelpCircle,
          },
        ]
      : []),
  ];

  return (
    <nav
      aria-label={language === 'ml' ? 'കുറുക്കുവഴി നാവിഗേഷൻ' : 'Skip Navigation Shortcuts'}
      className="fixed top-2 left-2 z-[99999] pointer-events-none"
    >
      <div className="flex flex-col gap-1.5 pointer-events-auto">
        {skipLinks.map((link) => {
          const Icon = link.icon;
          return (
            <a
              key={link.id}
              href={`#${link.id}`}
              onClick={(e) => {
                e.preventDefault();
                handleSkipClick(link.id);
              }}
              className="
                sr-only focus:not-sr-only
                px-4 py-2.5 rounded-2xl
                bg-emerald-600 text-white font-bold text-xs tracking-tight shadow-2xl
                border-2 border-white/80 dark:border-emerald-300
                ring-4 ring-emerald-500/40 outline-none
                flex items-center gap-2 transition-all transform
                hover:bg-emerald-700 active:scale-95
              "
            >
              <Icon className="w-3.5 h-3.5 text-emerald-200" aria-hidden="true" />
              <span>{language === 'ml' ? link.labelMl : link.labelEn}</span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}
