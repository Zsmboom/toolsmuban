import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { StatsCard } from "@/components/dashboard/stats-card";
import { SubscriptionStatus } from "@/components/dashboard/subscription-status";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { Activity, Zap, Clock } from "lucide-react";
import { getUserSubscription, getUserToolUsage } from "@/lib/db/queries";
import { getTranslations } from 'next-intl/server';
import type { Metadata } from "next";
import { Suspense } from "react";

type Props = {
  params: Promise<{ locale: string }>;
};

export const metadata: Metadata = {
  title: 'Dashboard',
  robots: {
    index: false,
    follow: false,
  },
};

async function DashboardStats({ userId, locale }: { userId: string; locale: string }) {
  const t = await getTranslations({ locale, namespace: 'dashboardPage' });
  const subscription = await getUserSubscription(userId);
  const recentUsage = await getUserToolUsage(userId, 5);

  const stats = {
    toolsUsed: recentUsage.length,
    creditsRemaining: 1000,
    totalUsageTime: 245,
  };

  const activities = recentUsage.map((log) => ({
    id: log.id,
    type: log.toolName,
    description: `${log.action} - ${log.duration ? `${log.duration}ms` : "completed"}`,
    timestamp: log.createdAt,
    status: "success" as const,
  }));

  return (
    <>
      <div className="grid gap-6 md:grid-cols-3">
        <StatsCard
          title={t('stats.toolsUsed', { defaultValue: 'Tools Used' })}
          value={stats.toolsUsed}
          description={t('stats.thisMonth', { defaultValue: 'This month' })}
          icon={Activity}
          trend={{ value: 12, isPositive: true }}
        />
        <StatsCard
          title={t('stats.creditsRemaining', { defaultValue: 'Credits Remaining' })}
          value={stats.creditsRemaining}
          description={t('stats.resetsMonthly', { defaultValue: 'Resets monthly' })}
          icon={Zap}
        />
        <StatsCard
          title={t('stats.usageTime', { defaultValue: 'Usage Time' })}
          value={`${stats.totalUsageTime}m`}
          description={t('stats.thisMonth', { defaultValue: 'This month' })}
          icon={Clock}
          trend={{ value: 8, isPositive: true }}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SubscriptionStatus
          plan={subscription?.plan || "free"}
          status={subscription?.status || "active"}
          currentPeriodEnd={subscription?.currentPeriodEnd || undefined}
          provider={subscription?.provider || undefined}
        />
        <RecentActivity activities={activities} />
      </div>
    </>
  );
}

export default async function DashboardPage({ params }: Props) {
  const { locale } = await params;

  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const t = await getTranslations({ locale, namespace: 'dashboardPage' });

  return (
    <div className="space-y-8 animate-slide-up">
      <div>
        <h1 className="text-3xl font-bold">
          {t('title', { defaultValue: 'Dashboard' })}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {t('welcome', {
            defaultValue: 'Welcome back, {name}',
            name: session.user.name || session.user.email || 'User'
          })}
        </p>
      </div>

      <Suspense
        fallback={
          <div className="space-y-8">
            <div className="grid gap-6 md:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 rounded-xl bg-muted shimmer" />
              ))}
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="h-48 rounded-xl bg-muted shimmer" />
              <div className="h-48 rounded-xl bg-muted shimmer" />
            </div>
          </div>
        }
      >
        <DashboardStats userId={session.user.id} locale={locale} />
      </Suspense>
    </div>
  );
}
