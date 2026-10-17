import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  User,
  Hash,
  Eye,
  EyeOff,
  Copy,
  Check,
  Sparkles,
  Utensils,
  Coffee,
  ShieldAlert,
  ShieldCheck,
  Save,
  Trash2,
  Layers,
  Phone,
  Home,
  RefreshCw
} from 'lucide-react';
import Swal from 'sweetalert2';
import firebase from '../firebase/config';
import { useLanguage } from '../store/LanguageContext';
import { useFeedback } from '../utils/useFeedback';

const defaultMealDays = {
  su: true,
  mo: true,
  tu: true,
  we: true,
  th: true,
  fr: true,
  sa: true
};

const defaultDietary = {
  beef: true,
  chicken: true,
  fish: true,
  mutton: true
};

const commonMalayalamPrefixes = ['മുഹമ്മദ്', 'അഹ്മദ്', 'അലി', 'ഉമർ', 'ഉസ്മാൻ', 'റഷീദ്', 'ഹാശിം', 'ബിലാൽ'];

export default function StudentDrawer({
  isOpen,
  onClose,
  student,
  existingTokens = [],
  existingBatches = [],
  onSaved,
  onDeleted
}) {
  const { t, lang } = useLanguage();
  const { feedback } = useFeedback();

  const isEdit = Boolean(student && student.id);

  const [tokenNo, setTokenNo] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [nameMl, setNameMl] = useState('');
  const [uname, setUname] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [batch, setBatch] = useState('');
  const [roomNo, setRoomNo] = useState('');
  const [phone, setPhone] = useState('');
  const [block, setBlock] = useState(false);
  const [blockReason, setBlockReason] = useState('');

  const [lunch, setLunch] = useState(defaultMealDays);
  const [breakfast, setBreakfast] = useState(defaultMealDays);
  const [dietary, setDietary] = useState(defaultDietary);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'meals' | 'status'

  // Reset or Populate form on student prop change
  useEffect(() => {
    if (student) {
      setTokenNo(student.tokenNo !== undefined ? String(student.tokenNo) : '');
      setNameEn(student.nameEn || student.uname || '');
      setNameMl(student.nameMl || '');
      setUname(student.uname || '');
      setPassword(student.password || '');
      setBatch(student.batch || 'General');
      setRoomNo(student.roomNo || '');
      setPhone(student.phone || '');
      setBlock(Boolean(student.block));
      setBlockReason(student.blockReason || '');

      setLunch(student.obj?.lunch ? { ...defaultMealDays, ...student.obj.lunch } : defaultMealDays);
      setBreakfast(student.obj?.breakfast ? { ...defaultMealDays, ...student.obj.breakfast } : defaultMealDays);
      setDietary(student.obj2 ? { ...defaultDietary, ...student.obj2 } : defaultDietary);
    } else {
      // Create Mode
      setTokenNo('');
      setNameEn('');
      setNameMl('');
      setUname('');
      setPassword('');
      setBatch(existingBatches[0] || 'Batch 2024');
      setRoomNo('');
      setPhone('');
      setBlock(false);
      setBlockReason('');
      setLunch(defaultMealDays);
      setBreakfast(defaultMealDays);
      setDietary(defaultDietary);
    }
    setActiveTab('profile');
  }, [student, isOpen, existingBatches]);

  // Auto-fill username when nameEn changes in create mode
  const handleNameEnChange = (val) => {
    setNameEn(val);
    if (!isEdit && !uname) {
      const generated = val.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
      if (generated) setUname(generated);
    }
  };

  // Find lowest available token number
  const handleAutoAssignToken = () => {
    feedback('tick');
    const sorted = [...existingTokens].map(Number).filter(n => !isNaN(n)).sort((a, b) => a - b);
    let next = 1;
    for (const num of sorted) {
      if (num === next) {
        next++;
      } else if (num > next) {
        break;
      }
    }
    setTokenNo(String(next));
  };

  // Generate strong random password
  const handleGeneratePassword = () => {
    feedback('pop');
    const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
    let res = '';
    for (let i = 0; i < 6; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(res);
  };

  const handleCopyPassword = () => {
    if (!password) return;
    feedback('tick');
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Day toggle helpers
  const toggleLunchDay = (dayKey) => {
    feedback('tick');
    setLunch(prev => ({ ...prev, [dayKey]: !prev[dayKey] }));
  };

  const toggleBreakfastDay = (dayKey) => {
    feedback('tick');
    setBreakfast(prev => ({ ...prev, [dayKey]: !prev[dayKey] }));
  };

  const setAllLunch = (val) => {
    feedback('pop');
    setLunch({ su: val, mo: val, tu: val, we: val, th: val, fr: val, sa: val });
  };

  const setAllBreakfast = (val) => {
    feedback('pop');
    setBreakfast({ su: val, mo: val, tu: val, we: val, th: val, fr: val, sa: val });
  };

  const toggleDiet = (key) => {
    feedback('tick');
    setDietary(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Check token collision
  const tokenNum = parseInt(tokenNo, 10);
  const isDuplicateToken = !isNaN(tokenNum) && existingTokens.some(t => {
    if (isEdit && student && student.tokenNo === tokenNum) return false;
    return t === tokenNum;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!tokenNo || isNaN(tokenNum)) {
      Swal.fire({ icon: 'warning', title: 'Invalid Token', text: 'Please enter a valid numeric token number.' });
      return;
    }
    if (isDuplicateToken) {
      Swal.fire({ icon: 'error', title: 'Duplicate Token', text: `Token #${tokenNum} is already assigned to another student.` });
      return;
    }
    if (!nameEn.trim()) {
      Swal.fire({ icon: 'warning', title: 'Missing Name', text: 'Please enter student full name in English.' });
      return;
    }
    if (!password.trim()) {
      Swal.fire({ icon: 'warning', title: 'Missing Password', text: 'Please provide a login password for the student.' });
      return;
    }

    setSaving(true);
    feedback('tick');

    const payload = {
      tokenNo: tokenNum,
      nameEn: nameEn.trim(),
      nameMl: nameMl.trim(),
      uname: uname.trim() || nameEn.trim().toLowerCase().replace(/[^a-z0-9]/g, '_') || `token${tokenNum}`,
      password: password.trim(),
      batch: batch.trim() || 'General',
      roomNo: roomNo.trim(),
      phone: phone.trim(),
      block: Boolean(block),
      blockReason: block ? blockReason.trim() : '',
      obj: { lunch, breakfast },
      obj2: dietary,
      updatedAt: new Date().toISOString()
    };

    try {
      const db = firebase.firestore();
      if (isEdit) {
        await db.collection('students').doc(student.id).set(payload, { merge: true });
        feedback('success');
        Swal.fire({
          icon: 'success',
          title: t('studentSavedSuccess') || 'Saved Successfully',
          text: `Token #${tokenNum} (${nameEn}) updated.`,
          timer: 1600,
          showConfirmButton: false
        });
        if (onSaved) onSaved({ id: student.id, ...payload });
      } else {
        payload.createdAt = new Date().toISOString();
        const docRef = await db.collection('students').add(payload);
        feedback('success');
        Swal.fire({
          icon: 'success',
          title: 'Student Created',
          text: `Token #${tokenNum} (${nameEn}) added successfully!`,
          timer: 1600,
          showConfirmButton: false
        });
        if (onSaved) onSaved({ id: docRef.id, ...payload });
      }
      onClose();
    } catch (err) {
      console.error('Error saving student:', err);
      feedback('warning');
      Swal.fire({
        icon: 'error',
        title: 'Save Failed',
        text: err.message || 'Could not save student record.'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!student || !student.id) return;
    feedback('warning');
    Swal.fire({
      title: `${t('deleteStudentRecord') || 'Delete'} #${student.tokenNo}?`,
      text: t('confirmDeleteStudent') || `Permanently delete ${student.nameEn || student.uname}? This cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Delete'
    }).then(async (res) => {
      if (res.isConfirmed) {
        setDeleting(true);
        try {
          await firebase.firestore().collection('students').doc(student.id).delete();
          feedback('pop');
          Swal.fire({
            icon: 'success',
            title: t('studentDeletedSuccess') || 'Deleted!',
            timer: 1500,
            showConfirmButton: false
          });
          if (onDeleted) onDeleted(student.id);
          onClose();
        } catch (err) {
          console.error('Delete error:', err);
          Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to delete student.' });
        } finally {
          setDeleting(false);
        }
      }
    });
  };

  const daysList = [
    { key: 'su', label: t('days')?.su || 'Sun' },
    { key: 'mo', label: t('days')?.mo || 'Mon' },
    { key: 'tu', label: t('days')?.tu || 'Tue' },
    { key: 'we', label: t('days')?.we || 'Wed' },
    { key: 'th', label: t('days')?.th || 'Thu' },
    { key: 'fr', label: t('days')?.fr || 'Fri' },
    { key: 'sa', label: t('days')?.sa || 'Sat' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
          />

          {/* Drawer Container */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed inset-y-0 right-0 w-full sm:max-w-xl md:max-w-2xl bg-white dark:bg-[#0c1412] border-l border-gray-200/80 dark:border-white/10 shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* Drawer Header */}
            <div className="p-5 sm:p-6 border-b border-gray-200/80 dark:border-white/10 flex items-center justify-between bg-gradient-to-r from-emerald-500/10 via-transparent to-transparent">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 text-white flex items-center justify-center font-extrabold text-lg shadow-md shadow-emerald-500/20">
                  {tokenNo ? tokenNo : <User className="w-5 h-5" />}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <span>{isEdit ? (nameEn || t('editPreferences')) : (t('addStudentBtn') || 'Add New Student')}</span>
                    {nameMl && <span className="text-xs font-normal text-emerald-600 dark:text-emerald-400">({nameMl})</span>}
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {isEdit ? `Editing Token #${tokenNum || '?'}` : 'Register new student into canteen system'}
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tab navigation */}
            <div className="flex border-b border-gray-200/80 dark:border-white/10 bg-gray-50/70 dark:bg-white/[0.02] px-6">
              <button
                type="button"
                onClick={() => { feedback('tick'); setActiveTab('profile'); }}
                className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
                  activeTab === 'profile'
                    ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                    : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Profile & Identity</span>
              </button>
              <button
                type="button"
                onClick={() => { feedback('tick'); setActiveTab('meals'); }}
                className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
                  activeTab === 'meals'
                    ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                    : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                <Utensils className="w-4 h-4" />
                <span>Meals & Dietary</span>
              </button>
              <button
                type="button"
                onClick={() => { feedback('tick'); setActiveTab('status'); }}
                className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
                  activeTab === 'status'
                    ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                    : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Status & Access</span>
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* TAB 1: PROFILE */}
              {activeTab === 'profile' && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                  {/* Token Number & Auto-assign */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                        <Hash className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{t('tokenNumber') || 'Token Number'} *</span>
                      </label>
                      {!isEdit && (
                        <button
                          type="button"
                          onClick={handleAutoAssignToken}
                          className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>{t('autoAssignToken') || 'Auto-Next Token'}</span>
                        </button>
                      )}
                    </div>
                    <input
                      type="number"
                      required
                      min="1"
                      value={tokenNo}
                      onChange={(e) => setTokenNo(e.target.value)}
                      placeholder="e.g. 15"
                      className={`w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-[#15221e] border text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 ${
                        isDuplicateToken
                          ? 'border-rose-500 focus:ring-rose-500/40 text-rose-500'
                          : 'border-gray-200 dark:border-white/10 focus:ring-emerald-500/40'
                      }`}
                    />
                    {isDuplicateToken && (
                      <p className="mt-1 text-xs text-rose-500 font-medium">
                        ⚠️ Token #{tokenNum} already exists! Please choose another number.
                      </p>
                    )}
                  </div>

                  {/* Bilingual Names */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* English Name */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                        {t('englishNameLabel') || 'Name (English)'} *
                      </label>
                      <input
                        type="text"
                        required
                        value={nameEn}
                        onChange={(e) => handleNameEnChange(e.target.value)}
                        placeholder="e.g. Muhammed Rashad"
                        className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-[#15221e] border border-gray-200 dark:border-white/10 text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                      />
                    </div>

                    {/* Malayalam Name */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                        {t('malayalamNameLabel') || 'Name (Malayalam മലയാളം)'}
                      </label>
                      <input
                        type="text"
                        value={nameMl}
                        onChange={(e) => setNameMl(e.target.value)}
                        placeholder="e.g. മുഹമ്മദ് റഷാദ്"
                        className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-[#15221e] border border-gray-200 dark:border-white/10 text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                      />
                    </div>
                  </div>

                  {/* Malayalam quick helper chips */}
                  <div className="p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-500/20">
                    <p className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 mb-1.5 flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3" />
                      <span>Malayalam Quick Insert:</span>
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {commonMalayalamPrefixes.map((word) => (
                        <button
                          key={word}
                          type="button"
                          onClick={() => {
                            feedback('tick');
                            setNameMl(prev => prev ? `${prev} ${word}` : word);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-white dark:bg-white/10 hover:bg-emerald-500 hover:text-white text-emerald-900 dark:text-emerald-200 text-xs font-medium border border-emerald-300/40 dark:border-white/5 transition-all"
                        >
                          +{word}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Username & Password */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Username */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                        {t('usernameLabel') || 'Username'}
                      </label>
                      <input
                        type="text"
                        value={uname}
                        onChange={(e) => setUname(e.target.value)}
                        placeholder="e.g. muhammed_12"
                        className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-[#15221e] border border-gray-200 dark:border-white/10 text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                      />
                    </div>

                    {/* Password */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                          {t('passwordLabel') || 'Password'} *
                        </label>
                        <button
                          type="button"
                          onClick={handleGeneratePassword}
                          className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Generate</span>
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-4 pr-20 py-2.5 rounded-xl bg-gray-50 dark:bg-[#15221e] border border-gray-200 dark:border-white/10 text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          <button
                            type="button"
                            onClick={handleCopyPassword}
                            title="Copy Password"
                            className="p-1.5 text-gray-400 hover:text-emerald-500"
                          >
                            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Batch & Contact */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Batch */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{t('batchYearLabel') || 'Batch / Class'}</span>
                      </label>
                      <input
                        type="text"
                        list="batchList"
                        value={batch}
                        onChange={(e) => setBatch(e.target.value)}
                        placeholder="e.g. Batch 2024"
                        className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-[#15221e] border border-gray-200 dark:border-white/10 text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                      />
                      <datalist id="batchList">
                        {existingBatches.map(b => (
                          <option key={b} value={b} />
                        ))}
                      </datalist>
                    </div>

                    {/* Room No */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                        <Home className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{t('roomNoLabel') || 'Room No'}</span>
                      </label>
                      <input
                        type="text"
                        value={roomNo}
                        onChange={(e) => setRoomNo(e.target.value)}
                        placeholder="e.g. B-12"
                        className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-[#15221e] border border-gray-200 dark:border-white/10 text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                      />
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{t('phoneLabel') || 'Phone'}</span>
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g. 9847000000"
                        className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-[#15221e] border border-gray-200 dark:border-white/10 text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TAB 2: MEALS & DIETARY */}
              {activeTab === 'meals' && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  {/* Lunch Schedule */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-gray-50/80 dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                          <Utensils className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-gray-900 dark:text-white">{t('lunchSchedule') || 'Weekly Lunch Schedule'}</h4>
                          <p className="text-[11px] text-gray-500">Green = Opted-in for meal; Red = Skipped</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setAllLunch(true)}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white transition-colors"
                        >
                          All ON
                        </button>
                        <button
                          type="button"
                          onClick={() => setAllLunch(false)}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500 hover:text-white transition-colors"
                        >
                          All OFF
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-7 gap-1 sm:gap-2">
                      {daysList.map((d) => {
                        const active = Boolean(lunch[d.key]);
                        return (
                          <button
                            key={d.key}
                            type="button"
                            onClick={() => toggleLunchDay(d.key)}
                            className={`py-2.5 sm:py-3 px-0.5 rounded-xl font-bold text-[10px] sm:text-xs flex flex-col items-center justify-center gap-1 transition-all min-w-0 ${
                              active
                                ? 'bg-gradient-to-b from-emerald-500 to-green-600 text-white shadow-sm shadow-emerald-500/30'
                                : 'bg-gray-100 dark:bg-white/5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                            }`}
                          >
                            <span className="truncate w-full text-center">{d.label}</span>
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${active ? 'bg-white' : 'bg-rose-400'}`} />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Breakfast Schedule */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-gray-50/80 dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
                          <Coffee className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-gray-900 dark:text-white">{t('breakfastSchedule') || 'Weekly Breakfast Schedule'}</h4>
                          <p className="text-[11px] text-gray-500">Green = Opted-in for meal; Red = Skipped</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setAllBreakfast(true)}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500 hover:text-white transition-colors"
                        >
                          All ON
                        </button>
                        <button
                          type="button"
                          onClick={() => setAllBreakfast(false)}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500 hover:text-white transition-colors"
                        >
                          All OFF
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-7 gap-1 sm:gap-2">
                      {daysList.map((d) => {
                        const active = Boolean(breakfast[d.key]);
                        return (
                          <button
                            key={d.key}
                            type="button"
                            onClick={() => toggleBreakfastDay(d.key)}
                            className={`py-2.5 sm:py-3 px-0.5 rounded-xl font-bold text-[10px] sm:text-xs flex flex-col items-center justify-center gap-1 transition-all min-w-0 ${
                              active
                                ? 'bg-gradient-to-b from-amber-500 to-yellow-600 text-white shadow-sm shadow-amber-500/30'
                                : 'bg-gray-100 dark:bg-white/5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                            }`}
                          >
                            <span className="truncate w-full text-center">{d.label}</span>
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${active ? 'bg-white' : 'bg-rose-400'}`} />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Dietary Preferences (Exemptions) */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-gray-50/80 dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/10 space-y-3">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white">{t('dietaryPreferencesLabel') || 'Dietary Inclusions & Exemptions'}</h4>
                      <p className="text-[11px] text-gray-500">Toggle OFF items this student does NOT eat.</p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { key: 'beef', label: t('beef') || 'Beef' },
                        { key: 'chicken', label: t('chicken') || 'Chicken' },
                        { key: 'fish', label: t('fish') || 'Fish' },
                        { key: 'mutton', label: t('mutton') || 'Mutton' },
                      ].map((item) => {
                        const eats = Boolean(dietary[item.key]);
                        return (
                          <button
                            key={item.key}
                            type="button"
                            onClick={() => toggleDiet(item.key)}
                            className={`p-3 rounded-xl font-bold text-xs flex items-center justify-between transition-all ${
                              eats
                                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-300/50 dark:border-emerald-500/20'
                                : 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border border-rose-300/50 dark:border-rose-500/20'
                            }`}
                          >
                            <span>{item.label}</span>
                            <span className={`w-2 h-2 rounded-full ${eats ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TAB 3: STATUS & ACCESS */}
              {activeTab === 'status' && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                  <div className="p-5 rounded-2xl bg-gray-50/80 dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/10 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <label className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          {block ? <ShieldAlert className="w-4 h-4 text-rose-500" /> : <ShieldCheck className="w-4 h-4 text-emerald-500" />}
                          <span>{t('blockStudentAccount') || 'Block Student Account'}</span>
                        </label>
                        <p className="text-xs text-gray-500">
                          {block
                            ? 'Student token is LOCKED. Meals are suspended & self-service updates disabled.'
                            : 'Student token is ACTIVE and operating normally.'}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => { feedback('tick'); setBlock(!block); }}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                          block ? 'bg-rose-500' : 'bg-emerald-500'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            block ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {block && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="pt-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                          {t('blockReasonLabel') || 'Reason for Blocking'}
                        </label>
                        <textarea
                          rows={2}
                          value={blockReason}
                          onChange={(e) => setBlockReason(e.target.value)}
                          placeholder={t('blockReasonPlaceholder') || 'e.g. Leave of absence, hostel fee pending...'}
                          className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#15221e] border border-gray-200 dark:border-white/10 text-xs font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                        />
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Bottom Actions */}
              <div className="pt-4 border-t border-gray-200/80 dark:border-white/10 flex items-center justify-between gap-3">
                {isEdit ? (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting || saving}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 text-xs font-bold transition-all disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>{deleting ? 'Deleting...' : (t('deleteStudentRecord') || 'Delete')}</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 text-xs font-bold transition-all"
                  >
                    {t('cancel') || 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={saving || isDuplicateToken}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all transform active:scale-95 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saving ? (t('saving') || 'Saving...') : (t('saveStudentRecord') || 'Save Record')}</span>
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
