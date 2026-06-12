import { auth } from "@/lib/auth/config";
import { Card } from "@/components/ui/card";
import { StatsCard } from "@/components/dashboard/stats-card";
import { Users, DollarSign, Activity, TrendingUp } from "lucide-react";
import {
  getTotalUsers,
  getActiveSubscriptionsCount,
  getTotalRevenue,
  getTotalToolUsage,
} from "@/lib/db/queries";
import { getTranslations } from 'next-intl/server';
import Link from "next/link";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ locale: string }>;
};

export const metadata: Metadata = {
  title: 'Admin Dashboard',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminPage({ params }: Props) {
  const { locale } = await params;

  const session = await auth();
  const t = await getTranslations('adminPage');

  // Fetch admin stats
  const [totalUsers, activeSubscriptions, totalRevenue, totalUsage] =
    await Promise.all([
      getTotalUsers(),
      getActiveSubscriptionsCount(),
      getTotalRevenue(),
      getTotalToolUsage(),
    ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">
          {t('title', { defaultValue: 'Admin Dashboard' })}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {t('subtitle', { defaultValue: 'Overview of your SaaS platform' })}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title={t('stats.totalUsers', { defaultValue: 'Total Users' })}
          value={totalUsers}
          description={t('stats.registeredAccounts', { defaultValue: 'Registered accounts' })}
          icon={Users}
          trend={{ value: 12, isPositive: true }}
        />
        <StatsCard
          title={t('stats.activeSubscriptions', { defaultValue: 'Active Subscriptions' })}
          value={activeSubscriptions}
          description={t('stats.payingCustomers', { defaultValue: 'Paying customers' })}
          icon={TrendingUp}
          trend={{ value: 8, isPositive: true }}
        />
        <StatsCard
          title={t('stats.totalRevenue', { defaultValue: 'Total Revenue' })}
          value={`$${(totalRevenue / 100).toFixed(2)}`}
          description={t('stats.allTime', { defaultValue: 'All time' })}
          icon={DollarSign}
          trend={{ value: 15, isPositive: true }}
        />
        <StatsCard
          title={t('stats.toolUsage', { defaultValue: 'Tool Usage' })}
          value={totalUsage}
          description={t('stats.totalApiCalls', { defaultValue: 'Total API calls' })}
          icon={Activity}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <h3 className="text-lg font-semibold">
            {t('quickActions.title', { defaultValue: 'Quick Actions' })}
          </h3>
          <div className="mt-4 space-y-2">
            <Link
              href="/admin/users"
              className="block rounded-lg border p-4 transition-colors hover:bg-muted"
            >
              <p className="font-medium">
                {t('quickActions.manageUsers.title', { defaultValue: 'Manage Users' })}
              </p>
              <p className="text-sm text-muted-foreground">
                {t('quickActions.manageUsers.description', { defaultValue: 'View and manage user accounts' })}
              </p>
            </Link>
            <Link
              href="/admin/subscriptions"
              className="block rounded-lg border p-4 transition-colors hover:bg-muted"
            >
              <p className="font-medium">
                {t('quickActions.manageSubscriptions.title', { defaultValue: 'Manage Subscriptions' })}
              </p>
              <p className="text-sm text-muted-foreground">
                {t('quickActions.manageSubscriptions.description', { defaultValue: 'View subscription details' })}
              </p>
            </Link>
            <Link
              href="/admin/logs"
              className="block rounded-lg border p-4 transition-colors hover:bg-muted"
            >
              <p className="font-medium">
                {t('quickActions.viewLogs.title', { defaultValue: 'View Logs' })}
              </p>
              <p className="text-sm text-muted-foreground">
                {t('quickActions.viewLogs.description', { defaultValue: 'System logs and activity' })}
              </p>
            </Link>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold">
            {t('recentActivity.title', { defaultValue: 'Recent Activity' })}
          </h3>
          <div className="mt-4">
            <p className="text-sm text-muted-foreground">
              {t('recentActivity.noActivity', { defaultValue: 'No recent activity' })}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
