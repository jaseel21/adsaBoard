import React from 'react';
import { ShieldCheck, ShieldAlert, Lock, ExternalLink, Sparkles } from 'lucide-react';
import { useLanguage } from '../../store/LanguageContext';

export default function LinkSecurityBadge({ status, className = '' }) {
  const { lang } = useLanguage();

  switch (status) {
    case 'verified_campus':
      return (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 shadow-xs ${className}`}
          title={lang === 'ml' ? 'സ്ഥിരീകരിച്ച ഔദ്യോഗിക കാമ്പസ് പോർട്ടൽ' : 'Official Alathurpadi Dars Campus Asset'}
        >
          <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
          <span>{lang === 'ml' ? 'ഔദ്യോഗികം' : 'Official ADSA'}</span>
        </span>
      );

    case 'verified_comm':
      return (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-green-500/15 border border-green-500/30 text-green-700 dark:text-green-400 shadow-xs ${className}`}
          title={lang === 'ml' ? 'സ്ഥിരീകരിച്ച കാന്റീൻ കമ്മിറ്റി ഹോട്ട്ലൈൻ' : 'Verified Committee Communication Hotline'}
        >
          <Sparkles className="w-3 h-3 text-green-600 dark:text-green-400" />
          <span>{lang === 'ml' ? 'കമ്മിറ്റി ഹോട്ട്ലൈൻ' : 'Verified Hotline'}</span>
        </span>
      );

    case 'secure_external':
      return (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-cyan-500/15 border border-cyan-500/30 text-cyan-700 dark:text-cyan-400 shadow-xs ${className}`}
          title={lang === 'ml' ? 'സുരക്ഷിതമായ എൻക്രിപ്റ്റഡ് വെബ്സൈറ്റ്' : 'Verified HTTPS Encrypted Destination'}
        >
          <Lock className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
          <span>HTTPS Secure</span>
        </span>
      );

    case 'unverified':
    default:
      return (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-400 shadow-xs ${className}`}
          title={lang === 'ml' ? 'പുറത്തുനിന്നുള്ള വെബ്സൈറ്റ്: ശ്രദ്ധയോടെ ഉപയോഗിക്കുക' : 'External Web Link: Proceed with awareness'}
        >
          <ExternalLink className="w-3 h-3 text-amber-600 dark:text-amber-400" />
          <span>External Link</span>
        </span>
      );
  }
}
