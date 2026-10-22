import React from 'react';
import { motion } from 'framer-motion';
import {
  Phone,
  MessageCircle,
  Clock,
  ShieldCheck,
  MapPin,
  ExternalLink,
  ChefHat,
  Cpu,
  Users,
  HeartHandshake,
} from 'lucide-react';
import { COMMITTEE_HOTLINES } from '../../utils/supportFaqData';
import { soundEngine } from '../../utils/soundEffects';
import { hapticEngine } from '../../utils/haptics';
import { useLanguage } from '../../store/LanguageContext';
import ApexLinkPreview from '../preview/ApexLinkPreview';

export default function CareDirectory() {
  const { lang } = useLanguage();

  const handleAction = () => {
    soundEngine.playPop();
    hapticEngine.lightTap();
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Location Banner Card */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-emerald-500/15 border border-emerald-500/30 flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-emerald-600/30">
          <MapPin className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-extrabold text-gray-900 dark:text-white">
            ADSA Canteen Operations Desk
          </h4>
          <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5 leading-relaxed">
            Ground Floor Mess Counter, Alathurpadi Juma Masjid Complex, Melmuri, Malappuram, Kerala 676517.
          </p>
          <div className="flex items-center gap-2 mt-2 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
            <Clock className="w-3.5 h-3.5" />
            <span>Counter Hours: 06:00 AM – 02:00 PM & 06:00 PM – 09:30 PM IST</span>
          </div>
        </div>
      </div>

      {/* Hotline Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
        {COMMITTEE_HOTLINES.map((contact) => {
          const roleTitle = lang === 'ml' ? contact.roleMl : contact.roleEn;
          const timing = lang === 'ml' ? contact.availableTimeMl : contact.availableTimeEn;
          const duty = lang === 'ml' ? contact.primaryDutyMl : contact.primaryDutyEn;

          return (
            <motion.div
              key={contact.id}
              whileHover={{ y: -3 }}
              className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#0c1412] border border-gray-200/80 dark:border-white/10 shadow-lg flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    {roleTitle}
                  </span>
                  <span className="text-[10px] text-gray-400 flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3" />
                    {timing}
                  </span>
                </div>

                <h3 className="text-base font-extrabold text-gray-900 dark:text-white mt-2 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  {contact.name}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-snug">
                  {duty}
                </p>
              </div>

              {/* Action Buttons: Phone & WhatsApp */}
              <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-white/5">
                <ApexLinkPreview url={`tel:${contact.phone.replace(/\s+/g, '')}`} className="flex-1">
                  <a
                    href={`tel:${contact.phone.replace(/\s+/g, '')}`}
                    onClick={handleAction}
                    className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 text-xs font-bold transition-all"
                  >
                    <Phone className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                    <span>Call Desk</span>
                  </a>
                </ApexLinkPreview>

                <ApexLinkPreview url={`https://wa.me/${contact.whatsapp}`} className="flex-1">
                  <a
                    href={`https://wa.me/${contact.whatsapp}?text=Assalamu%20Alaikum,%20I%20am%20contacting%20regarding%20ADSA%20Dars%20canteen%20inquiry.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleAction}
                    className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                </ApexLinkPreview>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
