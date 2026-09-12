// Confirms a POST really came from Meta. Meta signs the exact raw request body
// with our app secret; we redo that signature here and compare.
export async function isValidSignature(
  rawBody: string,
  signatureHeader: string | null,
  appSecret: string,
): Promise<boolean> {
  if (!signatureHeader) {
    return false;
  }

  const [algorithm, signatureHex] = signatureHeader.split("=");
  if (algorithm !== "sha256" || !signatureHex) {
    return false;
  }

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(appSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signatureBytes = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(rawBody),
  );

  const expectedHex = toHex(signatureBytes);
  return timingSafeEqual(expectedHex, signatureHex);
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

// A plain === comparison leaks timing information about how many characters
// matched, which is why signature checks need a constant-time compare instead.
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}
