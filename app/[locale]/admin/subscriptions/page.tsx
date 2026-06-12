import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  getAllSubscriptions,
  getSubscriptionsCount,
  getSubscriptionsByStatus,
  getSubscriptionStats,
} from "@/lib/db/queries";
import { formatDistanceToNow } from "date-fns";
import { Suspense } from "react";
import { StatusFilter } from "@/components/admin/status-filter";
import { Pagination } from "@/components/admin/pagination";
import { CreditCard, TrendingUp, DollarSign } from "lucide-react";
import { getTranslations } from 'next-intl/server';
import type { Metadata } from "next";

const ITEMS_PER_PAGE = 20;

export const metadata: Metadata = {
  title: 'Subscriptions Management',
  robots: {
    index: false,
    follow: false,
  },
};

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function SubscriptionsContent({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations('adminSubscriptionsPage');
  const search = await searchParams;
  const statusFilter = typeof search.status === "string" ? search.status : "";
  const currentPage = typeof search.page === "string" ? parseInt(search.page) : 1;
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  const [subscriptions, totalCount, stats] = await Promise.all([
    statusFilter && statusFilter !== "all"
      ? getSubscriptionsByStatus(
          statusFilter as "active" | "canceled" | "past_due",
          offset,
          ITEMS_PER_PAGE
        )
      : getAllSubscriptions(offset, ITEMS_PER_PAGE),
    getSubscriptionsCount(),
    getSubscriptionStats(),
  ]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const activeCount = stats.find((s) => s.status === "active")?.count || 0;
  const stripeCount =
    stats
      .filter((s) => s.provider === "stripe")
      .reduce((sum, s) => sum + s.count, 0) || 0;
  const paypalCount =
    stats
      .filter((s) => s.provider === "paypal")
      .reduce((sum, s) => sum + s.count, 0) || 0;
  const creemCount =
    stats
      .filter((s) => s.provider === "creem")
      .reduce((sum, s) => sum + s.count, 0) || 0;

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">\n        <Card className="p-6">\n          <div className="flex items-center gap-3">\n            <div className="rounded-full bg-primary/10 p-2">\n              <TrendingUp className="h-5 w-5 text-primary" />\n            </div>\n            <div>\n              <p className="text-sm font-medium text-muted-foreground">\n                {t('stats.activeSubscriptions', { defaultValue: 'Active Subscriptions' })}\n              </p>\n              <p className="text-2xl font-bold">{activeCount}</p>\n            </div>\n          </div>\n        </Card>\n        <Card className="p-6">\n          <div className="flex items-center gap-3">\n            <div className="rounded-full bg-primary/10 p-2">\n              <CreditCard className="h-5 w-5 text-primary" />\n            </div>\n            <div>\n              <p className="text-sm font-medium text-muted-foreground">\n                {t('stats.stripeSubscriptions', { defaultValue: 'Stripe Subscriptions' })}\n              </p>\n              <p className="text-2xl font-bold">{stripeCount}</p>\n            </div>\n          </div>\n        </Card>\n        <Card className="p-6">\n          <div className="flex items-center gap-3">\n            <div className="rounded-full bg-primary/10 p-2">\n              <DollarSign className="h-5 w-5 text-primary" />\n            </div>\n            <div>\n              <p className="text-sm font-medium text-muted-foreground">\n                {t('stats.paypalSubscriptions', { defaultValue: 'PayPal Subscriptions' })}\n              </p>\n              <p className="text-2xl font-bold">{paypalCount}</p>\n            </div>\n          </div>\n        </Card>\n        <Card className="p-6">\n          <div className="flex items-center gap-3">\n            <div className="rounded-full bg-primary/10 p-2">\n              <CreditCard className="h-5 w-5 text-primary" />\n            </div>\n            <div>\n              <p className="text-sm font-medium text-muted-foreground">\n                {t('stats.creemSubscriptions', { defaultValue: 'Creem Subscriptions' })}\n              </p>\n              <p className="text-2xl font-bold">{creemCount}</p>\n            </div>\n          </div>\n        </Card>\n      </div>

      <Card>
        <div className="border-b p-4">
          <StatusFilter
            options={[
              { label: t('statusFilter.all', { defaultValue: 'All' }), value: '' },
              { label: t('statusFilter.active', { defaultValue: 'Active' }), value: 'active' },
              { label: t('statusFilter.canceled', { defaultValue: 'Canceled' }), value: 'canceled' },
              { label: t('statusFilter.paused', { defaultValue: 'Paused' }), value: 'paused' },
            ]}
            paramName="status"
            label={t('statusFilter.label', { defaultValue: 'Filter by Status' })}
            placeholder={t('statusFilter.placeholder', { defaultValue: 'All statuses' })}
          />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('table.user', { defaultValue: 'User' })}</TableHead>
              <TableHead>{t('table.plan', { defaultValue: 'Plan' })}</TableHead>
              <TableHead>{t('table.status', { defaultValue: 'Status' })}</TableHead>
              <TableHead>{t('table.provider', { defaultValue: 'Provider' })}</TableHead>
              <TableHead>{t('table.created', { defaultValue: 'Created' })}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subscriptions.map((item) => (
              <TableRow key={item.subscription.id}>
                <TableCell className="font-medium">
                  {item.user?.email || t('table.unknown', { defaultValue: 'Unknown' })}
                </TableCell>
                <TableCell className="capitalize">{item.subscription.plan}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      item.subscription.status === "active"
                        ? "default"
                        : item.subscription.status === "canceled"
                        ? "secondary"
                        : "destructive"
                    }
                  >
                    {item.subscription.status}
                  </Badge>
                </TableCell>
                <TableCell className="capitalize">{item.subscription.provider}</TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDistanceToNow(item.subscription.createdAt, { addSuffix: true })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalCount}
          itemsPerPage={ITEMS_PER_PAGE}
        />
      </Card>
    </>
  );
}

export default async function AdminSubscriptionsPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations('adminSubscriptionsPage');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">
          {t('title', { defaultValue: 'Subscriptions Management' })}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {t('subtitle', { defaultValue: 'Monitor and manage user subscriptions' })}
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
        <SubscriptionsContent params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
