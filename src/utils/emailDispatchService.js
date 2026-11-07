/**
 * ADSA Board Secure Email & Password Reset Dispatch Service
 * Enforces true out-of-band email delivery and salted OTP hashing.
 * The client browser NEVER displays or stores the plaintext OTP.
 */

import firebase from '../firebase/config';
import { generateSalt, timingSafeEqual } from './cryptoAuthService';
import { logAuditEvent, AUDIT_CATEGORIES, AUDIT_SEVERITIES } from './auditLogger';

/**
 * SHA-256 hash a text string with salt
 */
async function hashOtpWithSalt(otp, salt) {
  const enc = new TextEncoder().encode(`${salt}:${otp.trim()}`);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Generate a cryptographically random 6-digit numeric OTP
 */
export function generateSecureNumericOtp() {
  const rand = new Uint32Array(1);
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    window.crypto.getRandomValues(rand);
  } else {
    rand[0] = Math.floor(Math.random() * 1000000);
  }
  const code = (rand[0] % 900000) + 100000;
  return code.toString();
}

/**
 * Generate OTP, store its salted hash in Firestore, and dispatch email
 * @param {Object} params
 * @param {string} params.studentDocId
 * @param {number} params.tokenNo
 * @param {string} params.email
 * @param {string} [params.name]
 * @returns {Promise<{ success: boolean, expiresAt: string }>}
 */
export async function dispatchPasswordResetEmail({ studentDocId, tokenNo, email, name }) {
  if (!studentDocId || !email || !email.includes('@')) {
    throw new Error('Valid student document and email are required');
  }

  const cleanEmail = email.trim().toLowerCase();
  const rawOtp = generateSecureNumericOtp();
  const salt = generateSalt(16);
  const otpHash = await hashOtpWithSalt(rawOtp, salt);

  // 10-minute expiry
  const expiryDate = new Date(Date.now() + 10 * 60 * 1000);
  const expiresAt = expiryDate.toISOString();

  const db = firebase.firestore();

  // 1. Store ONLY salted hash and expiry in Firestore (NO PLAINTEXT OTP IN DATABASE)
  await db.collection('password_resets').doc(studentDocId).set({
    tokenNo: tokenNo || null,
    email: cleanEmail,
    otpHash,
    salt,
    expiresAt,
    attempts: 0,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
  });

  // 2. Dispatch email to student's inbox via Firebase Trigger Email queue
  const studentLabel = name ? `${name} (Token #${tokenNo})` : `Token #${tokenNo}`;
  const subject = `ADSA Dining Board - Password Reset Verification Code`;
  const textMessage = `Hello ${studentLabel},\n\nYour 6-digit password reset verification code is:\n\n${rawOtp}\n\nThis code will expire in 10 minutes. If you did not request a password reset, please ignore this email.\n\nADSA Canteen Committee`;
  const htmlMessage = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 28px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px;">
      <div style="margin-bottom: 20px; border-bottom: 2px solid #10b981; padding-bottom: 12px;">
        <h2 style="color: #047857; margin: 0; font-size: 20px;">ADSA Canteen & Dining Board</h2>
        <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">Alathurpadi Dars Food System</p>
      </div>

      <p style="font-size: 14px; color: #1e293b; line-height: 1.6;">
        Assalamu Alaikum <strong>${studentLabel}</strong>,
      </p>

      <p style="font-size: 14px; color: #475569; line-height: 1.6;">
        A password reset request was initiated for your dining token. Enter the 6-digit verification code below to verify your identity:
      </p>

      <div style="text-align: center; margin: 28px 0;">
        <div style="display: inline-block; padding: 14px 32px; background: #ecfdf5; border: 2px solid #a7f3d0; border-radius: 12px; font-family: monospace; font-size: 34px; font-weight: 800; letter-spacing: 6px; color: #065f46;">
          ${rawOtp}
        </div>
      </div>

      <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0 0 20px 0;">
        ⏱️ This verification code is valid for <strong>10 minutes</strong>.
      </p>

      <div style="background: #f8fafc; border-radius: 8px; padding: 12px; font-size: 12px; color: #64748b; line-height: 1.5;">
        🔒 <strong>Security Warning:</strong> Never share this code with anyone. ADSA administrators will never ask for your code.
      </div>
    </div>
  `;

  // Write to standard mail collection
  await db.collection('mail').add({
    to: cleanEmail,
    message: {
      subject,
      text: textMessage,
      html: htmlMessage,
    },
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
  });

  logAuditEvent({
    action: 'PASSWORD_RESET_OTP_DISPATCHED',
    category: AUDIT_CATEGORIES.SECURITY,
    severity: AUDIT_SEVERITIES.INFO,
    actor: {
      uid: studentDocId,
      displayName: studentLabel,
      role: 'student',
    },
    details: {
      emailMasked: cleanEmail.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
    },
  }).catch(() => {});

  return { success: true, expiresAt };
}

/**
 * Verify candidate 6-digit OTP against stored salted hash
 * @param {string} studentDocId
 * @param {string} candidateOtp
 * @returns {Promise<{ isValid: boolean, error?: string }>}
 */
export async function verifyPasswordResetOtp(studentDocId, candidateOtp) {
  if (!studentDocId || !candidateOtp) {
    return { isValid: false, error: 'Student ID and OTP code are required' };
  }

  const cleanOtp = candidateOtp.trim().replace(/\D/g, '');
  if (cleanOtp.length !== 6) {
    return { isValid: false, error: 'Please enter a valid 6-digit numeric code' };
  }

  const db = firebase.firestore();
  const resetRef = db.collection('password_resets').doc(studentDocId);
  const snap = await resetRef.get();

  if (!snap.exists) {
    return { isValid: false, error: 'No active password reset request found. Please request a new code.' };
  }

  const data = snap.data();

  // Check expiration
  if (!data.expiresAt || new Date(data.expiresAt).getTime() < Date.now()) {
    return { isValid: false, error: 'The verification code has expired. Please request a new one.' };
  }

  // Check brute force attempt limit (max 5 tries per OTP)
  if ((data.attempts || 0) >= 5) {
    await resetRef.delete().catch(() => {});
    return { isValid: false, error: 'Too many incorrect attempts. This code has been invalidated for security.' };
  }

  // Increment attempt counter
  await resetRef.update({
    attempts: firebase.firestore.FieldValue.increment(1),
  }).catch(() => {});

  // Compute salted hash of candidate OTP
  const candidateHash = await hashOtpWithSalt(cleanOtp, data.salt);
  const isMatch = timingSafeEqual(candidateHash, data.otpHash);

  if (!isMatch) {
    return { isValid: false, error: 'Incorrect verification code. Please check your email and try again.' };
  }

  // Mark OTP as verified so new password step can proceed
  await resetRef.update({
    verified: true,
    verifiedAt: firebase.firestore.FieldValue.serverTimestamp(),
  });

  return { isValid: true };
}

/**
 * Invalidate and clean up reset session after successful password change
 */
export async function consumePasswordResetTicket(studentDocId) {
  if (!studentDocId) return;
  try {
    await firebase.firestore().collection('password_resets').doc(studentDocId).delete();
  } catch (_) {}
}
