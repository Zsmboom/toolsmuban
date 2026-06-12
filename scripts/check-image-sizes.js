#!/usr/bin/env node

/**
 * Image Size Checker
 *
 * Checks the file sizes of all OG images and provides optimization recommendations
 */

const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '../public');

// Images to check
const OG_IMAGES = [
  'og-image',
  'og-pricing',
  'og-about',
  'og-blog',
];

// Thresholds
const THRESHOLDS = {
  webp: 50 * 1024, // 50 KB
  png: 100 * 1024, // 100 KB
};

function formatSize(bytes) {
  return `${(bytes / 1024).toFixed(2)} KB`;
}

function checkImage(name) {
  const webpPath = path.join(publicDir, `${name}.webp`);
  const pngPath = path.join(publicDir, `${name}.png`);

  const result = {
    name,
    webp: { exists: false, size: 0, path: webpPath },
    png: { exists: false, size: 0, path: pngPath },
  };

  // Check WebP
  if (fs.existsSync(webpPath)) {
    result.webp.exists = true;
    result.webp.size = fs.statSync(webpPath).size;
  }

  // Check PNG
  if (fs.existsSync(pngPath)) {
    result.png.exists = true;
    result.png.size = fs.statSync(pngPath).size;
  }

  return result;
}

function main() {
  console.log('🔍 Checking OG Image Sizes\n');
  console.log('='.repeat(70));

  let totalWebpSize = 0;
  let totalPngSize = 0;
  let issues = [];
  let existingCount = 0;

  for (const imageName of OG_IMAGES) {
    const result = checkImage(imageName);

    console.log(`\n📸 ${imageName}`);

    // WebP
    if (result.webp.exists) {
      const status = result.webp.size <= THRESHOLDS.webp ? '✅' : '⚠️';
      console.log(`  ${status} WebP: ${formatSize(result.webp.size)}`);
      if (result.webp.size > THRESHOLDS.webp) {
        issues.push(`${imageName}.webp is larger than recommended (${formatSize(result.webp.size)} > ${formatSize(THRESHOLDS.webp)})`);
      }
      totalWebpSize += result.webp.size;
      existingCount++;
    } else {
      console.log(`  ❌ WebP: Not found`);
      issues.push(`${imageName}.webp is missing`);
    }

    // PNG
    if (result.png.exists) {
      const status = result.png.size <= THRESHOLDS.png ? '✅' : '⚠️';
      console.log(`  ${status} PNG:  ${formatSize(result.png.size)}`);
      if (result.png.size > THRESHOLDS.png) {
        issues.push(`${imageName}.png is larger than recommended (${formatSize(result.png.size)} > ${formatSize(THRESHOLDS.png)})`);
      }
      totalPngSize += result.png.size;
    } else {
      console.log(`  ❌ PNG:  Not found`);
      issues.push(`${imageName}.png is missing`);
    }

    // Savings
    if (result.webp.exists && result.png.exists) {
      const savings = ((1 - result.webp.size / result.png.size) * 100).toFixed(1);
      console.log(`  💰 Savings: ${savings}% (WebP vs PNG)`);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 Summary\n');
  console.log(`Images found:  ${existingCount}/${OG_IMAGES.length * 2} (WebP + PNG)`);
  console.log(`Total WebP:    ${formatSize(totalWebpSize)}`);
  console.log(`Total PNG:     ${formatSize(totalPngSize)}`);

  if (totalWebpSize && totalPngSize) {
    const totalSavings = formatSize(totalPngSize - totalWebpSize);
    const percentSavings = ((1 - totalWebpSize / totalPngSize) * 100).toFixed(1);
    console.log(`Total savings: ${totalSavings} (${percentSavings}%)`);
  }

  // Issues
  if (issues.length > 0) {
    console.log('\n⚠️  Issues found:');
    issues.forEach((issue, index) => {
      console.log(`  ${index + 1}. ${issue}`);
    });
    console.log('\n💡 Run "npm run images:optimize" to fix these issues');
  } else if (existingCount === OG_IMAGES.length * 2) {
    console.log('\n✅ All images are optimized!');
  } else {
    console.log('\n⚠️  Some images are missing.');
    console.log('💡 Run "npm run images:optimize" to generate them');
  }

  console.log('='.repeat(70));
}

main();
