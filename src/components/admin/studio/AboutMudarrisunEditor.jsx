import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  Upload,
  Link as LinkIcon,
  BookOpen,
  GraduationCap,
  Award,
  X,
  Save,
  CheckCircle2,
} from 'lucide-react';
import { useLanguage } from '../../../store/LanguageContext';
import { useFeedback } from '../../../utils/useFeedback';
import { dialog } from '../../../utils/dialog';
import {
  saveMudarris,
  deleteMudarris,
  reorderMudarrisun,
  processMemberImage,
} from '../../../utils/aboutService';

export default function AboutMudarrisunEditor({ facultyList = [], actor }) {
  const { lang } = useLanguage();
  const { feedback } = useFeedback();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingScholar, setEditingScholar] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form states for Modal
  const [formData, setFormData] = useState({
    nameEn: '',
    nameMl: '',
    designationEn: '',
    designationMl: '',
    role: 'mudarris', // 'chief_mudarris' | 'senior_mudarris' | 'mudarris'
    photoURL: '',
    kitabsTaught: [],
    bioEn: '',
    bioMl: '',
    quoteEn: '',
    quoteMl: '',
    order: facultyList.length + 1,
    active: true,
  });

  const [newKitabInput, setNewKitabInput] = useState('');
  const [imageInputMode, setImageInputMode] = useState('url'); // 'url' | 'upload'
  const [uploadingImage, setUploadingImage] = useState(false);

  const openAddModal = () => {
    feedback('tick');
    setEditingScholar(null);
    setFormData({
      nameEn: '',
      nameMl: '',
      designationEn: '',
      designationMl: '',
      role: 'mudarris',
      photoURL: '',
      kitabsTaught: [],
      bioEn: '',
      bioMl: '',
      quoteEn: '',
      quoteMl: '',
      order: facultyList.length + 1,
      active: true,
    });
    setImageInputMode('url');
    setIsModalOpen(true);
  };

  const openEditModal = (scholar) => {
    feedback('tick');
    setEditingScholar(scholar);
    setFormData({
      id: scholar.id,
      nameEn: scholar.nameEn || '',
      nameMl: scholar.nameMl || '',
      designationEn: scholar.designationEn || '',
      designationMl: scholar.designationMl || '',
      role: scholar.role || (scholar.isChief ? 'chief_mudarris' : 'mudarris'),
      photoURL: scholar.photoURL || '',
      kitabsTaught: scholar.kitabsTaught || [],
      bioEn: scholar.bioEn || '',
      bioMl: scholar.bioMl || '',
      quoteEn: scholar.quoteEn || '',
      quoteMl: scholar.quoteMl || '',
      order: scholar.order || 1,
      active: scholar.active !== false,
    });
    setImageInputMode('url');
    setIsModalOpen(true);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      feedback('pop');
      const optimizedDataUrl = await processMemberImage(file);
      setFormData((prev) => ({ ...prev, photoURL: optimizedDataUrl }));
      dialog.toast.success('Photo Optimized', 'Profile photo cropped and compressed successfully.');
    } catch (err) {
      dialog.toast.error('Image Error', err.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAddKitab = () => {
    if (!newKitabInput.trim()) return;
    feedback('tick');
    setFormData((prev) => ({
      ...prev,
      kitabsTaught: [...prev.kitabsTaught, newKitabInput.trim()],
    }));
    setNewKitabInput('');
  };

  const handleRemoveKitab = (kIndex) => {
    feedback('tick');
    setFormData((prev) => ({
      ...prev,
      kitabsTaught: prev.kitabsTaught.filter((_, idx) => idx !== kIndex),
    }));
  };

  const handleSaveScholar = async (e) => {
    e.preventDefault();
    if (!formData.nameEn && !formData.nameMl) {
      dialog.toast.warning('Name Required', 'Please enter at least an English or Malayalam name.');
      return;
    }

    try {
      setSaving(true);
      feedback('pop');
      await saveMudarris(formData, actor);
      dialog.toast.success(
        editingScholar ? 'Faculty Updated' : 'Faculty Added',
        `${formData.nameEn || formData.nameMl} has been saved.`
      );
      setIsModalOpen(false);
    } catch (err) {
      dialog.toast.error('Error Saving Faculty', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteScholar = async (scholar) => {
    const confirmed = await dialog.confirm({
      title: lang === 'ml' ? 'മുദരിസിനെ നീക്കം ചെയ്യണോ?' : 'Delete Faculty Member?',
      message: `Are you sure you want to delete ${scholar.nameEn || scholar.nameMl}? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger',
    });

    if (confirmed) {
      try {
        feedback('pop');
        await deleteMudarris(scholar.id, scholar.nameEn || scholar.nameMl, actor);
        dialog.toast.success('Deleted', 'Faculty member removed.');
      } catch (err) {
        dialog.toast.error('Delete Error', err.message);
      }
    }
  };

  const handleMove = async (index, direction) => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= facultyList.length) return;

    feedback('tick');
    const newList = [...facultyList];
    const temp = newList[index];
    newList[index] = newList[targetIndex];
    newList[targetIndex] = temp;

    try {
      await reorderMudarrisun(newList, actor);
    } catch (err) {
      dialog.toast.error('Reorder Error', err.message);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-[#0c1512] border border-gray-200 dark:border-emerald-500/20 shadow-sm">
        <div className="space-y-0.5">
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
            {lang === 'ml' ? 'മുദരിസുമാരുടെ പട്ടിക (Mudarrisun)' : 'Mudarrisun Faculty Directory'}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {lang === 'ml'
              ? 'മുദരിസുമാരെ ചേർക്കുക, ഫോട്ടോ മാറ്റുക, ക്രമം മാറ്റുക'
              : 'Manage Islamic faculty, photos, designations, kitabs taught, and bios.'}
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>{lang === 'ml' ? 'മുദരിസിനെ ചേർക്കുക' : 'Add Faculty Member'}</span>
        </button>
      </div>

      {/* Faculty List Table / Cards */}
      <div className="space-y-3">
        {facultyList.map((scholar, idx) => {
          const isChief = scholar.role === 'chief_mudarris' || scholar.isChief;
          return (
            <div
              key={scholar.id || idx}
              className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                isChief
                  ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-300 dark:border-amber-500/30'
                  : 'bg-white dark:bg-[#0c1512] border-gray-200 dark:border-emerald-500/20'
              }`}
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-xl overflow-hidden border border-emerald-500/30 flex-shrink-0">
                  <img
                    src={scholar.photoURL || 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=150&q=80'}
                    alt={scholar.nameEn}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-gray-900 dark:text-gray-100 truncate">
                      {scholar.nameEn || scholar.nameMl}
                    </span>
                    {isChief && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase">
                        Chief Mudarris
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 truncate">
                    {scholar.designationEn || scholar.designationMl}
                  </div>
                  {scholar.kitabsTaught && (
                    <div className="text-[11px] text-gray-500 truncate">
                      {scholar.kitabsTaught.join(' • ')}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions & Reordering */}
              <div className="flex items-center gap-1.5 self-end sm:self-center">
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => handleMove(idx, 'up')}
                  className="p-1.5 rounded-lg bg-gray-100 dark:bg-white/5 hover:bg-gray-200 text-gray-600 dark:text-gray-300 disabled:opacity-30"
                  title="Move Up"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={idx === facultyList.length - 1}
                  onClick={() => handleMove(idx, 'down')}
                  className="p-1.5 rounded-lg bg-gray-100 dark:bg-white/5 hover:bg-gray-200 text-gray-600 dark:text-gray-300 disabled:opacity-30"
                  title="Move Down"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => openEditModal(scholar)}
                  className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-600 dark:text-emerald-400"
                  title="Edit Scholar"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteScholar(scholar)}
                  className="p-1.5 rounded-lg bg-red-50 dark:bg-red-950/40 hover:bg-red-100 text-red-600 dark:text-red-400"
                  title="Delete Scholar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Faculty Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xl bg-white dark:bg-[#0c1512] rounded-3xl p-6 shadow-2xl border border-gray-200 dark:border-emerald-500/30 space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-white/5">
                <h3 className="text-base font-black text-gray-900 dark:text-gray-100">
                  {editingScholar ? 'Edit Mudarris Profile' : 'Add New Mudarris'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveScholar} className="space-y-4">
                {/* Names */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                      Name (English) *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.nameEn}
                      onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                      placeholder="e.g. Al-Usthad Ahmad"
                      className="w-full px-3 py-2 text-xs rounded-xl bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                      Name (Malayalam)
                    </label>
                    <input
                      type="text"
                      value={formData.nameMl}
                      onChange={(e) => setFormData({ ...formData, nameMl: e.target.value })}
                      placeholder="e.g. അൽ-ഉസ്താദ് അഹ്മദ്"
                      className="w-full px-3 py-2 text-xs rounded-xl bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10"
                    />
                  </div>
                </div>

                {/* Designation & Role */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                      Designation (English)
                    </label>
                    <input
                      type="text"
                      value={formData.designationEn}
                      onChange={(e) =>
                        setFormData({ ...formData, designationEn: e.target.value })
                      }
                      placeholder="Senior Lecturer in Hadith"
                      className="w-full px-3 py-2 text-xs rounded-xl bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                      Role / Honor Status
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10"
                    >
                      <option value="chief_mudarris">Chief Mudarris (സദ്റുൽ മുദരിസീൻ)</option>
                      <option value="senior_mudarris">Senior Mudarris (സീനിയർ മുദരിസ്)</option>
                      <option value="mudarris">Mudarris (മുദരിസ്)</option>
                    </select>
                  </div>
                </div>

                {/* Photo Handling: Direct URL vs Upload File */}
                <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                      Profile Photo (URL or Upload)
                    </label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setImageInputMode('url')}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          imageInputMode === 'url' ? 'bg-emerald-600 text-white' : 'text-gray-500'
                        }`}
                      >
                        URL
                      </button>
                      <button
                        type="button"
                        onClick={() => setImageInputMode('upload')}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          imageInputMode === 'upload'
                            ? 'bg-emerald-600 text-white'
                            : 'text-gray-500'
                        }`}
                      >
                        Upload Local File
                      </button>
                    </div>
                  </div>

                  {imageInputMode === 'url' ? (
                    <input
                      type="url"
                      value={formData.photoURL}
                      onChange={(e) => setFormData({ ...formData, photoURL: e.target.value })}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10"
                    />
                  ) : (
                    <div className="space-y-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="text-xs text-gray-600 dark:text-gray-300 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-600 file:text-white hover:file:bg-emerald-500 cursor-pointer"
                      />
                      {uploadingImage && (
                        <div className="text-[11px] text-emerald-600">Compressing & optimizing image...</div>
                      )}
                    </div>
                  )}

                  {formData.photoURL && (
                    <div className="flex items-center gap-2 pt-1">
                      <img
                        src={formData.photoURL}
                        alt="Preview"
                        className="w-10 h-10 rounded-xl object-cover border"
                      />
                      <span className="text-[11px] text-gray-500 truncate max-w-xs">
                        {formData.photoURL.startsWith('data:') ? 'Optimized Local Image (<45KB)' : formData.photoURL}
                      </span>
                    </div>
                  )}
                </div>

                {/* Kitabs Taught Tags Manager */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    Kitabs Taught (Classical Texts)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newKitabInput}
                      onChange={(e) => setNewKitabInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddKitab();
                        }
                      }}
                      placeholder="e.g. Sahih al-Bukhari, Fathul Mueen"
                      className="flex-1 px-3 py-2 text-xs rounded-xl bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10"
                    />
                    <button
                      type="button"
                      onClick={handleAddKitab}
                      className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                    >
                      Add
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {formData.kitabsTaught.map((kitab, kIdx) => (
                      <span
                        key={kIdx}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-semibold border border-emerald-200 dark:border-emerald-500/20"
                      >
                        <span>{kitab}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveKitab(kIdx)}
                          className="text-emerald-500 hover:text-emerald-800"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Scholarly Quote */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    Scholarly Blessing / Quote
                  </label>
                  <input
                    type="text"
                    value={formData.quoteEn}
                    onChange={(e) => setFormData({ ...formData, quoteEn: e.target.value })}
                    placeholder="“Knowledge is divine light...”"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10"
                  />
                </div>

                {/* Bio */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    Scholarly Biography (English)
                  </label>
                  <textarea
                    rows={3}
                    value={formData.bioEn}
                    onChange={(e) => setFormData({ ...formData, bioEn: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10"
                  />
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-white/5">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Mudarris'}
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

