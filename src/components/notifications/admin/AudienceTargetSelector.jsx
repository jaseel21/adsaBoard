import React, { useState, useEffect } from 'react';
import { Users, User, Shield, ChefHat, Check, Globe, Tag } from 'lucide-react';
import firebase from '../../../firebase/config';

export default function AudienceTargetSelector({ value, onChange }) {
  const [batches, setBatches] = useState([]);

  // Fetch unique batches from students collection
  useEffect(() => {
    let isMounted = true;
    firebase
      .firestore()
      .collection('students')
      .get()
      .then((snap) => {
        if (!isMounted) return;
        const set = new Set();
        snap.docs.forEach((doc) => {
          const b = doc.data().batch;
          if (b && String(b).trim()) set.add(String(b).trim());
        });
        const list = Array.from(set).sort();
        setBatches(list.length > 0 ? list : ['2024-2026', '2023-2025', '2022-2024']);
      })
      .catch(() => {
        if (isMounted) setBatches(['2024-2026', '2023-2025', '2022-2024']);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const targetType = value?.type || 'all';
  const selectedBatches = value?.batches || [];
  const tokenRange = value?.tokensInput || '';

  const handleTypeChange = (type) => {
    onChange({
      ...value,
      type,
    });
  };

  const toggleBatch = (batchName) => {
    const next = selectedBatches.includes(batchName)
      ? selectedBatches.filter((b) => b !== batchName)
      : [...selectedBatches, batchName];

    onChange({
      ...value,
      type: 'batches',
      batches: next,
    });
  };

  const handleTokensChange = (e) => {
    const raw = e.target.value;
    // Parse comma or space separated numbers
    const tokens = raw
      .split(/[\s,]+/)
      .map((t) => t.trim())
      .filter(Boolean);

    onChange({
      ...value,
      type: 'tokens',
      tokensInput: raw,
      tokens,
    });
  };

  const audienceTypes = [
    { id: 'all', label: 'All Campus & Public', icon: Globe, desc: 'Public visitors, students & staff' },
    { id: 'students', label: 'All Registered Students', icon: Users, desc: 'All token holders' },
    { id: 'batches', label: 'Academic Batches', icon: Tag, desc: 'Specific class cohorts' },
    { id: 'tokens', label: 'Individual Tokens', icon: User, desc: 'Specific token numbers' },
    { id: 'staff', label: 'Kitchen & Cooks', icon: ChefHat, desc: 'Dispatched to Kitchen KDS' },
    { id: 'committee', label: 'Committee Officers', icon: Shield, desc: 'Internal committee memo' },
  ];

  return (
    <div className="space-y-3">
      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
        Target Audience Segment
      </label>

      {/* Target Type Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {audienceTypes.map((type) => {
          const Icon = type.icon;
          const isSelected = targetType === type.id;

          return (
            <button
              key={type.id}
              type="button"
              onClick={() => handleTypeChange(type.id)}
              className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                isSelected
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-800 dark:text-emerald-300 shadow-sm'
                  : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <Icon
                  className={`w-4 h-4 ${
                    isSelected ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'
                  }`}
                />
                {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
              </div>
              <div className="mt-2">
                <div className="text-xs font-bold tracking-tight">{type.label}</div>
                <div className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight mt-0.5">
                  {type.desc}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Conditional Batch Chips Picker */}
      {targetType === 'batches' && (
        <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200/80 dark:border-white/10 space-y-2">
          <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300 block">
            Select Targeted Batches ({selectedBatches.length} selected):
          </span>
          <div className="flex flex-wrap gap-1.5">
            {batches.map((b) => {
              const active = selectedBatches.includes(b);
              return (
                <button
                  key={b}
                  type="button"
                  onClick={() => toggleBatch(b)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    active
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-white dark:bg-black/30 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-100'
                  }`}
                >
                  {active && <Check className="w-3 h-3" />}
                  <span>{b}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Conditional Token Input */}
      {targetType === 'tokens' && (
        <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200/80 dark:border-white/10 space-y-2">
          <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 block">
            Token Numbers (comma or space separated):
          </label>
          <input
            type="text"
            value={tokenRange}
            onChange={handleTokensChange}
            placeholder="e.g. 101, 102, 105, 142"
            className="w-full px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-black/30 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      )}
    </div>
  );
}
