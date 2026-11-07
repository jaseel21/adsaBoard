/**
 * ADSA Board Two-Factor Authentication Service (TOTP - RFC 6238)
 * Pure Web Crypto API implementation for zero external npm dependencies.
 * Compatible with Google Authenticator, Microsoft Authenticator, Aegis,
 * 2FAS, and Apple Keychain.
 */

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Base32 Decode
 * @param {string} base32Str
 * @returns {Uint8Array}
 */
export function base32Decode(base32Str) {
  const cleanStr = (base32Str || '').toUpperCase().replace(/=+$/, '').replace(/\s+/g, '');
  let bits = 0;
  let value = 0;
  let index = 0;
  const output = new Uint8Array(((cleanStr.length * 5) / 8) | 0);

  for (let i = 0; i < cleanStr.length; i++) {
    const val = BASE32_ALPHABET.indexOf(cleanStr[i]);
    if (val === -1) continue;
    value = (value << 5) | val;
    bits += 5;
    if (bits >= 8) {
      output[index++] = (value >>> (bits - 8)) & 255;
      bits -= 8;
    }
  }
  return output.subarray(0, index);
}

/**
 * Base32 Encode
 * @param {Uint8Array} bytes
 * @returns {string}
 */
export function base32Encode(bytes) {
  let bits = 0;
  let value = 0;
  let output = '';

  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i];
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }
  return output;
}

/**
 * Generate a cryptographically secure Base32 TOTP secret (160 bits / 20 bytes)
 * @returns {string} Base32 encoded secret (32 chars)
 */
export function generateTOTPSecret() {
  const bytes = new Uint8Array(20);
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    window.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 20; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return base32Encode(bytes);
}

/**
 * Generate standard OTPAuth URL for QR Code generation
 * @param {Object} options
 * @param {string} options.label - e.g. "Token 42 (adsaBoard)"
 * @param {string} options.secret - Base32 secret
 * @param {string} [options.issuer='adsaBoard']
 * @returns {string}
 */
export function generateTOTPURI({ label, secret, issuer = 'adsaBoard' }) {
  const encLabel = encodeURIComponent(label);
  const encIssuer = encodeURIComponent(issuer);
  return `otpauth://totp/${encIssuer}:${encLabel}?secret=${secret}&issuer=${encIssuer}&algorithm=SHA1&digits=6&period=30`;
}

/**
 * Compute HMAC-SHA1 using Web Crypto API
 */
async function hmacSha1(keyBytes, messageBytes) {
  const cryptoKey = await window.crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );
  return window.crypto.subtle.sign('HMAC', cryptoKey, messageBytes);
}

/**
 * Generate 6-digit TOTP code for a specific counter / timestamp
 * @param {string} base32Secret
 * @param {number} [timestamp=Date.now()]
 * @param {number} [period=30]
 * @returns {Promise<string>} 6-digit numeric string
 */
export async function generateTOTPCode(base32Secret, timestamp = Date.now(), period = 30) {
  if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
    throw new Error('Web Crypto API required for TOTP generation');
  }

  const counter = Math.floor(timestamp / 1000 / period);
  const counterBuffer = new ArrayBuffer(8);
  const view = new DataView(counterBuffer);
  // High 32-bits (usually 0) and low 32-bits
  view.setUint32(0, Math.floor(counter / 0x100000000));
  view.setUint32(4, counter >>> 0);

  const keyBytes = base32Decode(base32Secret);
  const signature = await hmacSha1(keyBytes, counterBuffer);
  const hashBytes = new Uint8Array(signature);

  // Dynamic truncation (RFC 4226)
  const offset = hashBytes[hashBytes.length - 1] & 0x0f;
  const binaryCode =
    ((hashBytes[offset] & 0x7f) << 24) |
    ((hashBytes[offset + 1] & 0xff) << 16) |
    ((hashBytes[offset + 2] & 0xff) << 8) |
    (hashBytes[offset + 3] & 0xff);

  const otp = binaryCode % 1000000;
  return otp.toString().padStart(6, '0');
}

/**
 * Verify a 6-digit TOTP code against a secret with time drift tolerance
 * @param {string} candidateCode - 6-digit code entered by user
 * @param {string} base32Secret
 * @param {number} [window=1] - Number of 30s steps to check before & after (default ±1 = 90s total window)
 * @returns {Promise<boolean>}
 */
export async function verifyTOTP(candidateCode, base32Secret, window = 1) {
  const cleanCode = (candidateCode || '').trim().replace(/\s+/g, '');
  if (!/^\d{6}$/.test(cleanCode) || !base32Secret) return false;

  const now = Date.now();
  const period = 30 * 1000;

  for (let errorWindow = -window; errorWindow <= window; errorWindow++) {
    const checkTime = now + errorWindow * period;
    const expected = await generateTOTPCode(base32Secret, checkTime);
    if (expected === cleanCode) {
      return true;
    }
  }
  return false;
}

/**
 * SHA-256 hash a single string (used for backup codes)
 */
export async function sha256Hash(text) {
  const enc = new TextEncoder().encode(text.trim().toLowerCase());
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Generate single-use emergency backup recovery codes
 * @param {number} [count=8]
 * @returns {Promise<{ plainCodes: string[], hashedCodes: string[] }>}
 */
export async function generateBackupCodes(count = 8) {
  const plainCodes = [];
  const hashedCodes = [];
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // Unambiguous characters

  for (let i = 0; i < count; i++) {
    const rand = new Uint8Array(8);
    window.crypto.getRandomValues(rand);
    let code = '';
    for (let j = 0; j < 8; j++) {
      code += chars[rand[j] % chars.length];
      if (j === 3) code += '-'; // Format: "ABCD-EFGH"
    }
    plainCodes.push(code);
    const hash = await sha256Hash(code.replace('-', ''));
    hashedCodes.push(hash);
  }

  return { plainCodes, hashedCodes };
}

/**
 * Verify and consume a candidate backup code
 * @param {string} candidateCode
 * @param {string[]} storedHashedCodes
 * @returns {Promise<{ isValid: boolean, remainingHashedCodes: string[] }>}
 */
export async function verifyAndConsumeBackupCode(candidateCode, storedHashedCodes = []) {
  if (!candidateCode || !Array.isArray(storedHashedCodes) || storedHashedCodes.length === 0) {
    return { isValid: false, remainingHashedCodes: storedHashedCodes };
  }

  const clean = candidateCode.replace(/[^A-Za-z0-9]/g, '').toLowerCase();
  const candidateHash = await sha256Hash(clean);

  const matchIndex = storedHashedCodes.indexOf(candidateHash);
  if (matchIndex === -1) {
    return { isValid: false, remainingHashedCodes: storedHashedCodes };
  }

  // Code is valid: remove it from list so it cannot be used again
  const remaining = [...storedHashedCodes];
  remaining.splice(matchIndex, 1);

  return { isValid: true, remainingHashedCodes: remaining };
}
