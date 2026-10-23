import React, { useState, useEffect, useContext, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Users,
  UserPlus,
  ShieldCheck,
  ChefHat,
  Utensils,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Mail,
  User,
  Building,
  Edit2,
  Sparkles,
  Search,
  Lock,
  ShieldAlert,
  ArrowRight,
  UserCheck,
  Check,
} from 'lucide-react';
import firebase from '../firebase/config';
import { AuthContext } from '../store/AuthContext';
import { useFeedback } from '../utils/useFeedback';
import { dialog } from '../utils/dialog';
import { logAuditEvent, AUDIT_CATEGORIES, AUDIT_SEVERITIES } from '../utils/auditLogger';
import { ROLES, ROLE_LABELS, getRoleBadgeInfo, isSuperAdminRole } from '../utils/rbac';
import { validateSuperAdminInvariant } from '../utils/authSeeder';

export default function StaffManagementModal({ isOpen, onClose }) {
  const { user, role, staffProfile, isCentralCommittee, isDeveloper, isSuperAdmin } = useContext(AuthContext);
  const { feedback } = useFeedback();

  const [staffList, setStaffList] = useState([]);
  const [authUsers, setAuthUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('directory'); // 'directory' | 'assign'

  // User Assignment Form State
  const [selectedAuthUser, setSelectedAuthUser] = useState(null);
  const [customEmail, setCustomEmail] = useState('');
  const [targetName, setTargetName] = useState('');
  const [targetRole, setTargetRole] = useState(ROLES.CANTEEN_COMMITTEE);
  const [targetDept, setTargetDept] = useState('Canteen Sub-Committee');
  const [authSearchQuery, setAuthSearchQuery] = useState('');
  const [authFilter, setAuthFilter] = useState('all'); // 'all' | 'unassigned' | 'assigned'
  const [saving, setSaving] = useState(false);

  // Edit Staff State
  const [editingStaff, setEditingStaff] = useState(null);

  // 1. Real-time subscription to staff_users collection
  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);

    const unsubStaff = firebase
      .firestore()
      .collection('staff_users')
      .onSnapshot(
        (snapshot) => {
          const list = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          list.sort((a, b) => (a.displayName || a.email || '').localeCompare(b.displayName || b.email || ''));
          setStaffList(list);
          setLoading(false);
        },
        (err) => {
          console.error('Error fetching staff list:', err);
          setLoading(false);
        }
      );

    // 2. Real-time subscription to auth_users directory
    const unsubAuth = firebase
      .firestore()
      .collection('auth_users')
      .onSnapshot(
        (snapshot) => {
          const users = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setAuthUsers(users);
        },
        (err) => {
          console.warn('Could not read auth_users collection:', err);
        }
      );

    return () => {
      unsubStaff();
      unsubAuth();
    };
  }, [isOpen]);

  // Combine known auth users with staff assignment status
  const enrichedAuthUsers = useMemo(() => {
    const staffByEmail = new Map();
    const staffByUid = new Map();

    staffList.forEach((st) => {
      if (st.email) staffByEmail.set(st.email.toLowerCase().trim(), st);
      if (st.uid) staffByUid.set(st.uid, st);
    });

    // Map existing auth users
    const list = authUsers.map((au) => {
      const email = (au.email || '').toLowerCase().trim();
      const staffMatch = staffByUid.get(au.uid || au.id) || staffByEmail.get(email);
      return {
        ...au,
        assignedRole: staffMatch ? staffMatch.role : null,
        staffId: staffMatch ? staffMatch.id : null,
        status: staffMatch ? staffMatch.status : null,
        department: staffMatch ? staffMatch.department : null,
      };
    });

    // Also include any staff users who might not be in auth_users yet
    staffList.forEach((st) => {
      const email = (st.email || '').toLowerCase().trim();
      const alreadyIncluded = list.some(
        (u) => (u.email && u.email.toLowerCase().trim() === email) || (u.uid && u.uid === st.uid)
      );
      if (!alreadyIncluded) {
        list.push({
          uid: st.uid || st.id,
          id: st.id,
          email: st.email,
          displayName: st.displayName,
          assignedRole: st.role,
          staffId: st.id,
          status: st.status,
          department: st.department,
        });
      }
    });

    // Sort alphabetically
    list.sort((a, b) => (a.displayName || a.email || '').localeCompare(b.displayName || b.email || ''));
    return list;
  }, [authUsers, staffList]);

  // Filter auth users based on search and tab filter
  const filteredAuthUsers = useMemo(() => {
    return enrichedAuthUsers.filter((u) => {
      const q = authSearchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.displayName && u.displayName.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (authFilter === 'unassigned') return !u.assignedRole;
      if (authFilter === 'assigned') return !!u.assignedRole;
      return true;
    });
  }, [enrichedAuthUsers, authSearchQuery, authFilter]);

  if (!isOpen || typeof document === 'undefined') return null;

  const handleSelectAuthUser = (au) => {
    feedback('tick');
    setSelectedAuthUser(au);
    setCustomEmail(au.email || '');
    setTargetName(au.displayName || au.email?.split('@')[0] || '');
    if (au.assignedRole) {
      setTargetRole(au.assignedRole);
      setTargetDept(au.department || 'ADSA Committee');
    } else {
      setTargetRole(ROLES.CANTEEN_COMMITTEE);
      setTargetDept('Canteen Sub-Committee');
    }
  };

  const handleRoleChangeForDept = (selectedRole) => {
    setTargetRole(selectedRole);
    if (selectedRole === ROLES.COOK) setTargetDept('Kitchen Operations');
    else if (selectedRole === ROLES.CANTEEN_COMMITTEE) setTargetDept('Canteen Sub-Committee');
    else if (selectedRole === ROLES.CENTRAL_COMMITTEE) setTargetDept('ADSA Central Executive');
    else if (isSuperAdminRole(selectedRole)) setTargetDept('Technical Systems / Super Admin');
  };

  const handleAssignRole = async (e) => {
    e.preventDefault();
    const emailToUse = (selectedAuthUser?.email || customEmail || '').trim().toLowerCase();
    if (!emailToUse) {
      dialog.alert({
        type: 'warning',
        title: 'Missing Email',
        message: 'Please choose an authenticated user from the list or enter their email address.',
      });
      return;
    }

    // Guard: Only Super Admins can assign the Super Admin / Developer role
    if (isSuperAdminRole(targetRole) && !isSuperAdmin) {
      dialog.alert({
        type: 'error',
        title: 'Insufficient Permission',
        message: 'Only a Super Admin / Developer has permission to grant the Super Admin role.',
      });
      return;
    }

    setSaving(true);
    feedback('tick');

    try {
      const targetUid = selectedAuthUser?.uid || selectedAuthUser?.id;
      const docId = targetUid || `staff_${emailToUse.replace(/[^a-zA-Z0-9]/g, '_')}`;

      const staffPayload = {
        email: emailToUse,
        displayName: targetName.trim() || emailToUse.split('@')[0],
        role: targetRole,
        department: targetDept.trim(),
        status: 'active',
        isSuperAdmin: isSuperAdminRole(targetRole),
        updatedAt: new Date().toISOString(),
        assignedBy: user?.email || 'admin',
        ...(targetUid ? { uid: targetUid } : {}),
      };

      // Write directly to staff_users collection
      await firebase.firestore().collection('staff_users').doc(docId).set(staffPayload, { merge: true });

      // Also ensure auth_users registry records the user
      if (targetUid) {
        await firebase.firestore().collection('auth_users').doc(targetUid).set(
          {
            uid: targetUid,
            email: emailToUse,
            displayName: staffPayload.displayName,
            lastSeenAt: new Date().toISOString(),
          },
          { merge: true }
        );
      }

      await logAuditEvent({
        category: AUDIT_CATEGORIES.SECURITY,
        action: 'STAFF_ROLE_ASSIGNED',
        severity: AUDIT_SEVERITIES.NOTICE,
        target: { type: 'staff_user', id: docId, label: staffPayload.displayName },
        changes: {
          diffSummary: `Assigned role ${ROLE_LABELS[targetRole] || targetRole} to ${emailToUse}`,
          after: staffPayload,
        },
      });

      dialog.toast.success(
        'Staff Role Assigned',
        `Access granted for ${staffPayload.displayName} with role: ${ROLE_LABELS[targetRole] || targetRole}.`
      );

      // Reset form
      setSelectedAuthUser(null);
      setCustomEmail('');
      setTargetName('');
      setActiveTab('directory');
    } catch (err) {
      console.error('Error assigning staff role:', err);
      dialog.alert({
        type: 'error',
        title: 'Assignment Failed',
        message: err.message || 'Could not save staff role assignment.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStaffRole = async (staffId, updatedRole) => {
    feedback('tick');

    // 1. Guard: Only Super Admins can promote someone to Super Admin
    if (isSuperAdminRole(updatedRole) && !isSuperAdmin) {
      dialog.alert({
        type: 'error',
        title: 'Permission Denied',
        message: 'Only a Super Admin / Developer can grant the Super Admin role.',
      });
      return;
    }

    // 2. Invariant Guard: Ensure >= 1 Super Admin remains active
    const invariantCheck = validateSuperAdminInvariant(staffList, staffId, updatedRole);
    if (!invariantCheck.canProceed) {
      dialog.alert({
        type: 'warning',
        title: 'Invariant Protection',
        message: invariantCheck.message,
      });
      return;
    }

    try {
      await firebase.firestore().collection('staff_users').doc(staffId).update({
        role: updatedRole,
        isSuperAdmin: isSuperAdminRole(updatedRole),
        updatedAt: new Date().toISOString(),
        updatedBy: user?.email || 'admin',
      });

      await logAuditEvent({
        category: AUDIT_CATEGORIES.SECURITY,
        action: 'STAFF_ROLE_MODIFIED',
        severity: AUDIT_SEVERITIES.WARNING,
        target: { type: 'staff_user', id: staffId, label: 'Staff Profile' },
        changes: {
          diffSummary: `Modified role to ${updatedRole} for staff ${staffId}`,
        },
      });

      dialog.toast.success('Role Updated', `Changed role to ${ROLE_LABELS[updatedRole] || updatedRole}.`);
      setEditingStaff(null);
    } catch (err) {
      console.error('Error updating role:', err);
      dialog.alert({
        type: 'error',
        title: 'Update Error',
        message: err.message || 'Could not update staff role.',
      });
    }
  };

  const handleDeleteStaff = async (staff) => {
    // 1. Invariant Guard: Ensure >= 1 Super Admin remains active
    const invariantCheck = validateSuperAdminInvariant(staffList, staff.id, null);
    if (!invariantCheck.canProceed) {
      dialog.alert({
        type: 'warning',
        title: 'Invariant Protection',
        message: invariantCheck.message,
      });
      return;
    }

    // 2. Guard: Central Committee cannot delete a Super Admin
    if (isSuperAdminRole(staff.role) && !isSuperAdmin) {
      dialog.alert({
        type: 'error',
        title: 'Permission Denied',
        message: 'Super Admin accounts can only be revoked by another Super Admin.',
      });
      return;
    }

    const confirmed = await dialog.confirm({
      title: 'Revoke Staff Access?',
      message: `Are you sure you want to revoke administrative access for ${staff.displayName || staff.email}? They will no longer be able to enter the staff consoles.`,
      icon: 'warning',
      confirmColor: 'rose',
      confirmText: 'Yes, Revoke Access',
      cancelText: 'Cancel',
    });

    if (confirmed) {
      feedback('pop');
      try {
        await firebase.firestore().collection('staff_users').doc(staff.id).delete();

        await logAuditEvent({
          category: AUDIT_CATEGORIES.SECURITY,
          action: 'STAFF_ACCESS_REVOKED',
          severity: AUDIT_SEVERITIES.CRITICAL,
          target: { type: 'staff_user', id: staff.id, label: staff.displayName || staff.email },
          changes: {
            diffSummary: `Revoked access for staff member: ${staff.displayName || staff.email}`,
          },
        });

        dialog.toast.info('Access Revoked', `${staff.displayName || staff.email} has been removed from staff.`);
      } catch (err) {
        console.error('Error revoking staff:', err);
        dialog.alert({
          type: 'error',
          title: 'Error',
          message: err.message || 'Could not revoke staff access.',
        });
      }
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 xs:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        data-lenis-prevent
        className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl bg-white dark:bg-[#0f1715] border border-gray-200/80 dark:border-white/10 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-white/10 flex items-center justify-between bg-gradient-to-r from-emerald-500/10 via-transparent to-purple-500/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                  Staff & Roles Access Control
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-600/40">
                  Firebase RBAC
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Manage authenticated accounts, delegate operational roles, and enforce system invariants
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 pt-4 border-b border-gray-100 dark:border-white/10 flex items-center gap-2">
          <button
            onClick={() => {
              feedback('tick');
              setActiveTab('directory');
            }}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'directory'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Staff Roster ({staffList.length})</span>
          </button>

          <button
            onClick={() => {
              feedback('tick');
              setActiveTab('assign');
            }}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'assign'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-white'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Assign Role to Auth User</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {activeTab === 'directory' ? (
            /* Tab 1: Staff Directory */
            <div className="space-y-3">
              {loading ? (
                <div className="py-12 text-center text-xs text-gray-400">Loading staff records...</div>
              ) : staffList.length === 0 ? (
                <div className="py-12 text-center text-gray-400 space-y-2">
                  <Users className="w-8 h-8 mx-auto opacity-50" />
                  <p className="text-xs font-semibold">No individualized staff profiles recorded yet.</p>
                  <p className="text-[11px]">Use &quot;Assign Role to Auth User&quot; to provision committee roles.</p>
                </div>
              ) : (
                staffList.map((st) => {
                  const badge = getRoleBadgeInfo(st.role);
                  const isEditingThis = editingStaff?.id === st.id;
                  const isStaffSuperAdmin = isSuperAdminRole(st.role) || st.isSuperAdmin === true;
                  const canManageThis = isSuperAdmin || !isStaffSuperAdmin;

                  return (
                    <div
                      key={st.id}
                      className="p-3.5 sm:p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/70 dark:border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white">
                            {st.displayName || st.email}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.badgeClass}`}>
                            {badge.label}
                          </span>
                          {isStaffSuperAdmin && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                              System Architect
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400">
                          <span className="font-mono">{st.email}</span>
                          {st.department && (
                            <>
                              <span>•</span>
                              <span>{st.department}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Action & Role Changer */}
                      <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-200/50 dark:border-white/10">
                        {isEditingThis ? (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <select
                              value={editingStaff.role}
                              onChange={(e) =>
                                setEditingStaff({ ...editingStaff, role: e.target.value })
                              }
                              className="px-2 py-1 rounded-lg bg-white dark:bg-[#131b18] border border-gray-200 dark:border-white/20 text-xs font-semibold text-gray-900 dark:text-white"
                            >
                              <option value={ROLES.COOK}>Kitchen Staff / Cook</option>
                              <option value={ROLES.CANTEEN_COMMITTEE}>Canteen Sub-Committee</option>
                              <option value={ROLES.CENTRAL_COMMITTEE}>ADSA Central Committee</option>
                              {isSuperAdmin && <option value={ROLES.DEVELOPER}>Super Admin / Developer</option>}
                            </select>
                            <button
                              onClick={() => handleUpdateStaffRole(st.id, editingStaff.role)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingStaff(null)}
                              className="px-2 py-1 rounded-lg bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-300 text-xs font-semibold"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : canManageThis ? (
                          <>
                            <button
                              onClick={() => setEditingStaff(st)}
                              className="p-1.5 rounded-lg text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                              title="Edit Role Assignment"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteStaff(st)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                              title="Revoke Staff Access"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <div
                            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-100 dark:bg-white/5 text-[10px] font-semibold text-gray-400 cursor-not-allowed"
                            title="Super Admin profiles can only be modified by Super Admins."
                          >
                            <Lock className="w-3 h-3 text-purple-400" />
                            <span>Protected Super Admin</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            /* Tab 2: Assign Role to Firebase Auth User */
            <div className="space-y-5">
              {/* Step 1: Select User from Firebase Authentication */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-emerald-500" />
                      <span>Select Firebase Authentication Account</span>
                    </h3>
                    <p className="text-[11px] text-gray-400">
                      Users must already exist in Firebase Authentication. Passwords are created in Firebase Console or via Auth sign-up.
                    </p>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-1 bg-gray-100 dark:bg-white/5 p-1 rounded-xl text-[11px] font-semibold">
                    <button
                      type="button"
                      onClick={() => setAuthFilter('all')}
                      className={`px-2 py-0.5 rounded-lg transition-colors ${
                        authFilter === 'all'
                          ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-xs'
                          : 'text-gray-500'
                      }`}
                    >
                      All ({enrichedAuthUsers.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuthFilter('unassigned')}
                      className={`px-2 py-0.5 rounded-lg transition-colors ${
                        authFilter === 'unassigned'
                          ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-xs'
                          : 'text-gray-500'
                      }`}
                    >
                      Unassigned
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuthFilter('assigned')}
                      className={`px-2 py-0.5 rounded-lg transition-colors ${
                        authFilter === 'assigned'
                          ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-xs'
                          : 'text-gray-500'
                      }`}
                    >
                      Assigned
                    </button>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={authSearchQuery}
                    onChange={(e) => setAuthSearchQuery(e.target.value)}
                    placeholder="Search auth users by email or display name..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Auth Users List */}
                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 border border-gray-100 dark:border-white/5 rounded-2xl p-2 bg-gray-50/50 dark:bg-black/20">
                  {filteredAuthUsers.length === 0 ? (
                    <div className="py-6 text-center text-xs text-gray-400">
                      No matching Firebase Auth accounts found in registry. You can pre-authorize any email below.
                    </div>
                  ) : (
                    filteredAuthUsers.map((au) => {
                      const isSelected =
                        (selectedAuthUser && (selectedAuthUser.uid === au.uid || selectedAuthUser.id === au.id)) ||
                        customEmail.toLowerCase().trim() === (au.email || '').toLowerCase().trim();

                      const badge = au.assignedRole ? getRoleBadgeInfo(au.assignedRole) : null;

                      return (
                        <button
                          key={au.uid || au.id || au.email}
                          type="button"
                          onClick={() => handleSelectAuthUser(au)}
                          className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-left transition-all ${
                            isSelected
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 ring-1 ring-emerald-500'
                              : 'bg-white dark:bg-white/5 border-gray-200/70 dark:border-white/10 hover:border-emerald-300 dark:hover:border-emerald-500/30'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                                isSelected
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300'
                              }`}
                            >
                              {(au.displayName || au.email || '?').charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <span className="text-xs font-bold text-gray-900 dark:text-white block truncate">
                                {au.displayName || au.email}
                              </span>
                              <span className="text-[10px] text-gray-400 truncate block font-mono">
                                {au.email}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {badge ? (
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex-shrink-0 ${badge.badgeClass}`}
                              >
                                {badge.label}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 dark:bg-white/10 text-gray-500 border border-gray-200 dark:border-white/10">
                                Unassigned
                              </span>
                            )}
                            {isSelected && <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Step 2: Role Assignment Configuration Form */}
              <form onSubmit={handleAssignRole} className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/80 dark:border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>Role & Department Assignment</span>
                  </h4>
                  {selectedAuthUser && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAuthUser(null);
                        setCustomEmail('');
                        setTargetName('');
                      }}
                      className="text-[11px] font-semibold text-gray-400 hover:text-gray-700 dark:hover:text-white"
                    >
                      Clear Selection
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Target Auth Email
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="email"
                        required
                        placeholder="e.g. officer@example.com"
                        value={customEmail}
                        onChange={(e) => {
                          setCustomEmail(e.target.value);
                          setSelectedAuthUser(null);
                        }}
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-[#131b18] border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Display / Staff Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Brother Ahmad"
                        value={targetName}
                        onChange={(e) => setTargetName(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-[#131b18] border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Role Privilege Tier
                    </label>
                    <select
                      value={targetRole}
                      onChange={(e) => handleRoleChangeForDept(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#131b18] border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value={ROLES.COOK}>Kitchen Staff / Cook (KDS only)</option>
                      <option value={ROLES.CANTEEN_COMMITTEE}>Canteen Sub-Committee (Menu & Dietary)</option>
                      <option value={ROLES.CENTRAL_COMMITTEE}>ADSA Central Committee (Full Admin)</option>
                      {isSuperAdmin && (
                        <option value={ROLES.DEVELOPER}>Super Admin / Developer (Complete Authority)</option>
                      )}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Department / Wing
                    </label>
                    <div className="relative">
                      <Building className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={targetDept}
                        onChange={(e) => setTargetDept(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-[#131b18] border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-500/20 text-[11px] text-emerald-800 dark:text-emerald-200 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>
                    No passwords are stored here. The user authenticates using their designated password in Firebase Authentication.
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    'Saving Role Assignment...'
                  ) : (
                    <>
                      <span>Grant & Authorize Staff Role</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
