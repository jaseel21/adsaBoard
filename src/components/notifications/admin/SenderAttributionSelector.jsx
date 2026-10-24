import { ShieldCheck, Check, Building2, User, Eye, EyeOff, Lock } from 'lucide-react';
import { SENDER_AUTHORITIES, AUTHORITY_METADATA } from '../../../utils/notificationService';

export default function SenderAttributionSelector({ value, onChange }) {
  const showSender = value?.showSender !== false;
  const authorityType = value?.authorityType || SENDER_AUTHORITIES.CANTEEN_WING;
  const customTitle = value?.customTitle || '';
  const signOffName = value?.signOffName || '';

  const handleToggleShow = (enabled) => {
    onChange({
      ...value,
      showSender: enabled,
    });
  };

  const handleAuthorityChange = (type) => {
    onChange({
      ...value,
      authorityType: type,
    });
  };

  const authorities = [
    { id: SENDER_AUTHORITIES.CENTRAL_COMMITTEE, label: 'Central Committee', desc: 'ADSA Central Committee' },
    { id: SENDER_AUTHORITIES.CANTEEN_WING, label: 'Canteen Sub-Committee', desc: 'Dining & Food Services' },
    { id: SENDER_AUTHORITIES.KITCHEN_CHEFS, label: 'Kitchen & Catering Wing', desc: 'Chefs & Prep Staff' },
    { id: SENDER_AUTHORITIES.DEVELOPERS, label: 'Developers & System', desc: 'T-Board Architects' },
    { id: SENDER_AUTHORITIES.EXEC_LEADERSHIP, label: 'President / Gen. Secretary', desc: 'Executive Leaders' },
    { id: SENDER_AUTHORITIES.WARDEN, label: 'Hostel & Campus Warden', desc: 'Discipline & Residency' },
    { id: SENDER_AUTHORITIES.CUSTOM, label: 'Custom Designation', desc: 'Specify manual title' },
  ];

  return (
    <div className="p-3.5 sm:p-4 rounded-2xl bg-gray-50/80 dark:bg-white/5 border border-gray-200/80 dark:border-white/10 space-y-3.5">
      {/* Top Toggle Switch */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-gray-800 dark:text-gray-200 block">
              Sender Attribution & Sign-off
            </span>
            <span className="text-[11px] text-gray-500 dark:text-gray-400">
              Control whether to display the official dispatch authority or an anonymous bulletin
            </span>
          </div>
        </div>

        {/* Toggle Pill */}
        <button
          type="button"
          onClick={() => handleToggleShow(!showSender)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
            showSender
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-400'
          }`}
        >
          {showSender ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          <span>{showSender ? 'Show Sender' : 'Hide Sender'}</span>
        </button>
      </div>

      {/* When Show Sender is ON */}
      {showSender ? (
        <div className="space-y-3 pt-2 border-t border-gray-200/60 dark:border-white/5">
          <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300 block">
            Select Official Dispatch Authority:
          </span>

          {/* Authority Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {authorities.map((auth) => {
              const isSelected = authorityType === auth.id;
              const meta = AUTHORITY_METADATA[auth.id];

              return (
                <button
                  key={auth.id}
                  type="button"
                  onClick={() => handleAuthorityChange(auth.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-white dark:bg-emerald-950/60 border-emerald-500 shadow-xs'
                      : 'bg-white dark:bg-black/30 border-gray-200 dark:border-white/10 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-black text-gray-800 dark:text-gray-200 tracking-tight">
                      {auth.label}
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />}
                  </div>
                  <span className="text-[10px] text-gray-400 mt-1 block">
                    {auth.desc}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Custom Designation Input */}
          {authorityType === SENDER_AUTHORITIES.CUSTOM && (
            <div className="pt-1">
              <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">
                Custom Authority Title *
              </label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => onChange({ ...value, customTitle: e.target.value })}
                placeholder="e.g. Ramadan Special Dining Committee"
                className="w-full px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-black/30 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white"
              />
            </div>
          )}

          {/* Optional Individual Signatory Name */}
          <div className="pt-1">
            <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">
              Individual Signatory Name (Optional)
            </label>
            <input
              type="text"
              value={signOffName}
              onChange={(e) => onChange({ ...value, signOffName: e.target.value })}
              placeholder="e.g. Muhammed Ameen (Convenor) or Kitchen Supervisor"
              className="w-full px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-black/30 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      ) : (
        <div className="p-2.5 rounded-xl bg-black/5 dark:bg-black/30 text-[11px] text-gray-500 dark:text-gray-400 font-medium leading-relaxed flex items-start gap-1.5">
          <Lock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
          <span>Notice will display as an anonymous neutral bulletin (<strong>&quot;Official Campus Bulletin&quot; / &quot;ഔദ്യോഗിക അറിയിപ്പ്&quot;</strong>) with no specific author or committee branding visible to users.</span>
        </div>
      )}
    </div>
  );
}
