#!/usr/bin/env node

/**
 * PayPal Configuration Validator
 *
 * This script checks if your PayPal environment variables are properly configured.
 * Run this script to verify your setup before testing payments.
 *
 * Usage: node scripts/verify-paypal-config.js
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const { green, red, yellow, blue, cyan, reset } = colors;

console.log(`\n${cyan}╔════════════════════════════════════════╗${reset}`);
console.log(`${cyan}║   PayPal Configuration Validator      ║${reset}`);
console.log(`${cyan}╚════════════════════════════════════════╝${reset}\n`);

// Load environment variables
const envPath = path.join(process.cwd(), '.env.local');
const envExamplePath = path.join(process.cwd(), '.env.example');

let envVars = {};

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach((line) => {
    const match = line.match(/^([^=:#]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      envVars[key] = value;
    }
  });
  console.log(`${green}✓${reset} Found .env.local file\n`);
} else {
  console.log(`${red}✗${reset} .env.local file not found`);
  console.log(`${yellow}→${reset} Please copy .env.example to .env.local and configure it\n`);
  process.exit(1);
}

// Required environment variables
const requiredVars = [
  {
    name: 'NEXT_PUBLIC_PAYPAL_CLIENT_ID',
    description: 'PayPal Client ID (public)',
    example: 'AZabc123...',
  },
  {
    name: 'PAYPAL_CLIENT_SECRET',
    description: 'PayPal Client Secret (private)',
    example: 'EXdef456...',
  },
  {
    name: 'NEXT_PUBLIC_PAYPAL_MODE',
    description: 'PayPal Mode (sandbox or live)',
    example: 'sandbox',
    validate: (value) => value === 'sandbox' || value === 'live',
  },
  {
    name: 'NEXT_PUBLIC_APP_URL',
    description: 'Your application URL',
    example: 'http://localhost:3000',
  },
];

const planVars = [
  'NEXT_PUBLIC_PAYPAL_PLAN_BASIC',
  'NEXT_PUBLIC_PAYPAL_PLAN_PRO',
  'NEXT_PUBLIC_PAYPAL_PLAN_ENTERPRISE',
];

const optionalVars = [
  {
    name: 'PAYPAL_WEBHOOK_ID',
    description: 'PayPal Webhook ID (for production)',
  },
];

// Check required variables
let hasErrors = false;
let hasWarnings = false;

console.log(`${blue}Checking Required Variables:${reset}\n`);

requiredVars.forEach((varInfo) => {
  const value = envVars[varInfo.name];

  if (!value || value === 'your-paypal-client-id' || value === 'your-paypal-secret' || value === 'your-paypal-mode') {
    console.log(`${red}✗${reset} ${varInfo.name}`);
    console.log(`  ${yellow}→${reset} ${varInfo.description}`);
    console.log(`  ${yellow}→${reset} Example: ${varInfo.example}\n`);
    hasErrors = true;
  } else if (varInfo.validate && !varInfo.validate(value)) {
    console.log(`${red}✗${reset} ${varInfo.name}`);
    console.log(`  ${yellow}→${reset} Invalid value: "${value}"`);
    console.log(`  ${yellow}→${reset} Must be: ${varInfo.example}\n`);
    hasErrors = true;
  } else {
    console.log(`${green}✓${reset} ${varInfo.name}`);
    if (varInfo.name.includes('SECRET')) {
      console.log(`  ${cyan}→${reset} ${value.substring(0, 10)}...${value.substring(value.length - 4)}\n`);
    } else {
      console.log(`  ${cyan}→${reset} ${value}\n`);
    }
  }
});

// Check plan variables
console.log(`${blue}Checking Plan Variables:${reset}\n`);

planVars.forEach((varName) => {
  const value = envVars[varName];

  if (!value || value.startsWith('P-XXX') || value === 'your-plan-id') {
    console.log(`${yellow}⚠${reset} ${varName}`);
    console.log(`  ${yellow}→${reset} Using placeholder value (OK for development)`);
    console.log(`  ${yellow}→${reset} Current value: ${value || 'not set'}\n`);
    hasWarnings = true;
  } else {
    console.log(`${green}✓${reset} ${varName}`);
    console.log(`  ${cyan}→${reset} ${value}\n`);
  }
});

// Check optional variables
console.log(`${blue}Checking Optional Variables:${reset}\n`);

optionalVars.forEach((varInfo) => {
  const value = envVars[varInfo.name];

  if (!value || value === 'your-webhook-id') {
    console.log(`${yellow}⚠${reset} ${varInfo.name}`);
    console.log(`  ${yellow}→${reset} ${varInfo.description}`);
    console.log(`  ${yellow}→${reset} Not required for development\n`);
  } else {
    console.log(`${green}✓${reset} ${varInfo.name}`);
    console.log(`  ${cyan}→${reset} ${value}\n`);
  }
});

// Summary
console.log(`${cyan}════════════════════════════════════════${reset}\n`);

if (hasErrors) {
  console.log(`${red}✗ Configuration has errors!${reset}`);
  console.log(`${yellow}→${reset} Please fix the errors above before testing PayPal integration\n`);
  process.exit(1);
} else if (hasWarnings) {
  console.log(`${yellow}⚠ Configuration has warnings${reset}`);
  console.log(`${yellow}→${reset} Your configuration will work for development`);
  console.log(`${yellow}→${reset} Update plan IDs and webhook ID before going to production\n`);
  console.log(`${green}✓ Ready for development testing!${reset}\n`);
  process.exit(0);
} else {
  console.log(`${green}✓ All configurations are valid!${reset}`);
  console.log(`${green}✓ Ready to accept PayPal payments!${reset}\n`);
  process.exit(0);
}
