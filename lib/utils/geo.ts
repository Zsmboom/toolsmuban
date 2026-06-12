import { headers } from 'next/headers';

/**
 * Geographic information extracted from request headers
 */
export interface GeoInfo {
  ip: string;
  country: string | null;
}

/**
 * Extract IP address and country from request headers
 * Supports various hosting providers (Vercel, Cloudflare, etc.)
 *
 * @returns GeoInfo object with IP and country information
 */
export async function getGeoInfo(): Promise<GeoInfo> {
  const headersList = await headers();

  // Extract IP address from various headers
  const ip =
    headersList.get('x-forwarded-for')?.split(',')[0].trim() ||
    headersList.get('x-real-ip') ||
    headersList.get('cf-connecting-ip') ||
    'unknown';

  // Extract country code from provider-specific headers
  const country =
    headersList.get('x-vercel-ip-country') ||
    headersList.get('cf-ipcountry') ||
    null;

  return { ip, country };
}
