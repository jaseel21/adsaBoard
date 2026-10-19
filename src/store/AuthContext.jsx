import React, { createContext, useState, useEffect, useMemo, useCallback } from 'react';
import firebase from '../firebase/config';
import {
  ROLES,
  PERMISSIONS,
  hasRole as checkHasRole,
  hasPermission as checkHasPermission,
  resolveDefaultRoleByEmail,
  getRoleBadgeInfo,
  getRoleHomeRoute,
} from '../utils/rbac';

export const AuthContext = createContext(null);

export default function Context({ children }) {
  const [user, setUser] = useState(null);
  const [staffProfile, setStaffProfile] = useState(null);
  const [role, setRole] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Synchronize Firebase Auth & Staff Profile in Firestore
  useEffect(() => {
    let unsubStaff = null;

    const unsubAuth = firebase.auth().onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);

      if (unsubStaff) {
        unsubStaff();
        unsubStaff = null;
      }

      if (!currentUser) {
        setStaffProfile(null);
        setRole(null);
        setLoadingAuth(false);
        return;
      }

      try {
        const staffRef = firebase.firestore().collection('staff_users').doc(currentUser.uid);
        
        // Setup real-time listener for live role updates without requiring re-login
        unsubStaff = staffRef.onSnapshot(
          async (snapshot) => {
            if (snapshot.exists) {
              const data = snapshot.data();
              setStaffProfile(data);
              setRole(data.role || ROLES.CENTRAL_COMMITTEE);
            } else {
              // Check if account was pre-provisioned by email in staff_users
              let assignedRole = ROLES.CENTRAL_COMMITTEE;
              let assignedDept = 'ADSA Central Committee';
              let assignedName = currentUser.displayName || (currentUser.email ? currentUser.email.split('@')[0] : 'Staff Member');

              try {
                const emailQuery = await firebase
                  .firestore()
                  .collection('staff_users')
                  .where('email', '==', (currentUser.email || '').toLowerCase().trim())
                  .limit(1)
                  .get();

                if (!emailQuery.empty) {
                  const existingData = emailQuery.docs[0].data();
                  assignedRole = existingData.role || assignedRole;
                  assignedDept = existingData.department || assignedDept;
                  assignedName = existingData.displayName || assignedName;
                }
              } catch (qErr) {
                console.warn('Could not query staff_users by email:', qErr);
              }

              const initialProfile = {
                uid: currentUser.uid,
                email: currentUser.email || '',
                displayName: assignedName,
                role: assignedRole,
                department: assignedDept,
                status: 'active',
                createdAt: new Date().toISOString(),
                lastLoginAt: new Date().toISOString(),
              };

              // Persist bootstrapped profile so future lookups are indexed by UID
              try {
                await staffRef.set(initialProfile, { merge: true });
              } catch (writeErr) {
                console.warn('Could not auto-write staff profile to Firestore:', writeErr);
              }

              setStaffProfile(initialProfile);
              setRole(assignedRole);
            }
            setLoadingAuth(false);
          },
          (err) => {
            console.warn('Staff profile snapshot listener error, using in-memory fallback:', err);
            const fallbackRole = resolveDefaultRoleByEmail(currentUser.email);
            setRole(fallbackRole);
            setStaffProfile({
              uid: currentUser.uid,
              email: currentUser.email || '',
              displayName: currentUser.email?.split('@')[0] || 'Committee Staff',
              role: fallbackRole,
            });
            setLoadingAuth(false);
          }
        );
      } catch (err) {
        console.error('Error initializing staff profile:', err);
        const fallbackRole = resolveDefaultRoleByEmail(currentUser.email);
        setRole(fallbackRole);
        setLoadingAuth(false);
      }
    });

    return () => {
      unsubAuth();
      if (unsubStaff) unsubStaff();
    };
  }, []);

  const hasRole = useCallback(
    (allowedRoles) => {
      return checkHasRole(role, allowedRoles);
    },
    [role]
  );

  const hasPermission = useCallback(
    (permission) => {
      return checkHasPermission(role, permission);
    },
    [role]
  );

  const isDeveloper = role === ROLES.DEVELOPER;
  const isCentralCommittee = role === ROLES.CENTRAL_COMMITTEE || role === ROLES.DEVELOPER;
  const isCanteenCommittee = role === ROLES.CANTEEN_COMMITTEE || isCentralCommittee;
  const isCook = role === ROLES.COOK;

  const roleBadge = useMemo(() => getRoleBadgeInfo(role), [role]);
  const homeRoute = useMemo(() => getRoleHomeRoute(role), [role]);

  const logoutAdmin = useCallback(async () => {
    try {
      await firebase.auth().signOut();
      setUser(null);
      setStaffProfile(null);
      setRole(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      setUser,
      staffProfile,
      role,
      loadingAuth,
      hasRole,
      hasPermission,
      isDeveloper,
      isCentralCommittee,
      isCanteenCommittee,
      isCook,
      roleBadge,
      homeRoute,
      logoutAdmin,
    }),
    [
      user,
      staffProfile,
      role,
      loadingAuth,
      hasRole,
      hasPermission,
      isDeveloper,
      isCentralCommittee,
      isCanteenCommittee,
      isCook,
      roleBadge,
      homeRoute,
      logoutAdmin,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}