/**
 * ADSA Board Advanced Cryptographic Authentication Service
 * Utilizes standard Web Crypto API (SubtleCrypto) for zero-dependency,
 * high-performance PBKDF2-SHA256 password hashing, timing-safe verification,
 * and zero-downtime legacy credential migration.
 */

import firebase from '../firebase/config';
import { logAuditEvent, AUDIT_CATEGORIES, AUDIT_SEVERITIES } from './auditLogger';

const PBKDF2_ITERATIONS = 100000;
const KEY_LENGTH_BITS = 256;
const SALT_BYTE_LENGTH = 16;

/**
 * Generate a cryptographically secure random salt
 * @param {number} [byteLength=16]
 * @returns {string} Hex-encoded salt
 */
export function generateSalt(byteLength = SALT_BYTE_LENGTH) {
  if (typeof window === 'undefined' || !window.crypto || !window.crypto.getRandomValues) {
    // Fallback pseudo-random for non-browser edge test environments
    const chars = '0123456789abcdef';
    let res = '';
    for (let i = 0; i < byteLength * 2; i++) {
      res += chars[Math.floor(Math.random() * chars.length)];
    }
    return res;
  }
  const bytes = new Uint8Array(byteLength);
  window.crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Convert string to Uint8Array UTF-8
 */
function textToBuffer(str) {
  return new TextEncoder().encode(str);
}

/**
 * Convert ArrayBuffer to Hex string
 */
function bufferToHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Convert Hex string to Uint8Array
 */
function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

/**
 * Timing-safe string comparison to prevent timing side-channel attacks
 */
export function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

/**
 * Hash a password using PBKDF2 with SHA-256 and unique salt
 * @param {string} password - Raw password or PIN
 * @param {string} saltHex - Hex-encoded salt
 * @param {number} [iterations=100000]
 * @returns {Promise<string>} Hex-encoded derived key hash
 */
export async function hashPassword(password, saltHex, iterations = PBKDF2_ITERATIONS) {
  if (!password || !saltHex) throw new Error('Password and salt are required');

  if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
    throw new Error('Web Crypto API is not available in this environment');
  }

  const pwBuffer = textToBuffer(password);
  const saltBytes = hexToBytes(saltHex);

  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    pwBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  const derivedBits = await window.crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    KEY_LENGTH_BITS
  );

  return bufferToHex(derivedBits);
}

/**
 * Verify a candidate password against stored hash & salt
 * @param {string} candidatePassword - Raw password entered by user
 * @param {string} storedHash - Stored hex hash
 * @param {string} storedSalt - Stored hex salt
 * @param {number} [iterations=100000]
 * @returns {Promise<boolean>}
 */
export async function verifyPassword(
  candidatePassword,
  storedHash,
  storedSalt,
  iterations = PBKDF2_ITERATIONS
) {
  if (!candidatePassword || !storedHash || !storedSalt) return false;
  try {
    const computedHash = await hashPassword(candidatePassword, storedSalt, iterations);
    return timingSafeEqual(computedHash, storedHash);
  } catch (err) {
    console.error('Password verification error:', err);
    return false;
  }
}

/**
 * Check if a student document still relies on legacy plaintext password
 * @param {Object} studentData
 * @returns {boolean}
 */
export function hasLegacyPlaintextPassword(studentData) {
  return Boolean(
    studentData &&
      studentData.password &&
      (!studentData.passwordHash || !studentData.passwordSalt)
  );
}

/**
 * Zero-Downtime Migration Helper:
 * Upgrades a student's plaintext password to a salted PBKDF2 hash in Firestore
 * and removes the legacy plaintext password field.
 *
 * @param {string} docId - Student document ID
 * @param {string} plaintextPassword - Verified plaintext password
 * @param {number} [tokenNo] - Optional token number for audit logging
 */
export async function migrateStudentToSaltedHash(docId, plaintextPassword, tokenNo = null) {
  if (!docId || !plaintextPassword) return null;

  try {
    const salt = generateSalt();
    const hash = await hashPassword(plaintextPassword, salt);

    const studentsRef = firebase.firestore().collection('students');
    const studentDoc = studentsRef.doc(docId);

    // Update with secure hash & salt, and delete the plaintext field using FieldValue.delete()
    await studentDoc.update({
      passwordHash: hash,
      passwordSalt: salt,
      passwordAlgorithm: 'PBKDF2-SHA256',
      passwordIterations: PBKDF2_ITERATIONS,
      passwordMigratedAt: firebase.firestore.FieldValue.serverTimestamp(),
      password: firebase.firestore.FieldValue.delete(),
    });

    logAuditEvent({
      action: 'CREDENTIAL_AUTO_MIGRATED',
      category: AUDIT_CATEGORIES.SECURITY,
      severity: AUDIT_SEVERITIES.INFO,
      actor: {
        uid: docId,
        displayName: tokenNo ? `Token #${tokenNo}` : `Student ${docId}`,
        role: 'student',
      },
      details: {
        algorithm: 'PBKDF2-SHA256',
        iterations: PBKDF2_ITERATIONS,
      },
    }).catch(() => {});

    return { hash, salt };
  } catch (err) {
    console.error('Error auto-migrating student password to PBKDF2:', err);
    return null;
  }
}
