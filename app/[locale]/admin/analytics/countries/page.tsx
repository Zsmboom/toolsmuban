import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getCountryStats } from "@/lib/db/queries";
import { CountryPieChart } from "@/components/admin/country-pie-chart";
import { Globe, Users, Activity } from "lucide-react";
import { Suspense } from "react";
import { getTranslations } from 'next-intl/server';
import type { Metadata } from "next";

type Props = {
  params: Promise<{ locale: string }>;
};

export const metadata: Metadata = {
  title: 'Country Analytics',
  robots: {
    index: false,
    follow: false,
  },
};

async function CountryAnalyticsContent({ locale }: { locale: string }) {
  const t = await getTranslations('adminAnalyticsPage');
  const countryStats = await getCountryStats();

  const totalUsers = countryStats.reduce((sum, stat) => sum + stat.userCount, 0);
  const totalUsage = countryStats.reduce((sum, stat) => sum + stat.toolUsageCount, 0);
  const avgUsagePerUser = totalUsers > 0 ? (totalUsage / totalUsers).toFixed(2) : "0.00";

  return (
    <>
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <Globe className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {t('stats.totalCountries', { defaultValue: 'Total Countries' })}
              </p>
              <p className="mt-1 text-3xl font-bold">{countryStats.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-blue-500/10 p-2">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {t('stats.totalUsers', { defaultValue: 'Total Users' })}
              </p>
              <p className="mt-1 text-3xl font-bold">{totalUsers}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-green-500/10 p-2">
              <Activity className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {t('stats.avgUsagePerUser', { defaultValue: 'Avg Usage/User' })}
              </p>
              <p className="mt-1 text-3xl font-bold">{avgUsagePerUser}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold">
            {t('userDistribution', { defaultValue: 'User Distribution by Country' })}
          </h3>
          <CountryPieChart
            data={countryStats}
            dataKey="userCount"
            title={t('userDistribution', { defaultValue: 'User Distribution by Country' })}
          />
        </Card>

        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold">
            {t('topCountries', { defaultValue: 'Top Countries by Usage' })}
          </h3>
          <div className="space-y-4">
            {countryStats.slice(0, 5).map((stat, index) => (
              <div key={stat.country} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-medium">{stat.country || t('unknown', { defaultValue: 'Unknown' })}</p>
                    <p className="text-sm text-muted-foreground">
                      {stat.userCount} {t('users', { defaultValue: 'users' })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{stat.toolUsageCount}</p>
                  <p className="text-sm text-muted-foreground">
                    {t('requests', { defaultValue: 'requests' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <div className="border-b p-4">
          <h3 className="text-lg font-semibold">
            {t('detailedStats', { defaultValue: 'Detailed Statistics' })}
          </h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('table.country', { defaultValue: 'Country' })}</TableHead>
              <TableHead>{t('table.users', { defaultValue: 'Users' })}</TableHead>
              <TableHead>{t('table.toolUsage', { defaultValue: 'Tool Usage' })}</TableHead>
              <TableHead>{t('table.avgPerUser', { defaultValue: 'Avg/User' })}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {countryStats.map((stat) => (
              <TableRow key={stat.country}>
                <TableCell className="font-medium">
                  {stat.country || t('unknown', { defaultValue: 'Unknown' })}
                </TableCell>
                <TableCell>{stat.userCount}</TableCell>
                <TableCell>{stat.toolUsageCount}</TableCell>
                <TableCell>
                  {(stat.toolUsageCount / stat.userCount).toFixed(2)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}

export default async function AdminCountryAnalyticsPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations('adminAnalyticsPage');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">
          {t('title', { defaultValue: 'Country Analytics' })}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {t('subtitle', { defaultValue: 'Geographic distribution of users and usage' })}
        </p>
      </div>

      <Suspense
        fallback={
          <Card className="p-8">
            <p className="text-center text-muted-foreground">
              {t('loading', { defaultValue: 'Loading...' })}
            </p>
          </Card>
        }
      >
        <CountryAnalyticsContent locale={locale} />
      </Suspense>
    </div>
  );
}
