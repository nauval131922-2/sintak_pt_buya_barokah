import { timingSafeEqual } from 'crypto';

/** Bandingkan bearer token secara timing-safe. Return false bila env kosong. */
export function verifyBearerToken(authHeader: string | null, secret: string | undefined): boolean {
  if (!secret || !authHeader) return false;
  const expected = `Bearer ${secret}`;
  const a = Buffer.from(authHeader);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

