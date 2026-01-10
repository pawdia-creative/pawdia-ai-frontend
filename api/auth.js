// Authentication utilities for Pawdia AI API

// Secure password hashing using PBKDF2 with Web Crypto API
export async function hashPassword(password) {
  // Generate a random salt for each password
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const encoder = new TextEncoder();

  // PBKDF2 parameters
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000, // High iteration count for security
      hash: 'SHA-256'
    },
    keyMaterial,
    256 // 256 bits = 32 bytes
  );

  // Combine salt and hash
  const hashArray = new Uint8Array(salt.length + derivedBits.byteLength);
  hashArray.set(salt);
  hashArray.set(new Uint8Array(derivedBits), salt.length);

  // Return format: $pbkdf2-sha256$iterations$salt$hash
  const saltBase64 = btoa(String.fromCharCode(...salt));
  const hashBase64 = btoa(String.fromCharCode(...new Uint8Array(derivedBits)));

  return `$pbkdf2-sha256$100000$${saltBase64}$${hashBase64}`;
}

export async function verifyPassword(password, hash) {
  try {
    // Parse the hash format: $pbkdf2-sha256$iterations$salt$hash
    const parts = hash.split('$');
    if (parts.length !== 5 || parts[1] !== 'pbkdf2-sha256') {
      // Legacy SHA-256 hash support for backward compatibility
      if (hash.match(/^[a-f0-9]{64}$/)) {
        const hashedPassword = await hashLegacyPassword(password);
        return hashedPassword === hash;
      }
      return false;
    }

    const iterations = parseInt(parts[2], 10);
    const salt = new Uint8Array(atob(parts[3]).split('').map(c => c.charCodeAt(0)));
    const expectedHash = new Uint8Array(atob(parts[4]).split('').map(c => c.charCodeAt(0)));

    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits']
    );

    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: iterations,
        hash: 'SHA-256'
      },
      keyMaterial,
      256
    );

    const derivedArray = new Uint8Array(derivedBits);

    // Constant-time comparison to prevent timing attacks
    if (derivedArray.length !== expectedHash.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < derivedArray.length; i++) {
      result |= derivedArray[i] ^ expectedHash[i];
    }

    return result === 0;
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}

// Legacy SHA-256 hash function for backward compatibility during migration
async function hashLegacyPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'pawdia-salt'); // Add salt
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// JWT helpers using Web Crypto
// Use `jose` library for robust JWT operations in Workers
import { SignJWT, jwtVerify } from 'jose';

/**
 * signJwt - create a signed JWT using HMAC SHA-256 via `jose`
 * @param payload - object payload to include in the JWT
 * @param secret - HMAC secret string
 * @param expiresInSeconds - expiration time in seconds
 * @returns signed JWT string
 */
export async function signJwt(payload, secret, expiresInSeconds = 7 * 24 * 3600) {
  if (!secret) throw new Error('JWT secret required for signing');
  const alg = 'HS256';
  const now = Math.floor(Date.now() / 1000);
  const key = new TextEncoder().encode(secret);
  const jwt = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg })
    .setIssuedAt(now)
    .setExpirationTime(now + expiresInSeconds)
    .sign(key);
  return jwt;
}

/**
 * verifyJwt - verify JWT and return payload or null if invalid/expired
 */
export async function verifyJwt(token, secret) {
  try {
    if (!secret) return null;
    const key = new TextEncoder().encode(secret);
    const { payload } = await jwtVerify(token, key);
    // `payload` is a JWTPayload (object); ensure exp check passed by jwtVerify
    return payload;
  } catch (err) {
    return null;
  }
}

function base64UrlDecode(str) {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad = base64.length % 4;
  const padded = pad ? base64 + '='.repeat(4 - pad) : base64;
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function getPayloadFromHeader(authHeader, env) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.slice(7);
  return await verifyJwt(token, env.JWT_SECRET);
}
