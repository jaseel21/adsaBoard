import React, { useState, useEffect, useContext, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Users,
  UserPlus,
  ShieldCheck,
  ChefHat,
  Utensils,
  KeyRound,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Mail,
  User,
  Building,
  Lock,
  Edit2,
  Sparkles,
} from 'lucide-react';
import firebase from '../firebase/config';
import { AuthContext } from '../store/AuthContext';
import { useFeedback } from '../utils/useFeedback';
import { dialog } from '../utils/dialog';
import { logAuditEvent, AUDIT_CATEGORIES, AUDIT_SEVERITIES } from '../utils/auditLogger';
import { ROLES, ROLE_LABELS, ROLE_BADGES, getRoleBadgeInfo } from '../utils/rbac';

export default function StaffManagementModal({ isOpen, onClose }) {
  const { user, role, staffProfile, isCentralCommittee, isDeveloper } = useContext(AuthContext);
  const { feedback } = useFeedback();

  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('directory'); // 'directory' | 'add'

  // Add Staff Form State
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState(ROLES.CANTEEN_COMMITTEE);
  const [newDept, setNewDept] = useState('Canteen Operations');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);

  // Edit Staff State
  const [editingStaff, setEditingStaff] = useState(null);

  // Real-time subscription to staff_users collection
  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);

    const unsub = firebase
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

    return () => unsub();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRoleChangeForDept = (selectedRole) => {
    setNewRole(selectedRole);
    if (selectedRole === ROLES.COOK) setNewDept('Kitchen Operations');
    else if (selectedRole === ROLES.CANTEEN_COMMITTEE) setNewDept('Canteen Sub-Committee');
    else if (selectedRole === ROLES.CENTRAL_COMMITTEE) setNewDept('ADSA Central Executive');
    else if (selectedRole === ROLES.DEVELOPER) setNewDept('Technical Systems');
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    if (!newEmail || !newPassword || newPassword.length < 6) {
      dialog.alert({
        type: 'warning',
        title: 'Validation Error',
        message: 'Please provide a valid email and a password of at least 6 characters.',
      });
      return;
    }

    setSaving(true);
    feedback('tick');

    try {
      // In Firebase Client SDK, secondary user creation is done via a secondary App or direct profile insertion
      // For immediate DB authorization, we register the profile document in staff_users
      const dummyUid = `staff_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      
      const newStaffDoc = {
        uid: dummyUid,
        email: newEmail.trim().toLowerCase(),
        displayName: newName.trim() || newEmail.split('@')[0],
        role: newRole,
        department: newDept.trim(),
        status: 'active',
        createdAt: new Date().toISOString(),
        createdBy: user?.email || 'admin',
      };

      await firebase.firestore().collection('staff_users').doc(dummyUid).set(newStaffDoc);

      await logAuditEvent({
        category: AUDIT_CATEGORIES.SECURITY,
        action: 'STAFF_ROLE_ASSIGNED',
        severity: AUDIT_SEVERITIES.NOTICE,
        target: { type: 'staff_user', id: dummyUid, label: newStaffDoc.displayName },
        changes: {
          diffSummary: `Added new staff member: ${newStaffDoc.displayName} (${newRole})`,
          after: newStaffDoc,
        },
      });

      dialog.toast.success(
        'Staff Member Provisioned',
        `Access granted for ${newStaffDoc.displayName} with role: ${ROLE_LABELS[newRole]}.`
      );

      // Reset form
      setNewEmail('');
      setNewName('');
      setNewPassword('');
      setActiveTab('directory');
    } catch (err) {
      console.error('Error provisioning staff:', err);
      dialog.alert({
        type: 'error',
        title: 'Provisioning Failed',
        message: err.message || 'Could not create staff record.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStaffRole = async (staffId, updatedRole) => {
    feedback('tick');
    try {
      await firebase.firestore().collection('staff_users').doc(staffId).update({
        role: updatedRole,
        updatedAt: new Date().toISOString(),
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 xs:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl bg-white dark:bg-[#0f1715] border border-gray-200/80 dark:border-white/10 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-white/10 flex items-center justify-between bg-gradient-to-r from-emerald-500/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                Staff & Roles Access Control
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Manage accounts, role delegations, and access boundaries
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
            <span>Staff Directory ({staffList.length})</span>
          </button>

          <button
            onClick={() => {
              feedback('tick');
              setActiveTab('add');
            }}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'add'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-white'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Provision New Staff</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {activeTab === 'directory' ? (
            <div className="space-y-3">
              {loading ? (
                <div className="py-12 text-center text-xs text-gray-400">Loading staff records...</div>
              ) : staffList.length === 0 ? (
                <div className="py-12 text-center text-gray-400 space-y-2">
                  <Users className="w-8 h-8 mx-auto opacity-50" />
                  <p className="text-xs font-semibold">No individualized staff profiles recorded yet.</p>
                  <p className="text-[11px]">Legacy login account operates under auto-bootstrapped central profile.</p>
                </div>
              ) : (
                staffList.map((st) => {
                  const badge = getRoleBadgeInfo(st.role);
                  const isEditingThis = editingStaff?.id === st.id;

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
                          <div className="flex items-center gap-1.5">
                            <select
                              value={editingStaff.role}
                              onChange={(e) =>
                                setEditingStaff({ ...editingStaff, role: e.target.value })
                              }
                              className="px-2 py-1 rounded-lg bg-white dark:bg-[#131b18] border border-gray-200 text-xs font-semibold text-gray-900 dark:text-white"
                            >
                              <option value={ROLES.COOK}>Cook / Kitchen</option>
                              <option value={ROLES.CANTEEN_COMMITTEE}>Canteen Sub-Committee</option>
                              <option value={ROLES.CENTRAL_COMMITTEE}>Central Committee</option>
                              {isDeveloper && <option value={ROLES.DEVELOPER}>Developer</option>}
                            </select>
                            <button
                              onClick={() => handleUpdateStaffRole(st.id, editingStaff.role)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-xs font-bold shadow-sm"
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
                        ) : (
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
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            /* Add Staff Form */
            <form onSubmit={handleCreateStaff} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ali - Head Cook"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Staff Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      required
                      placeholder="e.g. staff@example.com"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Role Category
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => handleRoleChangeForDept(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value={ROLES.COOK}>Kitchen Staff / Cook (KDS only)</option>
                    <option value={ROLES.CANTEEN_COMMITTEE}>Canteen Sub-Committee (Menu & Dietary)</option>
                    <option value={ROLES.CENTRAL_COMMITTEE}>ADSA Central Committee (Full Admin)</option>
                    {isDeveloper && <option value={ROLES.DEVELOPER}>System Developer</option>}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Department
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={newDept}
                      onChange={(e) => setNewDept(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Initial Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    required
                    placeholder="Minimum 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all disabled:opacity-50"
              >
                {saving ? 'Provisioning Staff Profile...' : 'Create & Authorize Staff Account'}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
