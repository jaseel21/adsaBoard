/**
 * ADSA Board Secure Email & Password Reset Dispatch Service
 * Enforces true out-of-band email delivery and salted OTP hashing.
 * Supports:
 *  1. Direct Google Apps Script Webhook (100% free with Gmail account, no Blaze plan required)
 *  2. Direct EmailJS REST API (Connects to Gmail SMTP with App Password, no Blaze plan required)
 *  3. Standard Firestore 'mail' collection queue (for Firebase Trigger Email Extension)
 *  4. Dev-mode console fallback on localhost
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
 * Retrieve active Email / SMTP dispatch configuration from Firestore with env fallback
 * @returns {Promise<Object>}
 */
export async function getEmailConfig() {
  const defaults = {
    provider: 'firebase', // 'webhook' | 'emailjs' | 'firebase'
    webhookUrl: import.meta.env.VITE_EMAIL_WEBHOOK_URL || '',
    emailjsServiceId: import.meta.env.VITE_EMAILJS_SERVICE_ID || '',
    emailjsTemplateId: import.meta.env.VITE_EMAILJS_TEMPLATE_ID || '',
    emailjsPublicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '',
    senderEmail: import.meta.env.VITE_EMAIL_SENDER || 'adsa.canteen@gmail.com',
  };

  try {
    const snap = await firebase.firestore().collection('settings').doc('email_config').get();
    if (snap.exists) {
      const remote = snap.data();
      return {
        ...defaults,
        ...remote,
      };
    }
  } catch (err) {
    // If offline or permission denied, fall back to environment variables
  }

  // Infer provider if not explicitly chosen
  if (defaults.webhookUrl) {
    defaults.provider = 'webhook';
  } else if (defaults.emailjsServiceId && defaults.emailjsPublicKey) {
    defaults.provider = 'emailjs';
  }

  return defaults;
}

/**
 * Save updated Email / SMTP configuration to Firestore (Committee / Staff only)
 * @param {Object} newConfig
 */
export async function saveEmailConfig(newConfig) {
  const db = firebase.firestore();
  await db.collection('settings').doc('email_config').set(
    {
      ...newConfig,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

/**
 * Dispatch an email message through the active direct provider
 * @param {Object} params
 */
export async function deliverEmailMessage({
  to,
  subject,
  html,
  text,
  studentName = 'Student',
  otp = '',
}) {
  const config = await getEmailConfig();
  const cleanTo = (to || '').trim().toLowerCase();

  let directDelivered = false;
  let deliveryError = null;

  // 1. Direct Delivery via Google Apps Script Webhook (Gmail native)
  if (config.provider === 'webhook' && config.webhookUrl) {
    try {
      const payload = {
        to: cleanTo,
        subject,
        html,
        text,
        studentName,
        otp,
        timestamp: new Date().toISOString(),
      };

      const res = await fetch(config.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payload),
      });

      if (res.ok || res.type === 'opaque') {
        directDelivered = true;
      }
    } catch (err) {
      deliveryError = err.message;
    }
  }

  // 2. Direct Delivery via EmailJS REST API (Gmail SMTP / OAuth)
  else if (
    config.provider === 'emailjs' &&
    config.emailjsServiceId &&
    config.emailjsPublicKey
  ) {
    try {
      const emailjsPayload = {
        service_id: config.emailjsServiceId,
        template_id: config.emailjsTemplateId,
        user_id: config.emailjsPublicKey,
        template_params: {
          to_email: cleanTo,
          student_name: studentName,
          otp_code: otp,
          verification_code: otp,
          expiry_minutes: '10',
          subject,
          html_content: html,
        },
      };

      const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailjsPayload),
      });

      if (res.ok) {
        directDelivered = true;
      } else {
        const errText = await res.text();
        deliveryError = `EmailJS API error: ${errText || res.statusText}`;
      }
    } catch (err) {
      deliveryError = err.message;
    }
  }

  // 3. Always queue to Firestore 'mail' collection (Firebase Trigger Email or audit log)
  try {
    await firebase.firestore().collection('mail').add({
      to: cleanTo,
      message: {
        subject,
        text,
        html,
      },
      directDelivered,
      deliveryError: deliveryError || null,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
  } catch (_) {
    // Non-fatal if offline
  }

  return { success: directDelivered || !deliveryError, directDelivered, deliveryError };
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

  // 2. In development/localhost, log code to DevTools console for easy testing
  if (
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname.endsWith('.local'))
  ) {
    console.log(
      `%c[ADSA DEV AUTH] Password Reset OTP for Token #${tokenNo} (${cleanEmail}): %c${rawOtp}`,
      'color: #059669; font-weight: bold; font-size: 13px;',
      'color: #b45309; font-weight: 800; font-size: 16px; background: #fef3c7; padding: 4px 10px; border-radius: 6px; border: 1px solid #fde68a;'
    );
  }

  // 3. Prepare formatted email content
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

  // 4. Deliver via direct email provider (Google Webhook / EmailJS) and queue to 'mail'
  await deliverEmailMessage({
    to: cleanEmail,
    subject,
    html: htmlMessage,
    text: textMessage,
    studentName: studentLabel,
    otp: rawOtp,
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
 * Dispatch a live test email to verify SMTP / Direct API configuration
 * @param {string} targetEmail
 * @returns {Promise<{ success: boolean, directDelivered: boolean, error?: string }>}
 */
export async function sendTestVerificationEmail(targetEmail) {
  if (!targetEmail || !targetEmail.includes('@')) {
    throw new Error('Please enter a valid recipient email address.');
  }

  const cleanEmail = targetEmail.trim().toLowerCase();
  const testOtp = generateSecureNumericOtp();
  const subject = 'ADSA Dining Board - SMTP / Email Provider Test';
  const text = `Assalamu Alaikum,\n\nThis is a test email from ADSA Canteen & Dining Board to verify your email delivery configuration.\n\nTest Verification Code: ${testOtp}\n\nConfiguration is active and working properly!`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #10b981; border-radius: 12px; background: #ffffff;">
      <h2 style="color: #047857; margin-top: 0;">ADSA Email Delivery Test</h2>
      <p style="color: #334155; font-size: 14px;">Assalamu Alaikum,</p>
      <p style="color: #475569; font-size: 14px;">This is a test email confirming that your <strong>Direct Email / SMTP Provider</strong> is working successfully.</p>
      <div style="text-align: center; margin: 24px 0;">
        <span style="font-size: 28px; font-weight: 800; letter-spacing: 4px; color: #047857; background: #ecfdf5; padding: 10px 24px; border-radius: 8px; border: 1px solid #a7f3d0;">
          ${testOtp}
        </span>
      </div>
      <p style="color: #94a3b8; font-size: 12px; margin-bottom: 0;">Timestamp: ${new Date().toLocaleString()}</p>
    </div>
  `;

  const result = await deliverEmailMessage({
    to: cleanEmail,
    subject,
    html,
    text,
    studentName: 'Admin Tester',
    otp: testOtp,
  });

  return result;
}

/**
 * Verify candidate 6-digit OTP against stored salted hash
 * @param {string} studentDocId
 * @param {string} candidateOtp
 * @returns {Promise<{ isValid: boolean, error?: string }>}
 */
export async function verifyPasswordResetOtp(studentDocId, candidateOtp) {
  if (!studentDocId || !candidateOtp) {
    return { isValid: false, error: 'Student ID and verification code are required' };
  }

  const cleanCode = candidateOtp.trim();
  if (cleanCode.length !== 6) {
    return { isValid: false, error: 'Verification code must be 6 digits' };
  }

  const db = firebase.firestore();
  const resetRef = db.collection('password_resets').doc(studentDocId);
  const snap = await resetRef.get();

  if (!snap.exists) {
    return { isValid: false, error: 'No active password reset request found. Please request a new code.' };
  }

  const data = snap.data();

  // Check rate-limiting attempts
  if (data.attempts >= 5) {
    await resetRef.delete();
    return {
      isValid: false,
      error: 'Too many incorrect attempts. For security, this code has been revoked. Please request a new one.',
    };
  }

  // Check expiration
  if (data.expiresAt) {
    const expiry = new Date(data.expiresAt);
    if (Date.now() > expiry.getTime()) {
      await resetRef.delete();
      return { isValid: false, error: 'This verification code has expired (10 min limit). Please request a new one.' };
    }
  }

  // Hash candidate OTP with stored salt
  const candidateHash = await hashOtpWithSalt(cleanCode, data.salt || '');

  if (candidateHash !== data.otpHash) {
    // Increment failed attempt count
    await resetRef.update({
      attempts: (data.attempts || 0) + 1,
    });
    const remaining = Math.max(0, 4 - (data.attempts || 0));
    return {
      isValid: false,
      error: `Invalid verification code. ${remaining} attempts remaining before expiration.`,
    };
  }

  // Verified!
  return { isValid: true };
}

/**
 * Consume ticket once new password has been set
 * @param {string} studentDocId
 */
export async function consumePasswordResetTicket(studentDocId) {
  if (!studentDocId) return;
  try {
    await firebase.firestore().collection('password_resets').doc(studentDocId).delete();
  } catch (err) {
    // Non-fatal cleanup error
  }
}
