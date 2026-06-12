/**
 * Migration Script: Create credit accounts for existing users
 *
 * This script creates credit accounts for users who registered before
 * the credit system was implemented.
 *
 * Run with: node --loader tsx scripts/migrate-user-credits.ts
 * Or with tsx: tsx scripts/migrate-user-credits.ts
 */

import { db } from '../lib/db/index';
import { users, subscriptions, credits } from '../lib/db/schema';
import { eq, isNull } from 'drizzle-orm';
import { createUserCredits } from '../lib/db/queries';
import { PlanType } from '../lib/config/credits';

async function migrateUserCredits() {
  console.log('Starting credit account migration...\n');

  try {
    // 1. Get all users
    const allUsers = await db.select().from(users);
    console.log(`Found ${allUsers.length} total users`);

    // 2. Get users who don't have a credit account yet
    const existingCredits = await db.select({ userId: credits.userId }).from(credits);
    const existingCreditUserIds = new Set(existingCredits.map(c => c.userId));

    const usersWithoutCredits = allUsers.filter(
      user => !existingCreditUserIds.has(user.id)
    );

    console.log(`Found ${usersWithoutCredits.length} users without credit accounts\n`);

    if (usersWithoutCredits.length === 0) {
      console.log('✅ All users already have credit accounts. Migration complete!');
      return;
    }

    // 3. Create credit accounts for each user
    let successCount = 0;
    let errorCount = 0;

    for (const user of usersWithoutCredits) {
      try {
        // Get user's subscription to determine plan
        const [subscription] = await db
          .select()
          .from(subscriptions)
          .where(eq(subscriptions.userId, user.id))
          .limit(1);

        const plan: PlanType = subscription?.plan || 'free';

        // Create credit account
        await createUserCredits(user.id, plan);

        successCount++;
        console.log(`✅ Created credit account for user ${user.email} (${plan} plan)`);

      } catch (error) {
        errorCount++;
        console.error(`❌ Failed to create credit account for user ${user.email}:`, error);
      }
    }

    console.log('\n=== Migration Summary ===');
    console.log(`Total users processed: ${usersWithoutCredits.length}`);
    console.log(`Successfully created: ${successCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log('=========================\n');

    if (errorCount === 0) {
      console.log('✅ Migration completed successfully!');
    } else {
      console.log('⚠️  Migration completed with some errors. Please check the logs above.');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateUserCredits()
  .then(() => {
    console.log('\nMigration script finished.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nMigration script failed:', error);
    process.exit(1);
  });
