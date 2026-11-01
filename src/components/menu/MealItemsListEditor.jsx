import React, { useState } from 'react';
import {
  Plus,
  X,
  Edit2,
  Check,
  ChevronLeft,
  ChevronRight,
  ListPlus,
  Sparkles,
  AlignLeft,
  Trash2,
} from 'lucide-react';
import { useFeedback } from '../../utils/useFeedback';

// Curated traditional Dars accompaniments & sides by meal slot
const ACCOMPANIMENTS = {
  breakfast: [
    'Hot Tea',
    'Cardamom Tea',
    'Black Tea',
    'Coconut Chutney',
    'Tomato Chutney',
    'Vegetable Sambar',
    'Pappadam',
  ],
  lunch: [
    'Matta Rice',
    'Sambar',
    'Vegetable Aviyal',
    'Thoran',
    'Pappadam',
    'Kerala Pickle',
    'Moru (Buttermilk)',
    'Salad',
    'Raita',
    'Payasam',
  ],
  evening: [
    'Sulaimani',
    'Hot Milk Tea',
    'Cardamom Black Tea',
    'Parippuvada',
    'Samosa',
    'Pazhampori',
    'Cutlet',
  ],
  dinner: [
    'Steamed Rice',
    'Puzhukal Kanji',
    'Payar Thoran',
    'Pappadam',
    'Chammanthi',
    'Fish Curry',
    'Morukari',
    'Black Tea',
  ],
};

export default function MealItemsListEditor({
  items = [],
  onChange,
  slotKey = 'breakfast',
  className = '',
}) {
  const { feedback } = useFeedback();

  // State for adding a new item
  const [inputValue, setInputValue] = useState('');

  // State for inline editing of an existing item
  const [editingIdx, setEditingIdx] = useState(null);
  const [editingText, setEditingText] = useState('');

  // Mode: 'chips' vs 'bulk' (textarea)
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [bulkText, setBulkText] = useState('');

  // Ensure items is always an array
  const safeItems = Array.isArray(items) ? items : [];

  // Add one or multiple comma-separated items
  const handleAddItemsFromText = (rawText) => {
    if (!rawText || !rawText.trim()) return;
    const splitItems = rawText
      .split(/[,;\n]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (splitItems.length === 0) return;

    feedback('pop');
    const merged = [...safeItems];
    splitItems.forEach((it) => {
      if (!merged.includes(it)) {
        merged.push(it);
      }
    });

    onChange(merged);
    setInputValue('');
  };

  // Remove single item
  const handleRemoveItem = (index) => {
    feedback('trash');
    const updated = safeItems.filter((_, idx) => idx !== index);
    onChange(updated);
  };

  // Reorder item (left or right)
  const handleMove = (index, direction) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= safeItems.length) return;
    feedback('tick');
    const updated = [...safeItems];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIdx, 0, moved);
    onChange(updated);
  };

  // Start inline editing
  const handleStartEdit = (index, currentVal) => {
    feedback('tick');
    setEditingIdx(index);
    setEditingText(currentVal);
  };

  // Save inline edit
  const handleSaveEdit = () => {
    if (editingIdx === null) return;
    const trimmed = editingText.trim();
    if (trimmed) {
      feedback('pop');
      const updated = [...safeItems];
      updated[editingIdx] = trimmed;
      onChange(updated);
    }
    setEditingIdx(null);
    setEditingText('');
  };

  // Toggle Bulk Text Mode
  const handleToggleBulkMode = () => {
    feedback('tick');
    if (!isBulkMode) {
      setBulkText(safeItems.join('\n'));
      setIsBulkMode(true);
    } else {
      // Save from bulk text
      const lines = bulkText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);
      onChange(lines);
      setIsBulkMode(false);
    }
  };

  // 1-Click add common accompaniment
  const handleAddAccompaniment = (chipText) => {
    if (safeItems.includes(chipText)) return;
    feedback('pop');
    onChange([...safeItems, chipText]);
  };

  const accompanimentList = ACCOMPANIMENTS[slotKey] || ACCOMPANIMENTS.lunch;

  return (
    <div className={`space-y-2.5 ${className}`}>
      {/* Header Bar: Label + Controls (Bulk Toggle, Clear) */}
      <div className="flex items-center justify-between gap-2">
        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
          <ListPlus className="w-3 h-3 text-purple-500" />
          <span>Dishes & Accompaniments ({safeItems.length})</span>
        </label>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleToggleBulkMode}
            className="px-2 py-0.5 rounded-lg text-[10px] font-bold text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 border border-purple-200 dark:border-purple-800/40 transition-colors flex items-center gap-1"
            title="Toggle between Visual Chips and Bulk Text Editor"
          >
            <AlignLeft className="w-2.5 h-2.5" />
            <span>{isBulkMode ? 'Done (Chips)' : 'Bulk Edit'}</span>
          </button>

          {safeItems.length > 0 && (
            <button
              type="button"
              onClick={() => {
                feedback('trash');
                onChange([]);
              }}
              className="p-1 rounded-lg text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
              title="Clear all items"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Bulk Textarea Mode */}
      {isBulkMode ? (
        <div className="space-y-1.5">
          <textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            rows={4}
            placeholder="Type or paste dishes (one per line, e.g. Matta Rice&#10;Beef Roast&#10;Sambar&#10;Pickle)"
            className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-purple-300 dark:border-purple-800 bg-white dark:bg-[#121c19] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
          />
          <p className="text-[10px] text-gray-400">
            One dish or accompaniment per line. Click &quot;Done (Chips)&quot; above to commit.
          </p>
        </div>
      ) : (
        /* Visual Chips Mode */
        <div className="space-y-2">
          {/* Active Chips Container */}
          <div className="flex flex-wrap items-center gap-1.5 min-h-[38px] p-2 rounded-2xl bg-gray-50/70 dark:bg-black/25 border border-gray-200/80 dark:border-white/10">
            {safeItems.map((item, idx) => {
              const isEditingThis = editingIdx === idx;

              if (isEditingThis) {
                return (
                  <div
                    key={idx}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-900 dark:text-purple-200 border border-purple-400 text-xs shadow-sm"
                  >
                    <input
                      type="text"
                      autoFocus
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSaveEdit();
                        } else if (e.key === 'Escape') {
                          setEditingIdx(null);
                        }
                      }}
                      className="px-1 py-0.5 bg-transparent border-b border-purple-500 text-xs font-bold text-gray-900 dark:text-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleSaveEdit}
                      className="p-0.5 text-emerald-600 hover:text-emerald-700"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingIdx(null)}
                      className="p-0.5 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              }

              return (
                <div
                  key={idx}
                  className="group inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white dark:bg-[#15201c] text-gray-800 dark:text-gray-200 text-xs font-semibold border border-gray-200/80 dark:border-white/10 shadow-xs hover:border-purple-300 dark:hover:border-purple-700 transition-all"
                >
                  {/* Move Left */}
                  {idx > 0 && (
                    <button
                      type="button"
                      onClick={() => handleMove(idx, -1)}
                      className="opacity-0 group-hover:opacity-100 -ml-1 text-gray-400 hover:text-purple-600 transition-opacity"
                      title="Move left"
                    >
                      <ChevronLeft className="w-3 h-3" />
                    </button>
                  )}

                  {/* Item Text (Click to inline edit) */}
                  <span
                    onClick={() => handleStartEdit(idx, item)}
                    className="cursor-pointer hover:text-purple-600 dark:hover:text-purple-400 select-none"
                    title="Click to edit name"
                  >
                    {item}
                  </span>

                  {/* Edit icon */}
                  <button
                    type="button"
                    onClick={() => handleStartEdit(idx, item)}
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-purple-600 transition-opacity"
                    title="Edit item name"
                  >
                    <Edit2 className="w-2.5 h-2.5" />
                  </button>

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    className="text-gray-400 hover:text-rose-500 transition-colors ml-0.5"
                    title="Remove item"
                  >
                    <X className="w-3 h-3" />
                  </button>

                  {/* Move Right */}
                  {idx < safeItems.length - 1 && (
                    <button
                      type="button"
                      onClick={() => handleMove(idx, 1)}
                      className="opacity-0 group-hover:opacity-100 -mr-1 text-gray-400 hover:text-purple-600 transition-opacity"
                      title="Move right"
                    >
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}

            {/* Smart Add Input (splits commas automatically) */}
            <div className="flex items-center gap-1 flex-1 min-w-[150px]">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddItemsFromText(inputValue);
                  } else if (e.key === ',' || e.key === ';') {
                    e.preventDefault();
                    handleAddItemsFromText(inputValue);
                  }
                }}
                onBlur={() => {
                  if (inputValue.trim()) {
                    handleAddItemsFromText(inputValue);
                  }
                }}
                placeholder="+ add item or paste comma-separated..."
                className="w-full px-2 py-0.5 text-xs bg-transparent focus:outline-none text-gray-900 dark:text-white placeholder-gray-400"
              />
              {inputValue.trim() && (
                <button
                  type="button"
                  onClick={() => handleAddItemsFromText(inputValue)}
                  className="p-1 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors shrink-0"
                  title="Add dish"
                >
                  <Plus className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Quick Accompaniment Chips Bar */}
          <div className="flex items-center gap-1 flex-wrap pt-0.5">
            <span className="text-[10px] font-bold text-gray-400 flex items-center gap-0.5">
              <Sparkles className="w-2.5 h-2.5 text-amber-500" />
              <span>Quick Sides:</span>
            </span>
            {accompanimentList.map((side) => {
              const alreadyAdded = safeItems.includes(side);
              return (
                <button
                  key={side}
                  type="button"
                  disabled={alreadyAdded}
                  onClick={() => handleAddAccompaniment(side)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-medium transition-all ${
                    alreadyAdded
                      ? 'bg-gray-100 dark:bg-white/5 text-gray-400 opacity-50 cursor-not-allowed'
                      : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 cursor-pointer'
                  }`}
                  title={alreadyAdded ? 'Already included' : `Add ${side}`}
                >
                  + {side}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
