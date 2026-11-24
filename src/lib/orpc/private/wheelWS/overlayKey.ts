// The wheel overlay runs in OBS without a login, so its link carries a key that proves it is the
// user's own: HMAC-SHA256 over the user id with the Durable Iterator signing key. Nothing is stored;
// rotating the signing key changes every key (and breaks every wheel link).

const KEY_LENGTH = 22 // base64url characters, 132 bits

const encoder = new TextEncoder()

function base64url(bytes: Uint8Array) {
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export async function wheelOverlayKey(signingKey: string, userId: number) {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(signingKey),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const mac = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(`wheel-overlay:${userId}`),
  )
  return base64url(new Uint8Array(mac)).slice(0, KEY_LENGTH)
}

/** Constant-time check of an overlay link's key. */
export async function isWheelOverlayKey(
  signingKey: string,
  userId: number,
  key: string,
) {
  const expected = encoder.encode(await wheelOverlayKey(signingKey, userId))
  const given = encoder.encode(key)
  if (given.byteLength !== expected.byteLength) return false
  let diff = 0
  for (let i = 0; i < expected.byteLength; i++) diff |= expected[i] ^ given[i]
  return diff === 0
}
