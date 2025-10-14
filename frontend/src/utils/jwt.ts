// Lightweight JWT decoding utilities (no external deps)
// - Safe base64url decode
// - Parse payload and expose common helpers like getRoles

export type JwtPayload = Record<string, any> & {
  sub?: string
  name?: string
  email?: string
  role?: string | string[]
  roles?: string[]
  exp?: number
  iat?: number
}

function base64UrlDecode(input: string): string {
  // Replace URL-safe chars
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  // Pad with '='
  const padLen = (4 - (base64.length % 4)) % 4;
  const normalized = base64 + '='.repeat(padLen);
  try {
    // atob expects standard base64 (browser only)
    return window.atob(normalized);
  } catch (e) {
    throw new Error('Invalid base64url segment');
  }
}

export function decodeJwt<T extends JwtPayload = JwtPayload>(token: string): T | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const payloadJson = base64UrlDecode(parts[1]);
    const payload = JSON.parse(decodeURIComponent(
      Array.prototype.map
        .call(payloadJson, (c: string) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    ));
    return payload as T;
  } catch (e) {
    console.warn('Failed to decode JWT:', e);
    return null;
  }
}

export function getTokenRoles(payload: JwtPayload | null): string[] {
  if (!payload) return [];
  // Common claim keys: role (ASP.NET), roles (arrays), or custom like 'permissions'
  const r: any = payload.roles ?? payload.role;
  if (!r) return [];
  if (Array.isArray(r)) return r;
  if (typeof r === 'string') return [r];
  return [];
}

export function isTokenExpired(payload: JwtPayload | null, skewSeconds = 30): boolean {
  if (!payload?.exp) return false; // if no exp, assume not expired
  const now = Math.floor(Date.now() / 1000);
  return payload.exp <= now + skewSeconds;
}
