export async function stringToNumber(str: string | number) {

  if (typeof str === 'number') {
    return str
  }

  const data = new TextEncoder().encode(str)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = new Uint8Array(hashBuffer)

  let hash64 = 0n
  for (let i = 0; i < 8; i++) {
    hash64 = (hash64 << 8n) + BigInt(hashArray[i])
  }
  return Number(hash64 % 9007199254740991n)
}
