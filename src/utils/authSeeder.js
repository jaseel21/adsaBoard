import firebase from '../firebase/config';
import { ROLES, isSuperAdminRole } from './rbac';
import { logAuditEvent, AUDIT_CATEGORIES, AUDIT_SEVERITIES } from './auditLogger';

export const INITIAL_SUPER_ADMIN_EMAIL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_INITIAL_SUPER_ADMIN_EMAIL) ||
  'navarmp@gmail.com';

/**
 * Dynamically seeds or reconciles the designated developer/super admin profile.
 * Does NOT hardcode role checks in runtime guards; instead, writes the canonical
 * role directly into Firestore staff_users so the database remains the single source of truth.
 *
 * @param {object} currentUser - Firebase Auth User object
 * @returns {Promise<object|null>} The seeded or verified staff profile, or null if not applicable.
 */
export async function seedSuperAdmin(currentUser) {
  if (!currentUser || !currentUser.email) return null;

  const normalizedEmail = currentUser.email.trim().toLowerCase();
  const isDesignatedSeed = normalizedEmail === INITIAL_SUPER_ADMIN_EMAIL.trim().toLowerCase();

  try {
    const staffRef = firebase.firestore().collection('staff_users').doc(currentUser.uid);
    const docSnap = await staffRef.get();

    // Check if system already has ANY active super admin
    let hasAnySuperAdmin = false;
    try {
      const superAdminQuery = await firebase
        .firestore()
        .collection('staff_users')
        .where('role', '==', ROLES.DEVELOPER)
        .where('status', '==', 'active')
        .limit(1)
        .get();
      hasAnySuperAdmin = !superAdminQuery.empty;
    } catch (qErr) {
      console.warn('Could not query existing super admins:', qErr);
    }

    // Seed if this is the designated super admin account OR if the entire system has zero super admins
    const shouldSeedAsSuperAdmin = isDesignatedSeed || !hasAnySuperAdmin;

    if (shouldSeedAsSuperAdmin) {
      const existingData = docSnap.exists ? docSnap.data() : {};
      
      // If already correctly configured as active developer, skip write
      if (
        docSnap.exists &&
        existingData.role === ROLES.DEVELOPER &&
        existingData.status === 'active' &&
        existingData.isSuperAdmin === true
      ) {
        return existingData;
      }

      const seedPayload = {
        uid: currentUser.uid,
        email: normalizedEmail,
        displayName: currentUser.displayName || (isDesignatedSeed ? 'Muḥammed Navār' : normalizedEmail.split('@')[0]),
        role: ROLES.DEVELOPER,
        isSuperAdmin: true,
        department: 'Technical Systems / Super Admin',
        status: 'active',
        updatedAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        ...(existingData.createdAt ? {} : { createdAt: new Date().toISOString() }),
      };

      await staffRef.set(seedPayload, { merge: true });

      // Synchronize to auth_users directory
      try {
        await firebase
          .firestore()
          .collection('auth_users')
          .doc(currentUser.uid)
          .set(
            {
              uid: currentUser.uid,
              email: normalizedEmail,
              displayName: seedPayload.displayName,
              lastSeenAt: new Date().toISOString(),
            },
            { merge: true }
          );
      } catch (authErr) {
        console.warn('Could not sync to auth_users registry:', authErr);
      }

      await logAuditEvent({
        category: AUDIT_CATEGORIES.SECURITY,
        action: 'SUPER_ADMIN_SEEDED',
        severity: AUDIT_SEVERITIES.NOTICE,
        actor: {
          uid: currentUser.uid,
          email: normalizedEmail,
          displayName: seedPayload.displayName,
          role: ROLES.DEVELOPER,
        },
        target: { type: 'staff_user', id: currentUser.uid, label: seedPayload.displayName },
        changes: {
          diffSummary: `Dynamically seeded Super Admin / Developer status for ${normalizedEmail}`,
          after: seedPayload,
        },
      });

      return seedPayload;
    }

    return docSnap.exists ? docSnap.data() : null;
  } catch (err) {
    console.error('Error during dynamic super admin seeding:', err);
    return null;
  }
}

/**
 * Validates that at least one Super Admin remains active.
 *
 * @param {Array} staffList - The current active staff list
 * @param {string} targetStaffId - The ID of the staff member being modified or revoked
 * @param {string} [newRole] - The proposed new role (if updating role)
 * @returns {{ canProceed: boolean, message?: string }}
 */
export function validateSuperAdminInvariant(staffList = [], targetStaffId, newRole = null) {
  const targetMember = staffList.find((s) => s.id === targetStaffId || s.uid === targetStaffId);
  if (!targetMember) {
    return { canProceed: true };
  }

  const isTargetSuperAdmin = isSuperAdminRole(targetMember.role) || targetMember.isSuperAdmin === true;
  if (!isTargetSuperAdmin) {
    // If the target is not a Super Admin, changing or revoking them doesn't violate the invariant
    return { canProceed: true };
  }

  // Count active Super Admins in the roster
  const activeSuperAdmins = staffList.filter(
    (s) =>
      (isSuperAdminRole(s.role) || s.isSuperAdmin === true) &&
      s.status === 'active'
  );

  // If this action demotes or removes a Super Admin
  const isDemotingOrRevoking = newRole === null || !isSuperAdminRole(newRole);

  if (isDemotingOrRevoking && activeSuperAdmins.length <= 1) {
    return {
      canProceed: false,
      message:
        'Action Blocked: At least one active Super Admin / Developer is mandatory. You cannot demote or revoke the only remaining Super Admin.',
    };
  }

  return { canProceed: true };
}
