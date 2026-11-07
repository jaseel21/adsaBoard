/**
 * ADSA Board Passkey (WebAuthn / FIDO2) Service
 * Implements W3C Web Authentication Level 2/3 standards.
 * Supports:
 * 1. Platform Authenticators (Touch ID, Face ID, Windows Hello, Android Biometrics)
 * 2. External Hardware Keys (YubiKey, Feitian, Titan)
 * 3. Cross-Device Hybrid Transport (Scanning QR code on Dars Lab PC with Personal Phone)
 */

import { logAuditEvent, AUDIT_CATEGORIES, AUDIT_SEVERITIES } from './auditLogger';

/**
 * ArrayBuffer to Base64URL string
 */
export function bufferToBase64URL(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Base64URL string to ArrayBuffer
 */
export function base64URLToBuffer(base64url) {
  const padding = '='.repeat((4 - (base64url.length % 4)) % 4);
  const base64 = (base64url + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer;
}

/**
 * Check if the current browser environment supports WebAuthn / Passkeys
 */
export function isPasskeySupported() {
  return (
    typeof window !== 'undefined' &&
    window.PublicKeyCredential !== undefined &&
    typeof window.PublicKeyCredential === 'function' &&
    navigator.credentials !== undefined &&
    typeof navigator.credentials.create === 'function' &&
    typeof navigator.credentials.get === 'function'
  );
}

/**
 * Check if the device has a built-in platform biometric authenticator
 * (Touch ID, Face ID, Windows Hello, Android Fingerprint)
 */
export async function isPlatformAuthenticatorAvailable() {
  if (!isPasskeySupported()) return false;
  try {
    if (typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function') {
      return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    }
  } catch (_) {}
  return false;
}

/**
 * Check if Conditional UI (Autofill Passkeys in login input) is supported
 */
export async function isConditionalMediationAvailable() {
  if (!isPasskeySupported()) return false;
  try {
    if (typeof window.PublicKeyCredential.isConditionalMediationAvailable === 'function') {
      return await window.PublicKeyCredential.isConditionalMediationAvailable();
    }
  } catch (_) {}
  return false;
}

/**
 * Generate a random 32-byte cryptographic challenge
 */
export function generateChallenge() {
  const bytes = new Uint8Array(32);
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    window.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 32; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return bytes;
}

/**
 * Register a new Passkey credential
 * @param {Object} params
 * @param {string} params.userId - Unique identifier (string or token)
 * @param {string} params.userName - Token No, username, or email
 * @param {string} [params.userDisplayName] - Full display name
 * @param {string} [params.authenticatorAttachment] - 'platform' for device biometrics, or undefined for any/cross-device
 * @returns {Promise<Object>} Formatted credential record ready to save in Firestore
 */
export async function registerPasskey({
  userId,
  userName,
  userDisplayName,
  authenticatorAttachment,
}) {
  if (!isPasskeySupported()) {
    throw new Error('Passkeys are not supported on this browser or platform');
  }

  const challenge = generateChallenge();
  const enc = new TextEncoder();
  const userHandleBuffer = enc.encode(String(userId));

  // Determine relying party origin
  const rpName = 'ADSA Dining Board';
  const rpId = typeof window !== 'undefined' && window.location ? window.location.hostname : 'localhost';

  const publicKeyCredentialCreationOptions = {
    challenge,
    rp: {
      name: rpName,
      id: rpId === 'localhost' ? undefined : rpId,
    },
    user: {
      id: userHandleBuffer,
      name: String(userName),
      displayName: String(userDisplayName || userName),
    },
    pubKeyCredParams: [
      { alg: -7, type: 'public-key' }, // ES256 (ECDSA w/ SHA-256 - most common on iOS/Android/Mac)
      { alg: -257, type: 'public-key' }, // RS256 (RSA w/ SHA-256 - common on Windows Hello)
    ],
    timeout: 60000,
    attestation: 'none',
    authenticatorSelection: {
      userVerification: 'preferred',
      residentKey: 'preferred',
      requireResidentKey: false,
      ...(authenticatorAttachment ? { authenticatorAttachment } : {}),
    },
  };

  const credential = await navigator.credentials.create({
    publicKey: publicKeyCredentialCreationOptions,
  });

  if (!credential) {
    throw new Error('Credential creation was cancelled or timed out');
  }

  // Extract transports if provided by authenticator
  const transports =
    typeof credential.response.getTransports === 'function'
      ? credential.response.getTransports()
      : ['internal', 'hybrid'];

  const record = {
    id: credential.id,
    rawId: bufferToBase64URL(credential.rawId),
    type: credential.type,
    transports,
    createdAt: new Date().toISOString(),
    lastUsedAt: new Date().toISOString(),
    clientDataJSON: bufferToBase64URL(credential.response.clientDataJSON),
    attestationObject: bufferToBase64URL(credential.response.attestationObject),
  };

  return record;
}

/**
 * Authenticate with an existing Passkey
 * @param {Object} options
 * @param {Array<Object>} [options.allowCredentials] - Optional list of registered credential IDs
 * @param {boolean} [options.mediationConditional=false] - For autofill
 * @returns {Promise<Object>} Authentication assertion
 */
export async function authenticateWithPasskey({
  allowCredentials = [],
  mediationConditional = false,
} = {}) {
  if (!isPasskeySupported()) {
    throw new Error('Passkeys are not supported on this browser or platform');
  }

  const challenge = generateChallenge();
  const rpId = typeof window !== 'undefined' && window.location ? window.location.hostname : 'localhost';

  const publicKeyCredentialRequestOptions = {
    challenge,
    rpId: rpId === 'localhost' ? undefined : rpId,
    timeout: 60000,
    userVerification: 'preferred',
  };

  if (allowCredentials && allowCredentials.length > 0) {
    publicKeyCredentialRequestOptions.allowCredentials = allowCredentials.map((cred) => ({
      id: typeof cred === 'string' ? base64URLToBuffer(cred) : base64URLToBuffer(cred.id || cred.rawId),
      type: 'public-key',
      transports: cred.transports || ['internal', 'hybrid', 'usb', 'nfc'],
    }));
  }

  const getOptions = {
    publicKey: publicKeyCredentialRequestOptions,
  };

  if (mediationConditional) {
    getOptions.mediation = 'conditional';
  }

  const assertion = await navigator.credentials.get(getOptions);

  if (!assertion) {
    throw new Error('Authentication was cancelled or failed');
  }

  return {
    id: assertion.id,
    rawId: bufferToBase64URL(assertion.rawId),
    type: assertion.type,
    response: {
      authenticatorData: bufferToBase64URL(assertion.response.authenticatorData),
      clientDataJSON: bufferToBase64URL(assertion.response.clientDataJSON),
      signature: bufferToBase64URL(assertion.response.signature),
      userHandle: assertion.response.userHandle
        ? bufferToBase64URL(assertion.response.userHandle)
        : null,
    },
  };
}
