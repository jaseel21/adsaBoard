import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Plus,
  Edit2,
  Trash2,
  Users,
  Utensils,
  Sparkles,
  Save,
  CheckCircle2,
  X,
  Phone,
  MessageCircle,
} from 'lucide-react';
import { useLanguage } from '../../../store/LanguageContext';
import { useFeedback } from '../../../utils/useFeedback';
import { dialog } from '../../../utils/dialog';
import {
  saveTenureCommittees,
  deleteTenure,
  processMemberImage,
} from '../../../utils/aboutService';

export default function AboutTenureEditor({ tenuresList = [], actor }) {
  const { lang } = useLanguage();
  const { feedback } = useFeedback();

  const [selectedTenureId, setSelectedTenureId] = useState(
    tenuresList.find((t) => t.isCurrentTenure)?.id || tenuresList[0]?.id || 'tenure_2025_2026'
  );

  const activeTenure =
    tenuresList.find((t) => t.id === selectedTenureId) ||
    tenuresList[0] || {
      id: 'tenure_2025_2026',
      academicYear: '2025–2026',
      hijriYear: '1446–1447 AH',
      isCurrentTenure: true,
      theme: '',
      centralCommittee: [],
      canteenWing: [],
      subCommittees: [],
    };

  const [subTab, setSubTab] = useState('central'); // 'central' | 'canteen' | 'wings'
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [memberTarget, setMemberTarget] = useState('central'); // 'central' | 'canteen'
  const [editingMember, setEditingMember] = useState(null);

  const [memberForm, setMemberForm] = useState({
    nameEn: '',
    nameMl: '',
    roleEn: '',
    roleMl: '',
    batch: '',
    phone: '',
    photoURL: '',
    portfolioEn: '',
    dutyEn: '',
  });

  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageMode, setImageMode] = useState('url');

  const openAddMember = (target) => {
    feedback('tick');
    setMemberTarget(target);
    setEditingMember(null);
    setMemberForm({
      nameEn: '',
      nameMl: '',
      roleEn: target === 'central' ? 'Executive Member' : 'Canteen Member',
      roleMl: '',
      batch: '',
      phone: '',
      photoURL: '',
      portfolioEn: '',
      dutyEn: '',
    });
    setImageMode('url');
    setMemberModalOpen(true);
  };

  const openEditMember = (target, member) => {
    feedback('tick');
    setMemberTarget(target);
    setEditingMember(member);
    setMemberForm({
      ...member,
    });
    setImageMode('url');
    setMemberModalOpen(true);
  };

  const handleMemberImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      feedback('pop');
      const optimized = await processMemberImage(file);
      setMemberForm((prev) => ({ ...prev, photoURL: optimized }));
      dialog.toast.success('Optimized', 'Photo prepared successfully.');
    } catch (err) {
      dialog.toast.error('Image Error', err.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveMember = async (e) => {
    e.preventDefault();
    if (!memberForm.nameEn && !memberForm.nameMl) {
      dialog.toast.warning('Name Required', 'Please enter a name.');
      return;
    }

    const updatedTenure = { ...activeTenure };

    if (memberTarget === 'central') {
      const list = [...(updatedTenure.centralCommittee || [])];
      if (editingMember) {
        const idx = list.findIndex((m) => m.id === editingMember.id);
        if (idx !== -1) list[idx] = { ...editingMember, ...memberForm };
      } else {
        list.push({
          id: `cc_${Date.now()}`,
          order: list.length + 1,
          ...memberForm,
        });
      }
      updatedTenure.centralCommittee = list;
    } else {
      const list = [...(updatedTenure.canteenWing || [])];
      if (editingMember) {
        const idx = list.findIndex((m) => m.id === editingMember.id);
        if (idx !== -1) list[idx] = { ...editingMember, ...memberForm };
      } else {
        list.push({
          id: `cw_${Date.now()}`,
          order: list.length + 1,
          ...memberForm,
        });
      }
      updatedTenure.canteenWing = list;
    }

    try {
      feedback('pop');
      await saveTenureCommittees(updatedTenure, actor);
      dialog.toast.success('Saved', 'Roster updated successfully.');
      setMemberModalOpen(false);
    } catch (err) {
      dialog.toast.error('Save Error', err.message);
    }
  };

  const handleDeleteMember = async (target, member) => {
    const confirmed = await dialog.confirm({
      title: 'Remove Member?',
      message: `Are you sure you want to remove ${member.nameEn || member.nameMl}?`,
      confirmText: 'Remove',
      cancelText: 'Cancel',
      variant: 'danger',
    });

    if (confirmed) {
      const updatedTenure = { ...activeTenure };
      if (target === 'central') {
        updatedTenure.centralCommittee = (updatedTenure.centralCommittee || []).filter(
          (m) => m.id !== member.id
        );
      } else {
        updatedTenure.canteenWing = (updatedTenure.canteenWing || []).filter(
          (m) => m.id !== member.id
        );
      }
      try {
        await saveTenureCommittees(updatedTenure, actor);
        dialog.toast.success('Removed', 'Member removed from roster.');
      } catch (err) {
        dialog.toast.error('Error', err.message);
      }
    }
  };

  const handleCreateNewTenure = async () => {
    const year = prompt('Enter new Academic Year (e.g. 2026–2027):');
    if (!year || !year.trim()) return;

    const newTenure = {
      id: `tenure_${year.replace(/[^a-zA-Z0-9]/g, '_')}`,
      academicYear: year.trim(),
      hijriYear: '',
      isCurrentTenure: false,
      theme: '',
      centralCommittee: [],
      canteenWing: [],
      subCommittees: [],
    };

    try {
      feedback('pop');
      await saveTenureCommittees(newTenure, actor);
      setSelectedTenureId(newTenure.id);
      dialog.toast.success('Created', `Created tenure for ${year}`);
    } catch (err) {
      dialog.toast.error('Error', err.message);
    }
  };

  const handleToggleCurrentTenure = async () => {
    const updated = {
      ...activeTenure,
      isCurrentTenure: !activeTenure.isCurrentTenure,
    };
    try {
      feedback('tick');
      await saveTenureCommittees(updated, actor);
      dialog.toast.success(
        'Updated',
        `Set ${activeTenure.academicYear} as ${updated.isCurrentTenure ? 'CURRENT' : 'Archived'}.`
      );
    } catch (err) {
      dialog.toast.error('Error', err.message);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Tenure Header & Selector */}
      <div className="p-4 sm:p-6 rounded-3xl bg-white dark:bg-[#0c1512] border border-gray-200 dark:border-emerald-500/20 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
              Academic Tenure & Committee Manager
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Manage executive committees, canteen wings, and functional wings per academic year.
            </p>
          </div>

          <button
            type="button"
            onClick={handleCreateNewTenure}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 text-xs font-bold text-gray-700 dark:text-gray-300"
          >
            <Plus className="w-4 h-4 text-emerald-500" />
            <span>New Academic Year</span>
          </button>
        </div>

        {/* Tenure Switcher Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-gray-100 dark:border-white/5">
          {tenuresList.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                feedback('tick');
                setSelectedTenureId(t.id);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                t.id === selectedTenureId
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400'
              }`}
            >
              <span>{t.academicYear}</span>
              {t.isCurrentTenure && (
                <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 text-[9px] font-black uppercase">
                  Active
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Active Tenure Status Bar */}
        <div className="flex items-center justify-between pt-2 text-xs">
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
            Editing Tenure: {activeTenure.academicYear}
          </span>
          <button
            type="button"
            onClick={handleToggleCurrentTenure}
            className={`px-3 py-1 rounded-xl text-[11px] font-bold border transition-all ${
              activeTenure.isCurrentTenure
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-700 dark:text-amber-300'
                : 'bg-gray-100 dark:bg-white/5 border-gray-300 text-gray-600'
            }`}
          >
            {activeTenure.isCurrentTenure ? '★ Currently Active Tenure' : 'Mark as Active Tenure'}
          </button>
        </div>
      </div>

      {/* Roster Tabs: Central Committee vs Canteen Wing */}
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-white/10 pb-2">
        <button
          type="button"
          onClick={() => {
            feedback('tick');
            setSubTab('central');
          }}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            subTab === 'central'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Central Committee ({activeTenure.centralCommittee?.length || 0})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            feedback('tick');
            setSubTab('canteen');
          }}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            subTab === 'canteen'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'
          }`}
        >
          <Utensils className="w-3.5 h-3.5" />
          <span>Canteen Wing ({activeTenure.canteenWing?.length || 0})</span>
        </button>
      </div>

      {/* Roster List Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
            {subTab === 'central' ? 'Central Committee Roster' : 'Canteen Wing Roster'}
          </h4>
          <button
            type="button"
            onClick={() => openAddMember(subTab)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Member</span>
          </button>
        </div>

        {/* Member cards */}
        <div className="space-y-3">
          {(subTab === 'central'
            ? activeTenure.centralCommittee || []
            : activeTenure.canteenWing || []
          ).map((m, idx) => (
            <div
              key={m.id || idx}
              className="p-3.5 rounded-2xl bg-white dark:bg-[#0c1512] border border-gray-200 dark:border-emerald-500/20 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={m.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                  alt={m.nameEn}
                  className="w-10 h-10 rounded-xl object-cover border"
                />
                <div className="min-w-0">
                  <div className="text-xs font-black text-gray-900 dark:text-gray-100 truncate">
                    {m.nameEn || m.nameMl}
                  </div>
                  <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    {m.roleEn || m.roleMl}
                  </div>
                  {m.phone && <div className="text-[10px] text-gray-400 font-mono">{m.phone}</div>}
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => openEditMember(subTab, m)}
                  className="p-1.5 rounded-lg bg-gray-100 dark:bg-white/5 hover:bg-emerald-50 text-gray-600 dark:text-gray-300"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteMember(subTab, m)}
                  className="p-1.5 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Member Add/Edit Modal */}
      <AnimatePresence>
        {memberModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-white dark:bg-[#0c1512] rounded-3xl p-6 shadow-2xl border border-gray-200 dark:border-emerald-500/30 space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-white/5">
                <h3 className="text-base font-black text-gray-900 dark:text-gray-100">
                  {editingMember ? 'Edit Member' : 'Add Member'} ({memberTarget === 'central' ? 'Central Committee' : 'Canteen Wing'})
                </h3>
                <button
                  type="button"
                  onClick={() => setMemberModalOpen(false)}
                  className="p-1.5 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveMember} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Name (English) *</label>
                    <input
                      type="text"
                      required
                      value={memberForm.nameEn}
                      onChange={(e) => setMemberForm({ ...memberForm, nameEn: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Name (Malayalam)</label>
                    <input
                      type="text"
                      value={memberForm.nameMl}
                      onChange={(e) => setMemberForm({ ...memberForm, nameMl: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Designation / Role *</label>
                    <input
                      type="text"
                      required
                      value={memberForm.roleEn}
                      onChange={(e) => setMemberForm({ ...memberForm, roleEn: e.target.value })}
                      placeholder="President, Secretary..."
                      className="w-full px-3 py-2 text-xs rounded-xl bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Batch</label>
                    <input
                      type="text"
                      value={memberForm.batch}
                      onChange={(e) => setMemberForm({ ...memberForm, batch: e.target.value })}
                      placeholder="Senior Dars (Batch 2021)"
                      className="w-full px-3 py-2 text-xs rounded-xl bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Phone / WhatsApp</label>
                  <input
                    type="tel"
                    value={memberForm.phone}
                    onChange={(e) => setMemberForm({ ...memberForm, phone: e.target.value })}
                    placeholder="9846000000"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10"
                  />
                </div>

                {/* Photo Handling */}
                <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Photo</label>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => setImageMode('url')}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          imageMode === 'url' ? 'bg-emerald-600 text-white' : 'text-gray-500'
                        }`}
                      >
                        URL
                      </button>
                      <button
                        type="button"
                        onClick={() => setImageMode('upload')}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          imageMode === 'upload' ? 'bg-emerald-600 text-white' : 'text-gray-500'
                        }`}
                      >
                        Upload Local
                      </button>
                    </div>
                  </div>

                  {imageMode === 'url' ? (
                    <input
                      type="url"
                      value={memberForm.photoURL}
                      onChange={(e) => setMemberForm({ ...memberForm, photoURL: e.target.value })}
                      placeholder="https://..."
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10"
                    />
                  ) : (
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleMemberImageUpload}
                      className="text-xs file:mr-2 file:py-1 file:px-2.5 file:rounded-xl file:border-0 file:bg-emerald-600 file:text-white"
                    />
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    {memberTarget === 'central' ? 'Portfolio / Responsibilities' : 'Duties'}
                  </label>
                  <textarea
                    rows={2}
                    value={memberTarget === 'central' ? memberForm.portfolioEn : memberForm.dutyEn}
                    onChange={(e) =>
                      setMemberForm({
                        ...memberForm,
                        [memberTarget === 'central' ? 'portfolioEn' : 'dutyEn']: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-white/5">
                  <button
                    type="button"
                    onClick={() => setMemberModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-600 text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md"
                  >
                    Save Member
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

