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

import { seedSuperAdmin } from '../utils/authSeeder';

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
        const normalizedEmail = (currentUser.email || '').toLowerCase().trim();

        // 1. Maintain registry of authenticated accounts for Staff Management selection
        try {
          await firebase
            .firestore()
            .collection('auth_users')
            .doc(currentUser.uid)
            .set(
              {
                uid: currentUser.uid,
                email: normalizedEmail,
                displayName: currentUser.displayName || normalizedEmail.split('@')[0] || 'Auth User',
                lastSeenAt: new Date().toISOString(),
              },
              { merge: true }
            );
        } catch (authRegistryErr) {
          console.warn('Could not update auth_users registry:', authRegistryErr);
        }

        // 2. Dynamically seed Super Admin if this is navarmp@gmail.com or designated seed
        await seedSuperAdmin(currentUser);

        // 3. Setup real-time listener for live role updates on staff_users
        const staffRef = firebase.firestore().collection('staff_users').doc(currentUser.uid);

        unsubStaff = staffRef.onSnapshot(
          async (snapshot) => {
            if (snapshot.exists) {
              const data = snapshot.data();
              // Only active accounts receive operational roles
              if (data.status === 'active') {
                setStaffProfile(data);
                setRole(data.role || null);
              } else {
                setStaffProfile(data);
                setRole(null); // Inactive or suspended accounts have zero administrative privileges
              }
              setLoadingAuth(false);
            } else {
              // 4. Check if account was pre-provisioned by email in staff_users before sign in
              let preProvisionedDoc = null;
              try {
                const emailQuery = await firebase
                  .firestore()
                  .collection('staff_users')
                  .where('email', '==', normalizedEmail)
                  .limit(1)
                  .get();

                if (!emailQuery.empty) {
                  preProvisionedDoc = emailQuery.docs[0];
                }
              } catch (qErr) {
                console.warn('Could not query staff_users by email:', qErr);
              }

              if (preProvisionedDoc && preProvisionedDoc.exists) {
                const preData = preProvisionedDoc.data();
                const updatedProfile = {
                  ...preData,
                  uid: currentUser.uid,
                  lastLoginAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                };

                // Link UID to canonical staff document
                try {
                  await staffRef.set(updatedProfile, { merge: true });
                  // If the pre-provisioned doc had a dummy ID, cleanup is optional or handled
                } catch (linkErr) {
                  console.warn('Could not bind UID to staff profile:', linkErr);
                }

                if (updatedProfile.status === 'active') {
                  setStaffProfile(updatedProfile);
                  setRole(updatedProfile.role || null);
                } else {
                  setStaffProfile(updatedProfile);
                  setRole(null);
                }
              } else {
                // FAIL-SECURE: Do NOT auto-grant Central Committee. Unprovisioned users have null role.
                setStaffProfile(null);
                setRole(null);
              }

              setLoadingAuth(false);
            }
          },
          (err) => {
            console.warn('Staff profile snapshot listener error, using fail-secure fallback:', err);
            setRole(null);
            setStaffProfile(null);
            setLoadingAuth(false);
          }
        );
      } catch (err) {
        console.error('Error initializing staff profile:', err);
        setRole(null);
        setStaffProfile(null);
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
  const isSuperAdmin = isDeveloper;
  const isCentralCommittee = role === ROLES.CENTRAL_COMMITTEE || role === ROLES.DEVELOPER;
  const isCanteenCommittee = role === ROLES.CANTEEN_COMMITTEE || isCentralCommittee;
  const isCook = role === ROLES.COOK;
  const isAuthorizedStaff = Boolean(role && staffProfile?.status === 'active');

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
      isSuperAdmin,
      isAuthorizedStaff,
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
      isSuperAdmin,
      isAuthorizedStaff,
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