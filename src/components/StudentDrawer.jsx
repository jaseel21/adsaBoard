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
  CalendarDays,
  LayoutGrid,
  Calendar,
} from 'lucide-react';
import { dialog } from '../utils/dialog';
import firebase from '../firebase/config';
import { useLanguage } from '../store/LanguageContext';
import { useFeedback } from '../utils/useFeedback';
import { subscribeToPreferences } from '../utils/preferenceService';
import { cleanPastDateExceptions } from '../utils/studentExceptionService';
import DateGridMatrix from './ui/DateGridMatrix';

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
  const [availablePreferences, setAvailablePreferences] = useState([]);

  useEffect(() => {
    const unsub = subscribeToPreferences((list) => {
      setAvailablePreferences(list.filter((p) => p.isActive));
    });
    return () => unsub();
  }, []);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'meals' | 'status'

  // Date Exceptions & Templates state for this student
  const [dateExceptions, setDateExceptions] = useState({});
  const [studentTemplates, setStudentTemplates] = useState([]);
  const [showDateGridModal, setShowDateGridModal] = useState(false);

  // Reset or Populate form on student prop change
  useEffect(() => {
    if (student) {
      const malayalamRegex = /[\u0D00-\u0D7F]/;
      const initialNameEn = student.nameEn && !malayalamRegex.test(student.nameEn)
        ? student.nameEn
        : (student.name && !malayalamRegex.test(student.name) ? student.name : '');
      const initialNameMl = student.nameMl && malayalamRegex.test(student.nameMl)
        ? student.nameMl
        : (student.uname && malayalamRegex.test(student.uname) ? student.uname : (student.nameMl || ''));
      const initialUname = (student.username !== undefined && String(student.username))
        || (student.uname !== undefined && !malayalamRegex.test(String(student.uname)) ? String(student.uname) : '')
        || (student.tokenNo !== undefined ? String(student.tokenNo) : '');

      setTokenNo(student.tokenNo !== undefined ? String(student.tokenNo) : '');
      setNameEn(initialNameEn);
      setNameMl(initialNameMl);
      setUname(initialUname);
      setPassword(student.password || '');
      setBatch(student.batch || 'General');
      setRoomNo(student.roomNo || '');
      setPhone(student.phone || '');
      setBlock(Boolean(student.block));
      setBlockReason(student.blockReason || '');

      setLunch(student.obj?.lunch ? { ...defaultMealDays, ...student.obj.lunch } : defaultMealDays);
      setBreakfast(student.obj?.breakfast ? { ...defaultMealDays, ...student.obj.breakfast } : defaultMealDays);
      setDietary(student.obj2 ? { ...defaultDietary, ...student.obj2 } : defaultDietary);
      setDateExceptions(student.dateExceptions ? cleanPastDateExceptions(student.dateExceptions) : {});
      setStudentTemplates(Array.isArray(student.templates) ? student.templates : []);
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
      setDateExceptions({});
      setStudentTemplates([]);
    }
    setActiveTab('profile');
  }, [student, isOpen, existingBatches]);

  const handleTokenChange = (val) => {
    setTokenNo(val);
    if (!isEdit && (!uname || /^\d*$/.test(uname))) {
      setUname(val.trim());
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
    const nextStr = String(next);
    setTokenNo(nextStr);
    if (!uname || /^\d*$/.test(uname)) {
      setUname(nextStr);
    }
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
      dialog.alert({ type: 'warning', title: 'Invalid Token', message: 'Please enter a valid numeric token number.' });
      return;
    }
    if (isDuplicateToken) {
      dialog.alert({ type: 'error', title: 'Duplicate Token', message: `Token #${tokenNum} is already assigned to another student.` });
      return;
    }
    if (!nameEn.trim()) {
      dialog.alert({ type: 'warning', title: 'Missing Name', message: 'Please enter student full name in English.' });
      return;
    }
    if (!password.trim()) {
      dialog.alert({ type: 'warning', title: 'Missing Password', message: 'Please provide a login password for the student.' });
      return;
    }

    setSaving(true);
    feedback('tick');

    const finalUname = uname.trim() || String(tokenNum);
    const payload = {
      tokenNo: tokenNum,
      nameEn: nameEn.trim(),
      nameMl: nameMl.trim(),
      name: nameEn.trim(),
      uname: finalUname,
      username: finalUname,
      password: password.trim(),
      batch: batch.trim() || 'General',
      roomNo: roomNo.trim(),
      phone: phone.trim(),
      block: Boolean(block),
      blockReason: block ? blockReason.trim() : '',
      obj: { lunch, breakfast },
      obj2: dietary,
      dateExceptions: cleanPastDateExceptions(dateExceptions),
      templates: studentTemplates,
      updatedAt: new Date().toISOString()
    };

    try {
      const db = firebase.firestore();
      if (isEdit) {
        await db.collection('students').doc(student.id).set(payload, { merge: true });
        dialog.toast.success(
          t('studentSavedSuccess') || 'Saved Successfully',
          `Token #${tokenNum} (${nameEn}) updated.`
        );
        if (onSaved) onSaved({ id: student.id, ...payload });
      } else {
        payload.createdAt = new Date().toISOString();
        const docRef = await db.collection('students').add(payload);
        dialog.toast.success(
          'Student Created',
          `Token #${tokenNum} (${nameEn}) added successfully!`
        );
        if (onSaved) onSaved({ id: docRef.id, ...payload });
      }
      onClose();
    } catch (err) {
      console.error('Error saving student:', err);
      dialog.alert({
        type: 'error',
        title: 'Save Failed',
        message: err.message || 'Could not save student record.'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!student || !student.id) return;
    const confirmed = await dialog.confirm({
      title: `${t('deleteStudentRecord') || 'Delete'} #${student.tokenNo}?`,
      message: t('confirmDeleteStudent') || `Permanently delete ${student.nameEn || student.name || `Token #${student.tokenNo}`}? This cannot be undone.`,
      icon: 'trash',
      confirmColor: 'rose',
      confirmText: 'Yes, Delete',
      cancelText: 'Cancel',
    });

    if (confirmed) {
      setDeleting(true);
      try {
        await firebase.firestore().collection('students').doc(student.id).delete();
        dialog.toast.success(t('studentDeletedSuccess') || 'Deleted!', `Token #${student.tokenNo} removed.`);
        if (onDeleted) onDeleted(student.id);
        onClose();
      } catch (err) {
        console.error('Delete error:', err);
        dialog.alert({ type: 'error', title: 'Error', message: 'Failed to delete student.' });
      } finally {
        setDeleting(false);
      }
    }
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
            <div className="p-4 sm:p-6 border-b border-gray-200/80 dark:border-white/10 flex items-center justify-between bg-gradient-to-r from-emerald-500/10 via-transparent to-transparent">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 text-white flex items-center justify-center font-extrabold text-base sm:text-lg shadow-md shadow-emerald-500/20 flex-shrink-0">
                  {tokenNo ? tokenNo : <User className="w-5 h-5" />}
                </div>
                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white flex items-center gap-1.5 sm:gap-2 truncate">
                    <span className="truncate">{isEdit ? (nameEn || t('editPreferences')) : (t('addStudentBtn') || 'Add New Student')}</span>
                    {nameMl && <span className="text-xs font-normal text-emerald-600 dark:text-emerald-400 hidden xs:inline">({nameMl})</span>}
                  </h2>
                  <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 truncate">
                    {isEdit ? `Editing Token #${tokenNum || '?'}` : 'Register new student into canteen system'}
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 sm:p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tab navigation */}
            <div className="flex border-b border-gray-200/80 dark:border-white/10 bg-gray-50/70 dark:bg-white/[0.02] px-3 sm:px-6 overflow-x-auto scrollbar-none whitespace-nowrap touch-pan-x">
              <button
                type="button"
                onClick={() => { feedback('tick'); setActiveTab('profile'); }}
                className={`py-2.5 sm:py-3 px-3 sm:px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 sm:gap-2 flex-shrink-0 ${
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
                className={`py-2.5 sm:py-3 px-3 sm:px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 sm:gap-2 flex-shrink-0 ${
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
                className={`py-2.5 sm:py-3 px-3 sm:px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 sm:gap-2 flex-shrink-0 ${
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
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* TAB 1: PROFILE */}
              {activeTab === 'profile' && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 sm:space-y-5">
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
                      onChange={(e) => handleTokenChange(e.target.value)}
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
                        onChange={(e) => setNameEn(e.target.value)}
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
                            title={`${d.label}: Lunch is ${active ? 'ON' : 'OFF'} (Click to toggle)`}
                            className={`py-2.5 sm:py-3 px-0.5 rounded-xl font-bold font-mono text-[10px] sm:text-xs flex flex-col items-center justify-center gap-1 transition-all min-w-0 ${
                              active
                                ? 'bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-sm shadow-emerald-500/25 border border-emerald-400/40 hover:shadow-glow-emerald'
                                : 'bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-sm shadow-rose-500/25 border border-rose-400/40 hover:shadow-glow-red'
                            }`}
                          >
                            <span className="truncate w-full text-center">{d.label}</span>
                            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-white/90" />
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
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white transition-colors"
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
                            title={`${d.label}: Breakfast is ${active ? 'ON' : 'OFF'} (Click to toggle)`}
                            className={`py-2.5 sm:py-3 px-0.5 rounded-xl font-bold font-mono text-[10px] sm:text-xs flex flex-col items-center justify-center gap-1 transition-all min-w-0 ${
                              active
                                ? 'bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-sm shadow-emerald-500/25 border border-emerald-400/40 hover:shadow-glow-emerald'
                                : 'bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-sm shadow-rose-500/25 border border-rose-400/40 hover:shadow-glow-red'
                            }`}
                          >
                            <span className="truncate w-full text-center">{d.label}</span>
                            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-white/90" />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Upcoming Single-Date Overrides & Leaves */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200/80 dark:border-purple-500/20 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0">
                          <CalendarDays className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                            Single-Date Dining Overrides & Leaves
                          </h4>
                          <p className="text-[11px] text-gray-500">
                            {Object.keys(dateExceptions).length > 0
                              ? `${Object.keys(dateExceptions).length} date override(s) scheduled for this student`
                              : 'No date overrides scheduled. Following regular weekly routine.'}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          feedback('tick');
                          setShowDateGridModal(true);
                        }}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs shadow-md shadow-purple-500/20 hover:from-purple-700 hover:to-indigo-700 active:scale-95 transition-all flex items-center gap-2 self-start sm:self-center"
                      >
                        <LayoutGrid className="w-4 h-4" />
                        <span>Manage Date Grid</span>
                      </button>
                    </div>

                    {/* Date Grid Modal for Admin */}
                    {showDateGridModal && (
                      <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md">
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl bg-white dark:bg-[#0f1715] p-5 sm:p-6 space-y-4 border border-gray-200 dark:border-white/10 shadow-2xl backdrop-blur-2xl"
                        >
                          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-white/5">
                            <div>
                              <h3 className="text-base font-black text-gray-900 dark:text-white">
                                Date Overrides — Token #{tokenNo} ({nameEn || 'Student'})
                              </h3>
                              <p className="text-xs text-gray-500">
                                Click any date in the calendar grid to turn breakfast/lunch ON or OFF on behalf of this student.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                feedback('tick');
                                setShowDateGridModal(false);
                              }}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          <DateGridMatrix
                            student={{
                              ...student,
                              tokenNo,
                              nameEn,
                              obj: { lunch, breakfast },
                              dateExceptions,
                              templates: studentTemplates,
                            }}
                            onSaveExceptions={(updated) => setDateExceptions(updated)}
                            onSaveTemplates={(updatedTemplates) => setStudentTemplates(updatedTemplates)}
                            editable={true}
                          />

                          <div className="flex justify-end pt-3 border-t border-gray-100 dark:border-white/5">
                            <button
                              type="button"
                              onClick={() => {
                                feedback('success');
                                setShowDateGridModal(false);
                              }}
                              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 text-white font-extrabold text-xs shadow-md shadow-emerald-500/25"
                            >
                              Done Managing Overrides
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Dietary Preferences (Exemptions) */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-gray-50/80 dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/10 space-y-3">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white">{t('dietaryPreferencesLabel') || 'Dietary Inclusions & Exemptions'}</h4>
                      <p className="text-[11px] text-gray-500">Toggle OFF items this student does NOT eat.</p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {availablePreferences.map((item) => {
                        const eats = dietary[item.id] !== undefined ? Boolean(dietary[item.id]) : true;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => toggleDiet(item.id)}
                            className={`p-3 rounded-xl font-bold text-xs flex items-center justify-between transition-all ${
                              eats
                                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-300/50 dark:border-emerald-500/20'
                                : 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border border-rose-300/50 dark:border-rose-500/20'
                            }`}
                          >
                            <span>{item.labelEn}</span>
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

              </div>

              {/* Bottom Actions Sticky Bar */}
              <div className="p-3.5 sm:p-5 border-t border-gray-200/80 dark:border-white/10 bg-white/95 dark:bg-[#0c1412]/95 backdrop-blur-md pb-safe flex items-center justify-between gap-2.5 sm:gap-3 shrink-0">
                {isEdit ? (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting || saving}
                    className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 text-xs font-bold transition-all disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>{deleting ? 'Deleting...' : (t('deleteStudentRecord') || 'Delete')}</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-gray-300 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 text-xs font-bold transition-all"
                  >
                    {t('cancel') || 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={saving || isDuplicateToken}
                    className="inline-flex items-center gap-1.5 sm:gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all transform active:scale-95 disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
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
