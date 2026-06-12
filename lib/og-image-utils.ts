/**
 * OG Image Utilities
 *
 * Helper functions for optimized Open Graph images with WebP support
 */

/**
 * Get optimized OG image configuration with WebP and PNG fallback
 *
 * @param imageName - Name of the image (without extension)
 * @param alt - Alt text for the image
 * @returns OpenGraph images configuration with WebP priority
 */
export function getOptimizedOgImage(
  imageName: string,
  alt: string = 'Open Graph Image'
) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://yourdomain.com';

  return [
    {
      url: `${baseUrl}/${imageName}.webp`,
      width: 1200,
      height: 630,
      alt,
      type: 'image/webp',
    },
    {
      url: `${baseUrl}/${imageName}.png`,
      width: 1200,
      height: 630,
      alt,
      type: 'image/png',
    },
  ];
}

/**
 * Get Twitter card images with WebP support
 * Twitter supports WebP since 2019
 *
 * @param imageName - Name of the image (without extension)
 * @returns Array of image URLs (WebP preferred)
 */
export function getOptimizedTwitterImage(imageName: string): string[] {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://yourdomain.com';

  return [
    `${baseUrl}/${imageName}.webp`,
    `${baseUrl}/${imageName}.png`, // Fallback
  ];
}

/**
 * Complete OG metadata with optimized images
 *
 * @example
 * ```ts
 * export const metadata = {
 *   ...getOptimizedOgMetadata({
 *     title: 'My Page',
 *     description: 'Page description',
 *     image: 'og-image',
 *     url: '/page'
 *   })
 * };
 * ```
 */
export function getOptimizedOgMetadata(config: {
  title: string;
  description: string;
  image: string;
  imageAlt?: string;
  url?: string;
  type?: 'website' | 'article';
}) {
  const {
    title,
    description,
    image,
    imageAlt = title,
    url = '',
    type = 'website',
  } = config;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://yourdomain.com';

  return {
    openGraph: {
      title,
      description,
      type,
      url: url ? `${baseUrl}${url}` : baseUrl,
      images: getOptimizedOgImage(image, imageAlt),
    },
    twitter: {
      card: 'summary_large_image' as const,
      title,
      description,
      images: getOptimizedTwitterImage(image),
    },
  };
}

/**
 * Image optimization stats
 * Average file size reduction when using WebP vs PNG
 */
export const IMAGE_OPTIMIZATION_STATS = {
  averageSavings: '25-35%',
  webpSupport: '96%+', // Browser support as of 2024
  fallbackStrategy: 'Multiple images with type specification',
};
