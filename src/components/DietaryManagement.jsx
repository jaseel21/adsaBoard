import React, { useState, useEffect, useMemo, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UtensilsCrossed,
  Sparkles,
  Users,
  Search,
  Plus,
  Trash2,
  Check,
  X,
  FileDown,
  ArrowLeft,
  Filter,
  CheckSquare,
  Square,
  RefreshCw,
  Edit2,
  Sliders,
  ShieldCheck,
  Info,
  Drumstick,
  Fish,
  Egg,
  Coffee,
  Apple,
  Leaf,
  Utensils,
  Layers,
  Phone,
  DoorClosed,
  Home,
  Clock,
  ArrowRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  History,
} from 'lucide-react';
import firebase from '../firebase/config';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { directPrintPdf, shareDocument, createPdfBlob } from '../utils/documentHubService';
import UniversalDocumentModal from './export/UniversalDocumentModal';
import ExportActionMenu from './export/ExportActionMenu';
import { dialog } from '../utils/dialog';
import { useLanguage } from '../store/LanguageContext';
import { useFeedback } from '../utils/useFeedback';
import { logAuditEvent, AUDIT_CATEGORIES, AUDIT_SEVERITIES } from '../utils/auditLogger';
import { AuthContext } from '../store/AuthContext';
import {
  subscribeAllDietaryRequests,
  approveDietaryChangeRequest,
  rejectDietaryChangeRequest,
  REASON_CATEGORIES,
} from '../utils/dietaryRequestService';
import {
  subscribeToPreferences,
  addPreference,
  updatePreference,
  deletePreference,
} from '../utils/preferenceService';
import { checkActivePrintsForDates } from '../utils/manifestPrintService';
import { getTodayISTDate, addDaysToDate } from '../utils/studentExceptionService';
import CanteenOpsActivityDrawer from './admin/CanteenOpsActivityDrawer';

// Icon mapping helper for dietary categories
const ICON_MAP = {
  Utensils: Utensils,
  UtensilsCrossed: UtensilsCrossed,
  Drumstick: Drumstick,
  Fish: Fish,
  Egg: Egg,
  Apple: Apple,
  Coffee: Coffee,
  Leaf: Leaf,
};

const getCategoryIcon = (iconName, className = 'w-4 h-4') => {
  const IconComp = ICON_MAP[iconName] || Utensils;
  return <IconComp className={className} />;
};

export default function DietaryManagement() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { feedback } = useFeedback();
  const { user, staffProfile, role } = useContext(AuthContext);

  // Primary State
  const [students, setStudents] = useState([]);
  const [preferences, setPreferences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [universalDoc, setUniversalDoc] = useState({ isOpen: false, data: null });

  // Active Main View Tab: 'category' | 'matrix' | 'categories_setup' | 'requests'
  const [activeView, setActiveView] = useState('category');

  // Selected Category ID for category-specific view
  const [selectedCatId, setSelectedCatId] = useState(null);

  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('ALL');

  // Dietary Change Requests State
  const [requestsList, setRequestsList] = useState([]);
  const [requestsStatusFilter, setRequestsStatusFilter] = useState('pending');
  const [requestsSearchQuery, setRequestsSearchQuery] = useState('');
  const [processingRequestId, setProcessingRequestId] = useState(null);

  // Selected Avoider IDs for bulk actions
  const [selectedAvoiderIds, setSelectedAvoiderIds] = useState(new Set());
  const [isCanteenLogOpen, setIsCanteenLogOpen] = useState(false);

  // Add Avoider Modal State
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addModalSearch, setAddModalSearch] = useState('');
  const [addModalBatch, setAddModalBatch] = useState('ALL');
  const [studentsToAdd, setStudentsToAdd] = useState(new Set());
  const [addingSubmitting, setAddingSubmitting] = useState(false);

  // Category Edit / Setup State
  const [showAddCatForm, setShowAddCatForm] = useState(false);
  const [newCatLabelEn, setNewCatLabelEn] = useState('');
  const [newCatLabelMl, setNewCatLabelMl] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('Utensils');
  const [editingCatId, setEditingCatId] = useState(null);
  const [editCatLabelEn, setEditCatLabelEn] = useState('');
  const [editCatLabelMl, setEditCatLabelMl] = useState('');
  const [editCatIcon, setEditCatIcon] = useState('Utensils');
  const [catSubmitting, setCatSubmitting] = useState(false);

  // Real-time Firestore subscriptions
  useEffect(() => {
    setLoading(true);

    const unsubPrefs = subscribeToPreferences((list) => {
      setPreferences(list || []);
      // Default to first active preference if none selected
      setSelectedCatId((current) => {
        if (current && list.some((p) => p.id === current)) return current;
        const firstActive = list.find((p) => p.isActive);
        return firstActive ? firstActive.id : (list[0]?.id || 'beef');
      });
    });

    const unsubStudents = firebase
      .firestore()
      .collection('students')
      .onSnapshot(
        (snapshot) => {
          const docs = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          docs.sort((a, b) => (Number(a.tokenNo) || 0) - (Number(b.tokenNo) || 0));
          setStudents(docs);
          setLoading(false);
          setRefreshing(false);
        },
        (err) => {
          console.error('Error in DietaryManagement students subscription:', err);
          setLoading(false);
          setRefreshing(false);
        }
      );

    const unsubRequests = subscribeAllDietaryRequests(
      (list) => {
        setRequestsList(list || []);
      },
      (err) => {
        console.error('Error in DietaryManagement requests subscription:', err);
      }
    );

    return () => {
      unsubPrefs();
      unsubStudents();
      unsubRequests();
    };
  }, []);

  // Derive unique batches
  const allBatches = useMemo(() => {
    const set = new Set();
    students.forEach((s) => {
      if (s.batch && s.batch.trim()) set.add(s.batch.trim());
    });
    return Array.from(set).sort();
  }, [students]);

  // Active preferences list
  const activePreferences = useMemo(() => {
    return preferences.filter((p) => p.isActive);
  }, [preferences]);

  // Current selected category object
  const currentCategory = useMemo(() => {
    return preferences.find((p) => p.id === selectedCatId) || preferences[0] || null;
  }, [preferences, selectedCatId]);

  // Derived Avoiders map: prefId -> array of student docs who avoid this item
  const avoidersMap = useMemo(() => {
    const map = {};
    preferences.forEach((pref) => {
      map[pref.id] = students.filter(
        (s) => s.obj2 && s.obj2[pref.id] === false
      );
    });
    return map;
  }, [students, preferences]);

  // Students with AT LEAST ONE dietary exemption
  const allExemptStudents = useMemo(() => {
    return students.filter((s) => {
      if (!s.obj2) return false;
      return preferences.some((pref) => s.obj2[pref.id] === false);
    });
  }, [students, preferences]);

  // Filtered avoiders for the currently selected category
  const filteredCategoryAvoiders = useMemo(() => {
    if (!selectedCatId) return [];
    const list = avoidersMap[selectedCatId] || [];

    return list.filter((s) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const tokenStr = String(s.tokenNo || '');
        const nameEn = (s.nameEn || s.name || '').toLowerCase();
        const nameMl = (s.nameMl || '').toLowerCase();
        const batch = (s.batch || '').toLowerCase();
        const matches =
          tokenStr.includes(q) ||
          nameEn.includes(q) ||
          nameMl.includes(q) ||
          batch.includes(q);
        if (!matches) return false;
      }

      // 2. Batch Filter
      if (selectedBatch !== 'ALL') {
        if ((s.batch || 'General') !== selectedBatch) return false;
      }

      return true;
    });
  }, [selectedCatId, avoidersMap, searchQuery, selectedBatch]);

  // Students who currently EAT the selected category (eligible to be added as an avoider)
  const nonAvoidersForCurrentCategory = useMemo(() => {
    if (!selectedCatId) return [];

    return students.filter((s) => {
      // Already an avoider?
      if (s.obj2 && s.obj2[selectedCatId] === false) return false;

      // Search Query
      if (addModalSearch.trim()) {
        const q = addModalSearch.toLowerCase().trim();
        const tokenStr = String(s.tokenNo || '');
        const nameEn = (s.nameEn || s.name || '').toLowerCase();
        const nameMl = (s.nameMl || '').toLowerCase();
        const batch = (s.batch || '').toLowerCase();
        const matches =
          tokenStr.includes(q) ||
          nameEn.includes(q) ||
          nameMl.includes(q) ||
          batch.includes(q);
        if (!matches) return false;
      }

      // Batch Filter
      if (addModalBatch !== 'ALL') {
        if ((s.batch || 'General') !== addModalBatch) return false;
      }

      return true;
    });
  }, [selectedCatId, students, addModalSearch, addModalBatch]);

  // Refresh handler
  const handleRefresh = () => {
    feedback('tick');
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      feedback('success');
    }, 400);
  };

  // Proactive Kitchen Desynchronization Warning (Scenario 2)
  const checkAndWarnIfPrintsInvalidated = async (affectedCount, actionDesc) => {
    try {
      const today = getTodayISTDate();
      const tomorrow = addDaysToDate(today, 1);
      const activePrints = await checkActivePrintsForDates([today, tomorrow]);
      if (activePrints.length > 0) {
        const printLabels = activePrints
          .map((p) => `${p.meal.toUpperCase()} (${p.targetDateIST}) [Rev ${p.revision}]`)
          .join(', ');

        dialog.alert({
          type: 'warning',
          title: 'Kitchen Manifest Desynchronization',
          message: `Dietary changes were saved (${actionDesc}), but physical kitchen sheet(s) have ALREADY been printed for: ${printLabels}.\n\nThe kitchen is currently holding an outdated sheet! Please reprint the manifest from Supply Sections or immediately inform the kitchen staff so special diets are not missed.`,
        });
      }
    } catch (e) {
      console.warn('Error checking print invalidation:', e);
    }
  };

  // ================= CRUD ACTION: REMOVE SINGLE AVOIDER =================
  const handleRemoveAvoider = async (student, categoryId = selectedCatId) => {
    const cat = preferences.find((p) => p.id === categoryId);
    const catName = cat?.labelEn || categoryId;

    feedback('tick');
    const confirmed = await dialog.confirm({
      title: `Include Token #${student.tokenNo}?`,
      message: `Remove from ${catName} avoiders list so ${student.nameEn || student.name || 'this student'} will be included for ${catName}?`,
      confirmText: 'Yes, Include in Meal',
      cancelText: 'Cancel',
      confirmColor: 'emerald',
      icon: 'check',
    });

    if (confirmed) {
      try {
        await firebase
          .firestore()
          .collection('students')
          .doc(student.id)
          .update({
            [`obj2.${categoryId}`]: true,
          });

        feedback('success');
        dialog.toast.success(
          'Avoider Removed',
          `Token #${student.tokenNo} (${student.nameEn || student.name || ''}) will now be served ${catName}.`
        );
        // Warn if kitchen printout already taken
        await checkAndWarnIfPrintsInvalidated(1, `Token #${student.tokenNo} included in ${catName}`);
      } catch (err) {
        console.error('Error removing avoider:', err);
        feedback('warning');
        dialog.alert({
          type: 'error',
          title: 'Update Failed',
          message: err.message || 'Could not update dietary preference.',
        });
      }
    }
  };

  // ================= CRUD ACTION: BULK REMOVE AVOIDERS =================
  const handleBulkRemoveAvoiders = async () => {
    if (selectedAvoiderIds.size === 0 || !selectedCatId) return;

    const count = selectedAvoiderIds.size;
    const catName = currentCategory?.labelEn || 'selected category';

    feedback('tick');
    const confirmed = await dialog.confirm({
      title: `Remove ${count} Students from ${catName} Avoiders?`,
      message: `These ${count} students will be marked as eating ${catName} and will be included in kitchen serving counts.`,
      confirmText: `Include All ${count}`,
      cancelText: 'Cancel',
      confirmColor: 'emerald',
      icon: 'check',
    });

    if (confirmed) {
      try {
        const batch = firebase.firestore().batch();
        selectedAvoiderIds.forEach((stId) => {
          const docRef = firebase.firestore().collection('students').doc(stId);
          batch.update(docRef, {
            [`obj2.${selectedCatId}`]: true,
          });
        });

        await batch.commit();

        await logAuditEvent({
          category: AUDIT_CATEGORIES.DIETARY,
          action: 'AVOIDER_REMOVE',
          severity: AUDIT_SEVERITIES.NOTICE,
          target: { type: 'dietary', id: selectedCatId, label: `${catName} Avoiders` },
          changes: {
            diffSummary: `Removed ${count} student(s) from ${catName} avoiders list`,
            fieldsChanged: [`obj2.${selectedCatId}`],
            before: { count },
            after: { count: 0 },
          },
          metadata: {
            batchCount: count,
            category: selectedCatId,
          },
        });

        setSelectedAvoiderIds(new Set());
        feedback('success');
        dialog.toast.success(
          'Bulk Update Complete',
          `Successfully removed ${count} students from ${catName} avoiders.`
        );
        // Warn if kitchen printout already taken
        await checkAndWarnIfPrintsInvalidated(count, `Removed ${count} students from ${catName} avoiders`);
      } catch (err) {
        console.error('Error in bulk remove avoiders:', err);
        feedback('warning');
        dialog.alert({
          type: 'error',
          title: 'Bulk Update Failed',
          message: err.message || 'Failed to update selected students.',
        });
      }
    }
  };

  // ================= CRUD ACTION: ADD AVOIDERS =================
  const handleAddAvoidersSubmit = async (e) => {
    if (e) e.preventDefault();
    if (studentsToAdd.size === 0 || !selectedCatId) return;

    setAddingSubmitting(true);
    feedback('tick');
    const count = studentsToAdd.size;
    const catName = currentCategory?.labelEn || 'this category';

    try {
      const batch = firebase.firestore().batch();
      studentsToAdd.forEach((stId) => {
        const docRef = firebase.firestore().collection('students').doc(stId);
        batch.update(docRef, {
          [`obj2.${selectedCatId}`]: false,
        });
      });

      await batch.commit();

      await logAuditEvent({
        category: AUDIT_CATEGORIES.DIETARY,
        action: 'AVOIDER_ADD',
        severity: AUDIT_SEVERITIES.NOTICE,
        target: { type: 'dietary', id: selectedCatId, label: `${catName} Avoiders` },
        changes: {
          diffSummary: `Added ${count} student(s) to ${catName} avoiders list`,
          fieldsChanged: [`obj2.${selectedCatId}`],
          before: null,
          after: { count },
        },
        metadata: {
          batchCount: count,
          category: selectedCatId,
        },
      });

      setStudentsToAdd(new Set());
      setAddModalOpen(false);
      setAddModalSearch('');
      feedback('success');
      dialog.toast.success(
        'Avoiders Added',
        `Successfully added ${count} student(s) to ${catName} avoiders list.`
      );
      // Warn if kitchen printout already taken
      await checkAndWarnIfPrintsInvalidated(count, `Added ${count} students to ${catName} avoiders`);
    } catch (err) {
      console.error('Error adding avoiders:', err);
      feedback('warning');
      dialog.alert({
        type: 'error',
        title: 'Add Avoiders Failed',
        message: err.message || 'Could not add students to avoiders list.',
      });
    } finally {
      setAddingSubmitting(false);
    }
  };

  // ================= MATRIX INLINE TOGGLE =================
  const handleToggleMatrixPref = async (student, prefId) => {
    feedback('pop');
    const currentVal =
      student.obj2 && student.obj2[prefId] !== undefined
        ? Boolean(student.obj2[prefId])
        : true;
    const newVal = !currentVal;

    try {
      await firebase
        .firestore()
        .collection('students')
        .doc(student.id)
        .update({
          [`obj2.${prefId}`]: newVal,
        });
    } catch (err) {
      console.error('Error toggling matrix dietary preference:', err);
      dialog.toast.error('Update Failed', err.message);
    }
  };

  // ================= CHANGE REQUESTS COMPUTED =================
  const pendingRequestsCount = useMemo(() => {
    return requestsList.filter((r) => r.status === 'pending').length;
  }, [requestsList]);

  const approvedRequestsCount = useMemo(() => {
    return requestsList.filter((r) => r.status === 'approved').length;
  }, [requestsList]);

  const rejectedRequestsCount = useMemo(() => {
    return requestsList.filter((r) => r.status === 'rejected').length;
  }, [requestsList]);

  const filteredRequests = useMemo(() => {
    let list = [...requestsList];
    if (requestsStatusFilter !== 'all') {
      list = list.filter((r) => r.status === requestsStatusFilter);
    }
    if (requestsSearchQuery.trim()) {
      const q = requestsSearchQuery.toLowerCase().trim();
      list = list.filter((r) => {
        return (
          String(r.tokenNo).includes(q) ||
          (r.studentName || '').toLowerCase().includes(q) ||
          (r.batch || '').toLowerCase().includes(q) ||
          (r.reasonText || '').toLowerCase().includes(q)
        );
      });
    }
    return list;
  }, [requestsList, requestsStatusFilter, requestsSearchQuery]);

  // ================= CHANGE REQUEST ACTION HANDLERS =================
  const handleApproveRequest = async (req) => {
    const confirmed = await dialog.confirm({
      title: t('approveDietaryRequestTitle', 'Approve Dietary Modification?'),
      message: t(
        'approveDietaryRequestConfirm',
        `Apply requested dietary changes for Student #${req.tokenNo} (${req.studentName})? This will immediately update their dining profile in Firestore.`
      ),
      confirmText: t('approveAndApply', 'Approve & Apply'),
      cancelText: t('cancel', 'Cancel'),
    });

    if (!confirmed) return;

    setProcessingRequestId(req.id);
    feedback('tick');

    try {
      await approveDietaryChangeRequest(req.id, {
        uid: user?.uid,
        name: staffProfile?.displayName || user?.displayName || 'Canteen Committee Admin',
        role: role || 'canteen_admin',
      });
      dialog.toast.success(
        t('requestApproved', 'Request Approved'),
        t('requestApprovedDesc', `Dietary preferences updated for Student #${req.tokenNo}.`)
      );
      // Warn if kitchen printout already taken
      await checkAndWarnIfPrintsInvalidated(1, `Request approved for Student #${req.tokenNo}`);
    } catch (err) {
      console.error('Error approving dietary request:', err);
      dialog.toast.error('Approval Failed', err.message);
      feedback('error');
    } finally {
      setProcessingRequestId(null);
    }
  };

  const handleRejectRequest = async (req) => {
    const promptRes = await dialog.prompt({
      title: t('rejectDietaryRequestTitle', 'Reject Dietary Request?'),
      message: t(
        'rejectDietaryRequestPrompt',
        `Provide an explanation for declining Token #${req.tokenNo}'s request (optional):`
      ),
      placeholder: t('rejectionReasonPlaceholder', 'E.g., Special ingredients unavailable, please consult committee...'),
      confirmText: t('rejectRequest', 'Reject Request'),
      cancelText: t('cancel', 'Cancel'),
      isDestructive: true,
    });

    if (promptRes === null || promptRes === false) return;

    setProcessingRequestId(req.id);
    feedback('tick');

    try {
      await rejectDietaryChangeRequest(
        req.id,
        {
          uid: user?.uid,
          name: staffProfile?.displayName || user?.displayName || 'Canteen Committee Admin',
          role: role || 'canteen_admin',
        },
        typeof promptRes === 'string' ? promptRes : ''
      );
      dialog.toast.info(
        t('requestRejected', 'Request Declined'),
        t('requestRejectedDesc', `Dietary change request for Token #${req.tokenNo} was marked as rejected.`)
      );
    } catch (err) {
      console.error('Error rejecting dietary request:', err);
      dialog.toast.error('Rejection Failed', err.message);
      feedback('error');
    } finally {
      setProcessingRequestId(null);
    }
  };

  // ================= CATEGORY SETUP CRUD =================
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCatLabelEn.trim()) return;

    setCatSubmitting(true);
    feedback('tick');

    try {
      await addPreference({
        labelEn: newCatLabelEn.trim(),
        labelMl: newCatLabelMl.trim() || newCatLabelEn.trim(),
        icon: newCatIcon,
        defaultVal: true,
      });

      setNewCatLabelEn('');
      setNewCatLabelMl('');
      setNewCatIcon('Utensils');
      setShowAddCatForm(false);
      feedback('success');
      dialog.toast.success('Category Added', 'New dietary category created successfully.');
    } catch (err) {
      console.error('Error creating category:', err);
      feedback('warning');
      dialog.alert({
        type: 'error',
        title: 'Error',
        message: err.message || 'Failed to create category.',
      });
    } finally {
      setCatSubmitting(false);
    }
  };

  const handleSaveCatEdit = async (id) => {
    if (!editCatLabelEn.trim()) return;
    feedback('tick');

    try {
      await updatePreference(id, {
        labelEn: editCatLabelEn.trim(),
        labelMl: editCatLabelMl.trim() || editCatLabelEn.trim(),
        icon: editCatIcon,
      });
      setEditingCatId(null);
      feedback('success');
      dialog.toast.success('Saved', 'Category updated successfully.');
    } catch (err) {
      console.error('Error updating category:', err);
      feedback('warning');
    }
  };

  const handleToggleCatActive = async (pref) => {
    feedback('pop');
    try {
      await updatePreference(pref.id, {
        isActive: !pref.isActive,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCategory = async (pref) => {
    feedback('tick');
    const confirmed = await dialog.confirm({
      title: `Delete Category "${pref.labelEn}"?`,
      message:
        'Existing student records in the database will be preserved safely, but this category will no longer appear on menus.',
      confirmText: 'Yes, Delete Category',
      cancelText: 'Cancel',
      confirmColor: 'rose',
      icon: 'trash',
    });

    if (confirmed) {
      try {
        await deletePreference(pref.id);
        dialog.toast.success('Deleted', `Removed "${pref.labelEn}".`);
      } catch (err) {
        console.error(err);
      }
    }
  };

  // ================= KITCHEN PDF GENERATION =================
  const generateDietaryKitchenDoc = () => {
    const doc = new jsPDF('p', 'mm', 'a4');

    const activeList = preferences.filter((p) => p.isActive);
    const columns = activeList.map((p) => ({
      header: `${p.labelEn}\n(${p.labelMl || p.labelEn})`,
      dataKey: p.id,
    }));

    const maxLen = Math.max(
      ...activeList.map((p) => (avoidersMap[p.id] || []).length),
      1
    );

    const tableData = Array.from({ length: maxLen }).map((_, index) => {
      const row = {};
      activeList.forEach((p) => {
        const list = avoidersMap[p.id] || [];
        const student = list[index];
        row[p.id] = student ? `#${student.tokenNo} ${student.nameEn || student.name || ''}`.trim() : '-';
      });
      return row;
    });

    doc.setFontSize(16);
    doc.setTextColor(5, 150, 105);
    doc.text('Alathurpadi Dars - Dietary Avoiders Kitchen Roster', 14, 18);
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Generated on: ${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} IST`,
      14,
      25
    );

    doc.autoTable({
      columns,
      body: tableData,
      startY: 30,
      theme: 'grid',
      headStyles: {
        fillColor: [5, 150, 105],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10,
        halign: 'center',
      },
      bodyStyles: { fontSize: 9, halign: 'center' },
    });

    const filename = `ADSA_Kitchen_Dietary_Avoiders_${new Date().toISOString().slice(0, 10)}.pdf`;
    return {
      doc,
      filename,
      title: 'Dietary Avoiders Kitchen Roster',
      subtitle: `Official Kitchen Roster • Generated ${new Date().toLocaleDateString('en-GB')}`,
    };
  };

  // Direct In-App Preview
  const handleViewDietaryKitchenDoc = () => {
    feedback('tick');
    const res = generateDietaryKitchenDoc();
    setUniversalDoc({ isOpen: true, data: { type: 'pdf', ...res } });
  };

  // Direct Print
  const handlePrintDietaryKitchenDoc = async () => {
    feedback('tick');
    try {
      const { doc } = generateDietaryKitchenDoc();
      const { blobUrl } = createPdfBlob(doc);
      await directPrintPdf(blobUrl);
    } catch (e) {
      console.error('Print dietary roster failed:', e);
    }
  };

  // Direct Share
  const handleShareDietaryKitchenDoc = async () => {
    feedback('pop');
    try {
      const { doc, filename, title } = generateDietaryKitchenDoc();
      const { blob } = createPdfBlob(doc);
      await shareDocument({
        blob,
        filename,
        title,
        text: 'Alathurpadi Dars Canteen • Dietary Avoiders Kitchen Roster',
      });
    } catch (e) {
      console.error('Share dietary roster failed:', e);
    }
  };

  // Download PDF
  const generateKitchenPDF = () => {
    feedback('tick');
    const { doc, filename } = generateDietaryKitchenDoc();
    doc.save(filename);
    feedback('success');
  };

  // Selection toggle helpers
  const handleToggleAvoiderSelect = (id) => {
    feedback('tick');
    setSelectedAvoiderIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAllFilteredAvoiders = () => {
    feedback('pop');
    if (selectedAvoiderIds.size === filteredCategoryAvoiders.length && filteredCategoryAvoiders.length > 0) {
      setSelectedAvoiderIds(new Set());
    } else {
      setSelectedAvoiderIds(new Set(filteredCategoryAvoiders.map((s) => s.id)));
    }
  };

  const handleToggleAddStudentSelect = (id) => {
    feedback('tick');
    setStudentsToAdd((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh]">
        <div className="flex space-x-2">
          {[0, 1, 2].map((idx) => (
            <motion.div
              key={idx}
              className="w-3.5 h-3.5 rounded-full bg-emerald-500"
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 0.6, delay: idx * 0.15 }}
            />
          ))}
        </div>
        <p className="mt-3 text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
          Loading dietary records...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-4 sm:space-y-6">
      
      {/* ================= HERO & COMMAND RIBBON ================= */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3.5 sm:gap-4 p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white/80 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-sm backdrop-blur-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex-shrink-0">
              <UtensilsCrossed className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h1 className="text-lg xs:text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                <span>{t('dietaryMgmtTitle') || 'Dietary & Avoiders Console'}</span>
              </h1>
              <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">
                {t('dietaryMgmtSubtitle') || 'Real-time kitchen avoiders matrix, student dietary exclusions & preference setup'}
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-start lg:justify-end">
          <button
            onClick={handleRefresh}
            title="Refresh Data"
            className="p-2 sm:p-2.5 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => {
              feedback('tick');
              navigate('/admin');
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 text-gray-800 dark:text-gray-200 font-bold text-xs transition-colors"
          >
            <Sliders className="w-3.5 h-3.5 text-emerald-500" />
            <span>Master Board</span>
          </button>

          <button
            onClick={() => {
              feedback('tick');
              setIsCanteenLogOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 text-gray-800 dark:text-gray-200 font-bold text-xs transition-colors"
            title="View Canteen & Supply Ops Log"
          >
            <History className="w-3.5 h-3.5 text-emerald-500" />
            <span>Ops Log</span>
          </button>

          <button
            onClick={() => {
              feedback('tick');
              navigate('/');
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl bg-gray-100 dark:bg-white/10 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-600 text-gray-800 dark:text-gray-200 font-bold text-xs transition-colors"
            title="Go to Public Home (/)"
          >
            <Home className="w-3.5 h-3.5 text-emerald-500" />
            <span>Home</span>
          </button>

          <button
            onClick={() => {
              feedback('tick');
              navigate('/student-management');
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 text-gray-800 dark:text-gray-200 font-bold text-xs transition-colors"
          >
            <Users className="w-3.5 h-3.5 text-emerald-500" />
            <span>Students</span>
          </button>

          <div className="min-w-[170px]">
            <ExportActionMenu
              onView={handleViewDietaryKitchenDoc}
              onDownload={generateKitchenPDF}
              onPrint={handlePrintDietaryKitchenDoc}
              onShare={handleShareDietaryKitchenDoc}
              label={t('exportKitchenPdf', 'Kitchen PDF')}
              colorTheme="emerald"
              defaultAction="view"
            />
          </div>

          <button
            onClick={() => {
              feedback('tick');
              setAddModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold text-xs shadow-md shadow-emerald-500/25 transition-all transform active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{t('addAvoiderBtn') || '+ Add Avoider'}</span>
          </button>
        </div>
      </div>

      {/* ================= KPI BENTO STRIP ================= */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-4">
        {/* Total Registered Students */}
        <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/70 dark:bg-[#0f1715]/70 border border-gray-200/80 dark:border-white/10 shadow-sm backdrop-blur-xl">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-gray-400 block truncate">
            Total Enrolled
          </span>
          <span className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white mt-1 block">
            {students.length}
          </span>
          <span className="text-[10px] sm:text-[11px] text-gray-500 mt-0.5 block truncate">100% tokens tracked</span>
        </div>

        {/* Any Exemption Avoiders */}
        <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/70 dark:bg-[#0f1715]/70 border border-gray-200/80 dark:border-white/10 shadow-sm backdrop-blur-xl">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-rose-500 block truncate">
            Special Diet Total
          </span>
          <span className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 mt-1 block">
            {allExemptStudents.length}
          </span>
          <span className="text-[10px] sm:text-[11px] text-gray-500 mt-0.5 block truncate">
            {students.length > 0
              ? `${Math.round((allExemptStudents.length / students.length) * 100)}% of total students`
              : '0%'}
          </span>
        </div>

        {/* Active Categories Count */}
        <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/70 dark:bg-[#0f1715]/70 border border-gray-200/80 dark:border-white/10 shadow-sm backdrop-blur-xl">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-emerald-500 block truncate">
            Food Categories
          </span>
          <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
            {activePreferences.length}
          </span>
          <span className="text-[10px] sm:text-[11px] text-gray-500 mt-0.5 block truncate">Active tracking</span>
        </div>

        {/* Current Category Avoiders */}
        <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/70 dark:bg-[#0f1715]/70 border border-emerald-500/20 bg-emerald-500/5 shadow-sm backdrop-blur-xl">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block truncate">
            {currentCategory?.labelEn || 'Selected'} Avoiders
          </span>
          <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
            {selectedCatId ? (avoidersMap[selectedCatId] || []).length : 0}
          </span>
          <span className="text-[10px] sm:text-[11px] text-gray-500 mt-0.5 block truncate">
            {selectedCatId
              ? `${students.length - (avoidersMap[selectedCatId] || []).length} eating`
              : ''}
          </span>
        </div>

        {/* Most Avoided Item */}
        <div className="col-span-2 sm:col-span-4 lg:col-span-1 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/70 dark:bg-[#0f1715]/70 border border-gray-200/80 dark:border-white/10 shadow-sm backdrop-blur-xl">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-gray-400 block truncate">
            Top Excluded Item
          </span>
          {(() => {
            let maxCount = -1;
            let topPref = null;
            activePreferences.forEach((p) => {
              const c = (avoidersMap[p.id] || []).length;
              if (c > maxCount) {
                maxCount = c;
                topPref = p;
              }
            });
            return (
              <>
                <span className="text-base sm:text-lg font-black text-gray-800 dark:text-gray-200 mt-1 block truncate">
                  {topPref ? topPref.labelEn : 'None'}
                </span>
                <span className="text-[10px] sm:text-[11px] text-gray-500 block truncate">
                  {maxCount > 0 ? `${maxCount} students avoid` : 'No avoidances'}
                </span>
              </>
            );
          })()}
        </div>
      </div>

      {/* ================= VIEW NAVIGATION & CATEGORY SELECTOR ================= */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 p-1.5 sm:p-2 rounded-2xl bg-gray-100/80 dark:bg-white/5 border border-gray-200/80 dark:border-white/10">
        {/* Main View Mode Selector */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none touch-pan-x pb-0.5 sm:pb-0">
          <button
            onClick={() => {
              feedback('pop');
              setActiveView('category');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 ${
              activeView === 'category'
                ? 'bg-white dark:bg-[#131b18] text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>{t('viewAvoidersCategory') || 'Category View'}</span>
          </button>

          <button
            onClick={() => {
              feedback('pop');
              setActiveView('matrix');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 ${
              activeView === 'matrix'
                ? 'bg-white dark:bg-[#131b18] text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{t('viewAvoidersMatrix') || 'Full Matrix'}</span>
          </button>

          <button
            onClick={() => {
              feedback('pop');
              setActiveView('categories_setup');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 ${
              activeView === 'categories_setup'
                ? 'bg-white dark:bg-[#131b18] text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t('viewCategoriesSetup') || 'Category Settings'}</span>
          </button>

          <button
            onClick={() => {
              feedback('pop');
              setActiveView('requests');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 relative ${
              activeView === 'requests'
                ? 'bg-white dark:bg-[#131b18] text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{t('tabChangeRequests', 'Change Requests')}</span>
            {pendingRequestsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-500 text-white animate-pulse">
                {pendingRequestsCount}
              </span>
            )}
          </button>
        </div>

        {/* Category Pills (Only visible in 'category' view) */}
        {activeView === 'category' && (
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none touch-pan-x py-1">
            {activePreferences.map((pref) => {
              const count = (avoidersMap[pref.id] || []).length;
              const isSelected = selectedCatId === pref.id;
              return (
                <button
                  key={pref.id}
                  onClick={() => {
                    feedback('pop');
                    setSelectedCatId(pref.id);
                    setSelectedAvoiderIds(new Set());
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex-shrink-0 ${
                    isSelected
                      ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/25'
                      : 'bg-white/60 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-white/10'
                  }`}
                >
                  {getCategoryIcon(pref.icon, 'w-3.5 h-3.5')}
                  <span>{pref.labelEn}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ================= VIEW 1: CATEGORY SPECIFIC AVOIDERS ================= */}
      {activeView === 'category' && (
        <div className="space-y-4">
          
          {/* Action Ribbon & Filters for current category */}
          <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white/80 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-sm backdrop-blur-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
              {/* Category Identity */}
              <div className="flex items-center gap-2 sm:gap-2.5 pr-2.5 sm:pr-3 border-r border-gray-200/80 dark:border-white/10">
                <div className="p-1.5 sm:p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  {getCategoryIcon(currentCategory?.icon, 'w-4 h-4 sm:w-5 sm:h-5')}
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-gray-900 dark:text-white">
                    {currentCategory?.labelEn} Avoiders ({filteredCategoryAvoiders.length})
                  </h3>
                  <span className="text-[10px] sm:text-[11px] text-gray-500">
                    {currentCategory?.labelMl || ''}
                  </span>
                </div>
              </div>

              {/* Multi-select controls */}
              {filteredCategoryAvoiders.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={handleSelectAllFilteredAvoiders}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 text-xs font-bold text-gray-700 dark:text-gray-300 transition-colors"
                  >
                    {selectedAvoiderIds.size === filteredCategoryAvoiders.length ? (
                      <CheckSquare className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Square className="w-3.5 h-3.5 text-gray-400" />
                    )}
                    <span>
                      {selectedAvoiderIds.size === filteredCategoryAvoiders.length
                        ? 'Deselect'
                        : 'Select All'}
                    </span>
                  </button>

                  {selectedAvoiderIds.size > 0 && (
                    <button
                      onClick={handleBulkRemoveAvoiders}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold shadow-sm transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove ({selectedAvoiderIds.size})</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Search & Batch Filters */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              {/* Batch Dropdown */}
              <div className="relative">
                <select
                  value={selectedBatch}
                  onChange={(e) => setSelectedBatch(e.target.value)}
                  className="px-2.5 py-2 rounded-xl bg-gray-50 dark:bg-[#15221e] border border-gray-200/80 dark:border-white/10 text-xs font-semibold text-gray-800 dark:text-gray-200 focus:outline-none"
                >
                  <option value="ALL">All Batches</option>
                  {allBatches.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search Bar */}
              <div className="relative flex-1 sm:w-56">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search token, name..."
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-gray-50 dark:bg-[#15221e] border border-gray-200/80 dark:border-white/10 text-xs font-semibold text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
              </div>

              {/* Add Avoider Quick Action */}
              <button
                onClick={() => {
                  feedback('tick');
                  setAddModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all flex-shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Add Student</span>
              </button>
            </div>
          </div>

          {/* Avoiders Cards Grid */}
          {filteredCategoryAvoiders.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white/60 dark:bg-[#0f1715]/60 border border-dashed border-gray-300 dark:border-white/10">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 flex items-center justify-center mb-3">
                <Check className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-gray-800 dark:text-gray-200">
                No Avoiders Found for {currentCategory?.labelEn}
              </h3>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                {searchQuery || selectedBatch !== 'ALL'
                  ? 'No students matched your search criteria.'
                  : `All registered students are currently eating ${currentCategory?.labelEn}. Use the "+ Add Avoider" button above to record an exemption.`}
              </p>
              <button
                onClick={() => setAddModalOpen(true)}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Student to {currentCategory?.labelEn} Avoiders</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredCategoryAvoiders.map((student) => {
                const isSelected = selectedAvoiderIds.has(student.id);

                // Other items avoided by this student
                const otherAvoided = activePreferences.filter(
                  (p) => p.id !== selectedCatId && student.obj2 && student.obj2[p.id] === false
                );

                return (
                  <motion.div
                    key={student.id}
                    layout
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className={`relative p-4 rounded-2xl bg-white/90 dark:bg-[#0f1715]/90 border transition-all ${
                      isSelected
                        ? 'border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                        : 'border-gray-200/80 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      {/* Left: Checkbox & Student Info */}
                      <div className="flex items-start gap-3">
                        <button
                          type="button"
                          onClick={() => handleToggleAvoiderSelect(student.id)}
                          className="mt-0.5 text-gray-400 hover:text-emerald-500 transition-colors"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>

                        <div>
                          {/* Token & Batch Badges */}
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-mono font-bold text-xs border border-emerald-300/40">
                              #{student.tokenNo}
                            </span>
                            <span className="px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 text-[10px] font-semibold">
                              {student.batch || 'General'}
                            </span>
                            {student.block && (
                              <span className="px-1.5 py-0.2 rounded-md bg-rose-500/10 text-rose-600 text-[9px] font-bold">
                                BLOCKED
                              </span>
                            )}
                          </div>

                          {/* Student Names */}
                          <h4 className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
                            {student.nameEn || student.name || 'Unnamed Student'}
                          </h4>
                          {student.nameMl && (
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                              {student.nameMl}
                            </p>
                          )}

                          {/* Contact */}
                          {student.phone && (
                            <div className="flex items-center gap-1 mt-2 text-[10px] text-gray-400">
                              <Phone className="w-3 h-3" /> {student.phone}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 1-Click Remove from Avoiders Action */}
                      <button
                        onClick={() => handleRemoveAvoider(student)}
                        title={`Remove from ${currentCategory?.labelEn} avoiders (Mark as eating)`}
                        className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-300/40 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Other avoided items footer */}
                    {otherAvoided.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-white/5 flex items-center gap-1.5 flex-wrap">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">
                          Also avoids:
                        </span>
                        {otherAvoided.map((oa) => (
                          <span
                            key={oa.id}
                            className="px-1.5 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-[10px] font-bold"
                          >
                            {oa.labelEn}
                          </span>
                        ))}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================= VIEW 2: INTERACTIVE FULL AVOIDERS MATRIX ================= */}
      {activeView === 'matrix' && (
        <div className="rounded-3xl bg-white/90 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-sm overflow-hidden backdrop-blur-xl space-y-4">
          <div className="p-5 border-b border-gray-200/80 dark:border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-500" />
                <span>Full Avoidance Matrix ({allExemptStudents.length} Students)</span>
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Click any pill to toggle meal inclusion (Green = Included, Red = Avoided)
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter matrix by student or token..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-gray-50 dark:bg-[#15221e] border border-gray-200/80 dark:border-white/10 text-xs font-semibold text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto scrollbar-none touch-pan-x">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/80 dark:bg-white/5 border-b border-gray-200/80 dark:border-white/10 text-xs font-bold text-gray-700 dark:text-gray-300">
                  <th className="py-3 px-4">Token</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Batch</th>
                  {activePreferences.map((p) => (
                    <th key={p.id} className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {getCategoryIcon(p.icon, 'w-3.5 h-3.5')}
                        <span>{p.labelEn}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-xs font-semibold">
                {allExemptStudents
                  .filter((s) => {
                    if (!searchQuery.trim()) return true;
                    const q = searchQuery.toLowerCase().trim();
                    return (
                      String(s.tokenNo).includes(q) ||
                      (s.nameEn || s.name || '').toLowerCase().includes(q) ||
                      (s.nameMl || '').toLowerCase().includes(q) ||
                      (s.batch || '').toLowerCase().includes(q)
                    );
                  })
                  .map((student) => (
                    <tr
                      key={student.id}
                      className="hover:bg-gray-50/50 dark:hover:bg-white/2 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">
                            #{student.tokenNo}
                          </span>
                          {student.pendingDietaryRequest && (
                            <button
                              type="button"
                              onClick={() => {
                                feedback('pop');
                                setActiveView('requests');
                                setRequestsSearchQuery(String(student.tokenNo));
                              }}
                              className="px-1.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-[9px] font-black animate-pulse hover:bg-amber-500/25"
                              title="Pending dietary change request"
                            >
                              Request
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-gray-900 dark:text-white">
                          {student.nameEn || student.name || 'Unnamed'}
                        </div>
                        {student.nameMl && (
                          <div className="text-[10px] text-gray-400">{student.nameMl}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-500">{student.batch || 'General'}</td>
                      {activePreferences.map((p) => {
                        const isIncluded =
                          student.obj2 && student.obj2[p.id] !== undefined
                            ? Boolean(student.obj2[p.id])
                            : true;

                        return (
                          <td key={p.id} className="py-3 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleMatrixPref(student, p.id)}
                              className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all ${
                                isIncluded
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300/40 hover:bg-rose-50 hover:text-rose-600'
                                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-300/40 hover:bg-emerald-50 hover:text-emerald-600'
                              }`}
                            >
                              {isIncluded ? 'Eats' : 'Avoids'}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= VIEW 3: CATEGORY DEFINITIONS & SETTINGS ================= */}
      {activeView === 'categories_setup' && (
        <div className="space-y-4">
          <div className="p-5 rounded-3xl bg-white/80 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-sm backdrop-blur-xl flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-500" />
                <span>Dietary Categories & Exclusion Rules</span>
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Configure food items tracked by the ADSA Mess Committee (English & Malayalam)
              </p>
            </div>

            <button
              onClick={() => {
                feedback('tick');
                setShowAddCatForm(!showAddCatForm);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 text-white font-bold text-xs shadow-md shadow-emerald-500/25 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Dietary Item</span>
            </button>
          </div>

          {/* New Category Form */}
          <AnimatePresence>
            {showAddCatForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <form
                  onSubmit={handleCreateCategory}
                  className="p-5 rounded-3xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-300/60 dark:border-emerald-500/20 space-y-4"
                >
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                    Create New Dietary Category
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">
                        English Label *
                      </label>
                      <input
                        type="text"
                        required
                        value={newCatLabelEn}
                        onChange={(e) => setNewCatLabelEn(e.target.value)}
                        placeholder="e.g. Dairy, Egg, Duck"
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#15221e] border border-gray-200 dark:border-white/10 text-xs font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">
                        Malayalam Label
                      </label>
                      <input
                        type="text"
                        value={newCatLabelMl}
                        onChange={(e) => setNewCatLabelMl(e.target.value)}
                        placeholder="e.g. പാൽ, മുട്ട"
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#15221e] border border-gray-200 dark:border-white/10 text-xs font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">
                        Display Icon
                      </label>
                      <select
                        value={newCatIcon}
                        onChange={(e) => setNewCatIcon(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#15221e] border border-gray-200 dark:border-white/10 text-xs font-semibold"
                      >
                        {Object.keys(ICON_MAP).map((k) => (
                          <option key={k} value={k}>
                            {k}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddCatForm(false)}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={catSubmitting}
                      className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 shadow-sm"
                    >
                      {catSubmitting ? 'Creating...' : 'Save Category'}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Categories List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {preferences.map((pref) => {
              const isEditing = editingCatId === pref.id;
              const avoiderCount = (avoidersMap[pref.id] || []).length;

              return (
                <div
                  key={pref.id}
                  className="p-4 rounded-2xl bg-white/90 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-xs space-y-3"
                >
                  {isEditing ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-gray-400">
                          English
                        </label>
                        <input
                          type="text"
                          value={editCatLabelEn}
                          onChange={(e) => setEditCatLabelEn(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-[#15221e] border border-gray-200 dark:border-white/10 text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-gray-400">
                          Malayalam
                        </label>
                        <input
                          type="text"
                          value={editCatLabelMl}
                          onChange={(e) => setEditCatLabelMl(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-[#15221e] border border-gray-200 dark:border-white/10 text-xs font-bold"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingCatId(null)}
                          className="px-2.5 py-1 text-xs font-bold text-gray-500"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveCatEdit(pref.id)}
                          className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            {getCategoryIcon(pref.icon, 'w-4 h-4')}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                              {pref.labelEn}
                            </h4>
                            <p className="text-[11px] text-gray-500">{pref.labelMl}</p>
                          </div>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                            pref.isActive
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                              : 'bg-gray-100 text-gray-400'
                          }`}
                        >
                          {pref.isActive ? 'Active' : 'Disabled'}
                        </span>
                      </div>

                      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-xs">
                        <span className="text-[11px] text-gray-500">
                          <strong className="text-rose-500">{avoiderCount}</strong> avoiders recorded
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              feedback('tick');
                              setEditingCatId(pref.id);
                              setEditCatLabelEn(pref.labelEn);
                              setEditCatLabelMl(pref.labelMl || pref.labelEn);
                              setEditCatIcon(pref.icon || 'Utensils');
                            }}
                            className="p-1.5 text-gray-400 hover:text-emerald-500"
                            title="Edit Category Labels"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleToggleCatActive(pref)}
                            className="p-1.5 text-gray-400 hover:text-emerald-500"
                            title={pref.isActive ? 'Disable Category' : 'Activate Category'}
                          >
                            <Check className={`w-3.5 h-3.5 ${pref.isActive ? 'text-emerald-500' : ''}`} />
                          </button>

                          <button
                            onClick={() => handleDeleteCategory(pref)}
                            className="p-1.5 text-gray-400 hover:text-rose-500"
                            title="Delete Category"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= VIEW 4: DIETARY CHANGE REQUESTS ================= */}
      {activeView === 'requests' && (
        <div className="space-y-4">
          {/* Top Summary & Search Filter Ribbon */}
          <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white/80 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-sm backdrop-blur-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Status Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5 sm:pb-0">
              <button
                type="button"
                onClick={() => {
                  feedback('pop');
                  setRequestsStatusFilter('pending');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex-shrink-0 ${
                  requestsStatusFilter === 'pending'
                    ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/25'
                    : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{t('pendingRequests', 'Pending')}</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-white/20 text-white">
                  {pendingRequestsCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  feedback('pop');
                  setRequestsStatusFilter('approved');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex-shrink-0 ${
                  requestsStatusFilter === 'approved'
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/25'
                    : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{t('approvedRequests', 'Approved')}</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-white/20 text-white">
                  {approvedRequestsCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  feedback('pop');
                  setRequestsStatusFilter('rejected');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex-shrink-0 ${
                  requestsStatusFilter === 'rejected'
                    ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/25'
                    : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10'
                }`}
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>{t('rejectedRequests', 'Rejected')}</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-white/20 text-white">
                  {rejectedRequestsCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  feedback('pop');
                  setRequestsStatusFilter('all');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex-shrink-0 ${
                  requestsStatusFilter === 'all'
                    ? 'bg-gray-800 dark:bg-white text-white dark:text-gray-900 shadow-sm'
                    : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10'
                }`}
              >
                <span>{t('allRequests', 'All Requests')}</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-black/15 dark:bg-black/15 text-white dark:text-gray-900">
                  {requestsList.length}
                </span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={requestsSearchQuery}
                onChange={(e) => setRequestsSearchQuery(e.target.value)}
                placeholder={t('searchRequestsPlaceholder', 'Search requests by token, name, batch, reason...')}
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
              {requestsSearchQuery && (
                <button
                  type="button"
                  onClick={() => setRequestsSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Requests Grid / Cards */}
          {filteredRequests.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white/60 dark:bg-[#0f1715]/60 border border-gray-200/80 dark:border-white/10">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-white/5 text-gray-400 flex items-center justify-center mx-auto mb-3">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">
                {t('noDietaryRequestsFound', 'No Dietary Requests Found')}
              </h3>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                {requestsStatusFilter === 'pending'
                  ? t('noPendingDietaryRequests', 'There are no pending dietary change requests requiring committee approval.')
                  : t('noRequestsForFilter', 'No dietary requests match the selected status and search criteria.')}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredRequests.map((req) => {
                const isPending = req.status === 'pending';
                const isApproved = req.status === 'approved';
                const isRejected = req.status === 'rejected';
                const isProcessing = processingRequestId === req.id;
                const reasonMeta = REASON_CATEGORIES[req.reasonCategory] || {
                  labelEn: req.reasonCategory || 'Personal',
                  labelMl: req.reasonCategory || 'വ്യക്തിപരം',
                };

                return (
                  <motion.div
                    key={req.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 sm:p-5 rounded-3xl border transition-all ${
                      isPending
                        ? 'bg-white dark:bg-[#0f1715] border-amber-300/80 dark:border-amber-500/30 shadow-md shadow-amber-500/5'
                        : isApproved
                        ? 'bg-white/80 dark:bg-[#0f1715]/80 border-emerald-200 dark:border-emerald-500/20'
                        : 'bg-white/80 dark:bg-[#0f1715]/80 border-gray-200 dark:border-white/10 opacity-80'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-xs text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300/40">
                            #{req.tokenNo}
                          </span>
                          <span className="font-bold text-sm text-gray-900 dark:text-white">
                            {req.studentName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                          <span>{req.batch || 'General Batch'}</span>
                          {req.phone && <span>• {req.phone}</span>}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            isPending
                              ? 'bg-amber-400 text-amber-950 animate-pulse'
                              : isApproved
                              ? 'bg-emerald-500 text-white'
                              : isRejected
                              ? 'bg-rose-500 text-white'
                              : 'bg-gray-200 text-gray-700'
                          }`}
                        >
                          {isPending && <Clock className="w-2.5 h-2.5" />}
                          {isApproved && <Check className="w-2.5 h-2.5" />}
                          {isRejected && <X className="w-2.5 h-2.5" />}
                          <span>{req.status}</span>
                        </span>

                        {req.urgency === 'urgent' && (
                          <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-600 border border-rose-500/20">
                            Urgent
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Change Diff Summary */}
                    <div className="p-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/70 dark:border-white/10 space-y-2 mb-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 block">
                        {t('requestedChanges', 'Requested Preference Changes')}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {Array.isArray(req.changes) && req.changes.length > 0 ? (
                          req.changes.map((c) => (
                            <span
                              key={c.prefId}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 text-xs font-bold"
                            >
                              <span>{language === 'ml' ? c.labelMl : c.labelEn}:</span>
                              <span className={c.from ? 'text-emerald-600 line-through text-[11px]' : 'text-rose-600 line-through text-[11px]'}>
                                {c.from ? 'Included' : 'Avoided'}
                              </span>
                              <ArrowRight className="w-3 h-3 text-gray-400" />
                              <span className={c.to ? 'text-emerald-600 font-extrabold' : 'text-rose-600 font-extrabold'}>
                                {c.to ? 'Included' : 'Avoided'}
                              </span>
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400 italic">No diff recorded</span>
                        )}
                      </div>
                    </div>

                    {/* Reason Context */}
                    <div className="text-xs space-y-1 mb-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-700 dark:text-gray-300 text-[11px]">
                          {t('reason', 'Reason')}:
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-white/10 text-[11px] font-bold text-gray-700 dark:text-gray-300">
                          {language === 'ml' ? reasonMeta.labelMl : reasonMeta.labelEn}
                        </span>
                      </div>
                      {req.reasonText && (
                        <p className="text-gray-600 dark:text-gray-400 text-[11px] italic bg-white/40 dark:bg-white/5 p-2 rounded-xl border border-gray-100 dark:border-white/5">
                          &ldquo;{req.reasonText}&rdquo;
                        </p>
                      )}
                    </div>

                    {/* Footer Info or Actions */}
                    <div className="pt-2 border-t border-gray-100 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="text-[10px] text-gray-400">
                        {req.createdAt?.toDate
                          ? req.createdAt.toDate().toLocaleString()
                          : 'Recent'}
                        {req.reviewedBy && (
                          <span className="block mt-0.5 text-gray-500">
                            Reviewed by {req.reviewedBy.name}
                          </span>
                        )}
                        {req.rejectionReason && (
                          <span className="block mt-0.5 text-rose-500 font-bold">
                            Reason: {req.rejectionReason}
                          </span>
                        )}
                      </div>

                      {isPending && (
                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => handleRejectRequest(req)}
                            className="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-white/10 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-bold transition-all border border-gray-200 dark:border-white/10 cursor-pointer"
                          >
                            {t('reject', 'Reject')}
                          </button>

                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => handleApproveRequest(req)}
                            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black shadow-md shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>{t('approveAndApply', 'Approve & Apply')}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================= MODAL: ADD AVOIDER(S) ================= */}
      <AnimatePresence>
        {addModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 xs:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAddModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-xl max-h-[88dvh] flex flex-col rounded-2xl sm:rounded-3xl bg-white dark:bg-[#131b18] border border-gray-200/80 dark:border-white/10 shadow-2xl overflow-hidden z-10 pb-safe"
            >
              {/* Modal Header */}
              <div className="p-4 sm:p-5 border-b border-gray-200/80 dark:border-white/10 flex items-center justify-between">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Plus className="w-4 h-4 text-emerald-500" />
                    <span>Add to {currentCategory?.labelEn} Avoiders</span>
                  </h3>
                  <p className="text-[11px] sm:text-xs text-gray-500">
                    Select students who should NOT be served {currentCategory?.labelEn}
                  </p>
                </div>
                <button
                  onClick={() => setAddModalOpen(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Filters */}
              <div className="p-3 sm:p-4 bg-gray-50/80 dark:bg-white/5 border-b border-gray-200/80 dark:border-white/10 flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    value={addModalSearch}
                    onChange={(e) => setAddModalSearch(e.target.value)}
                    placeholder="Search by token, name, batch..."
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-white dark:bg-[#15221e] border border-gray-200 dark:border-white/10 text-xs font-semibold focus:outline-none"
                  />
                </div>
                <select
                  value={addModalBatch}
                  onChange={(e) => setAddModalBatch(e.target.value)}
                  className="px-2.5 sm:px-3 py-2 rounded-xl bg-white dark:bg-[#15221e] border border-gray-200 dark:border-white/10 text-xs font-semibold focus:outline-none"
                >
                  <option value="ALL">All Batches</option>
                  {allBatches.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              {/* Student Candidate List */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2">
                {nonAvoidersForCurrentCategory.length === 0 ? (
                  <div className="p-8 text-center text-xs text-gray-500">
                    No eligible students found matching your search.
                  </div>
                ) : (
                  nonAvoidersForCurrentCategory.map((st) => {
                    const isChecked = studentsToAdd.has(st.id);
                    return (
                      <div
                        key={st.id}
                        onClick={() => handleToggleAddStudentSelect(st.id)}
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer select-none transition-all ${
                          isChecked
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500/50'
                            : 'bg-white dark:bg-[#15221e] border-gray-200/80 dark:border-white/10 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            className="text-gray-400 pointer-events-none"
                          >
                            {isChecked ? (
                              <CheckSquare className="w-4 h-4 text-emerald-500" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">
                                #{st.tokenNo}
                              </span>
                              <span className="text-xs font-bold text-gray-900 dark:text-white">
                                {st.nameEn || st.name}
                              </span>
                            </div>
                            <span className="text-[10px] text-gray-400">
                              {st.batch || 'General'} {st.nameMl ? `• ${st.nameMl}` : ''}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isChecked
                              ? 'bg-emerald-500 text-white'
                              : 'bg-gray-100 dark:bg-white/5 text-gray-500'
                          }`}
                        >
                          {isChecked ? 'Will Avoid' : 'Select'}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-3.5 sm:p-4 border-t border-gray-200/80 dark:border-white/10 bg-gray-50/80 dark:bg-white/5 flex items-center justify-between pb-safe">
                <span className="text-xs font-bold text-gray-600 dark:text-gray-400">
                  {studentsToAdd.size} selected
                </span>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setAddModalOpen(false)}
                    className="px-3 sm:px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={studentsToAdd.size === 0 || addingSubmitting}
                    onClick={handleAddAvoidersSubmit}
                    className="px-4 sm:px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold text-xs shadow-md shadow-emerald-500/25 transition-all disabled:opacity-50"
                  >
                    {addingSubmitting
                      ? 'Saving...'
                      : `Add ${studentsToAdd.size} to Avoiders`}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Universal In-App Document Viewer & Action Modal */}
      <UniversalDocumentModal
        isOpen={universalDoc.isOpen}
        onClose={() => setUniversalDoc({ isOpen: false, data: null })}
        documentData={universalDoc.data}
      />

      {/* Canteen & Supply Ops Activity Log Drawer */}
      <CanteenOpsActivityDrawer
        isOpen={isCanteenLogOpen}
        onClose={() => setIsCanteenLogOpen(false)}
      />
    </div>
  );
}
