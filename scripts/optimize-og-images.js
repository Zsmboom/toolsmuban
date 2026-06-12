#!/usr/bin/env node

/**
 * OG Image Optimizer
 *
 * This script optimizes Open Graph images for better performance:
 * - Converts images to WebP format
 * - Maintains PNG fallback for compatibility
 * - Ensures correct dimensions (1200x630px)
 * - Compresses images for optimal file size
 *
 * Usage:
 *   node scripts/optimize-og-images.js
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Configuration
const OG_WIDTH = 1200;
const OG_HEIGHT = 630;
const QUALITY = {
  webp: 85,
  png: 90,
  jpeg: 85,
};

const publicDir = path.join(__dirname, '../public');
const inputDir = path.join(publicDir, 'og-images-source'); // Place source images here
const outputDir = publicDir;

// OG images to generate
const OG_IMAGES = [
  { name: 'og-image', title: 'SaaS Template', subtitle: 'Launch Your Product 10x Faster' },
  { name: 'og-pricing', title: 'Pricing Plans', subtitle: 'Choose Your Perfect Plan' },
  { name: 'og-about', title: 'About Us', subtitle: 'Our Mission & Story' },
  { name: 'og-blog', title: 'Blog', subtitle: 'Insights & Tutorials' },
];

/**
 * Optimize a single image
 */
async function optimizeImage(inputPath, outputName) {
  try {
    const basePath = path.join(outputDir, outputName);

    console.log(`\n📸 Optimizing: ${outputName}`);

    // Read and resize image
    const image = sharp(inputPath)
      .resize(OG_WIDTH, OG_HEIGHT, {
        fit: 'cover',
        position: 'center',
      });

    // Generate WebP version (smaller file size, better compression)
    const webpPath = `${basePath}.webp`;
    await image
      .clone()
      .webp({
        quality: QUALITY.webp,
        effort: 6, // 0-6, higher = better compression but slower
      })
      .toFile(webpPath);

    const webpStats = fs.statSync(webpPath);
    console.log(`  ✅ WebP: ${(webpStats.size / 1024).toFixed(2)} KB`);

    // Generate PNG fallback (for compatibility)
    const pngPath = `${basePath}.png`;
    await image
      .clone()
      .png({
        quality: QUALITY.png,
        compressionLevel: 9,
        adaptiveFiltering: true,
      })
      .toFile(pngPath);

    const pngStats = fs.statSync(pngPath);
    console.log(`  ✅ PNG:  ${(pngStats.size / 1024).toFixed(2)} KB`);

    const savings = ((1 - webpStats.size / pngStats.size) * 100).toFixed(1);
    console.log(`  💰 WebP is ${savings}% smaller than PNG`);

    return { webpPath, pngPath, webpStats, pngStats };
  } catch (error) {
    console.error(`❌ Error optimizing ${outputName}:`, error.message);
    throw error;
  }
}

/**
 * Generate a placeholder OG image with text
 */
async function generatePlaceholder(config) {
  try {
    const { name, title, subtitle } = config;
    const outputName = name;

    console.log(`\n🎨 Generating placeholder: ${name}`);

    // Escape special characters for XML/SVG
    const escapeXml = (str) => {
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
    };

    const escapedTitle = escapeXml(title);
    const escapedSubtitle = escapeXml(subtitle);

    // Create SVG template
    const svg = `
      <svg width="${OG_WIDTH}" height="${OG_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#6366f1;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#8b5cf6;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="url(#grad)"/>
        <text x="50%" y="45%" text-anchor="middle" font-family="Arial, sans-serif" font-size="72" font-weight="bold" fill="white">${escapedTitle}</text>
        <text x="50%" y="60%" text-anchor="middle" font-family="Arial, sans-serif" font-size="36" fill="rgba(255,255,255,0.9)">${escapedSubtitle}</text>
      </svg>
    `;

    const buffer = Buffer.from(svg);
    const basePath = path.join(outputDir, outputName);

    // Generate WebP
    const webpPath = `${basePath}.webp`;
    await sharp(buffer)
      .webp({ quality: QUALITY.webp, effort: 6 })
      .toFile(webpPath);

    const webpStats = fs.statSync(webpPath);
    console.log(`  ✅ WebP: ${(webpStats.size / 1024).toFixed(2)} KB`);

    // Generate PNG
    const pngPath = `${basePath}.png`;
    await sharp(buffer)
      .png({ quality: QUALITY.png, compressionLevel: 9 })
      .toFile(pngPath);

    const pngStats = fs.statSync(pngPath);
    console.log(`  ✅ PNG:  ${(pngStats.size / 1024).toFixed(2)} KB`);

    return { webpPath, pngPath };
  } catch (error) {
    console.error(`❌ Error generating ${config.name}:`, error.message);
    throw error;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Starting OG Image Optimization\n');
  console.log(`📁 Output directory: ${outputDir}\n`);

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  let totalWebpSize = 0;
  let totalPngSize = 0;
  let processedCount = 0;

  // Check if source directory exists
  if (fs.existsSync(inputDir)) {
    console.log('📂 Processing source images...\n');

    const files = fs.readdirSync(inputDir);
    for (const file of files) {
      if (!/\.(png|jpg|jpeg)$/i.test(file)) continue;

      const inputPath = path.join(inputDir, file);
      const outputName = path.basename(file, path.extname(file));

      const result = await optimizeImage(inputPath, outputName);
      totalWebpSize += result.webpStats.size;
      totalPngSize += result.pngStats.size;
      processedCount++;
    }
  } else {
    console.log('📝 No source images found. Generating placeholders...\n');

    // Generate placeholders for each OG image
    for (const config of OG_IMAGES) {
      const result = await generatePlaceholder(config);
      const webpStats = fs.statSync(result.webpPath);
      const pngStats = fs.statSync(result.pngPath);
      totalWebpSize += webpStats.size;
      totalPngSize += pngStats.size;
      processedCount++;
    }
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('✅ Optimization Complete!\n');
  console.log(`📊 Summary:`);
  console.log(`   Images processed: ${processedCount}`);
  console.log(`   Total WebP size: ${(totalWebpSize / 1024).toFixed(2)} KB`);
  console.log(`   Total PNG size:  ${(totalPngSize / 1024).toFixed(2)} KB`);
  console.log(`   Total savings:   ${((totalPngSize - totalWebpSize) / 1024).toFixed(2)} KB (${((1 - totalWebpSize / totalPngSize) * 100).toFixed(1)}%)`);
  console.log('='.repeat(50));

  console.log('\n💡 Next steps:');
  console.log('   1. Review generated images in /public');
  console.log('   2. Update metadata to use WebP with PNG fallback');
  console.log('   3. Test OG images with social media preview tools');
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { optimizeImage, generatePlaceholder };
