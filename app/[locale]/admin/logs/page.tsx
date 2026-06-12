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
  getAllToolUsageLogs,
  getToolUsageCount,
  getToolUsageStats,
} from "@/lib/db/queries";
import { formatDistanceToNow } from "date-fns";
import { Suspense } from "react";
import { Pagination } from "@/components/admin/pagination";
import { ToolUsageChart } from "@/components/admin/tool-usage-chart";
import { Activity, Clock, Zap } from "lucide-react";
import { getTranslations } from 'next-intl/server';
import type { Metadata } from "next";

const ITEMS_PER_PAGE = 50;

export const metadata: Metadata = {
  title: 'System Logs',
  robots: {
    index: false,
    follow: false,
  },
};

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function LogsContent({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations('adminLogsPage');
  const search = await searchParams;
  const currentPage = typeof search.page === "string" ? parseInt(search.page) : 1;
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  const [logs, totalCount, toolStats] = await Promise.all([
    getAllToolUsageLogs(offset, ITEMS_PER_PAGE),
    getToolUsageCount(),
    getToolUsageStats(),
  ]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const totalUsage = toolStats.reduce((sum, stat) => sum + stat.count, 0);
  const avgDuration =
    toolStats.reduce((sum, stat) => sum + (stat.avgDuration || 0), 0) /
    (toolStats.length || 1);
  const uniqueTools = toolStats.length;

  return (
    <>
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {t('stats.totalApiCalls', { defaultValue: 'Total API Calls' })}
              </p>
              <p className="text-2xl font-bold">{totalUsage}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {t('stats.avgDuration', { defaultValue: 'Avg Duration' })}
              </p>
              <p className="text-2xl font-bold">{Math.round(avgDuration)}ms</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {t('stats.uniqueTools', { defaultValue: 'Unique Tools' })}
              </p>
              <p className="text-2xl font-bold">{uniqueTools}</p>
            </div>
          </div>
        </Card>
      </div>

      {toolStats.length > 0 && (
        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold">
            {t('usageChart', { defaultValue: 'Usage Over Time' })}
          </h3>
          <ToolUsageChart data={toolStats} />
        </Card>
      )}

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('table.user', { defaultValue: 'User' })}</TableHead>
              <TableHead>{t('table.tool', { defaultValue: 'Tool' })}</TableHead>
              <TableHead>{t('table.action', { defaultValue: 'Action' })}</TableHead>
              <TableHead>{t('table.duration', { defaultValue: 'Duration' })}</TableHead>
              <TableHead>{t('table.time', { defaultValue: 'Time' })}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((item) => (
              <TableRow key={item.log.id}>
                <TableCell className="font-medium">
                  {item.user?.email || t('table.unknown', { defaultValue: 'Unknown' })}
                </TableCell>
                <TableCell>{item.log.toolName}</TableCell>
                <TableCell>
                  <Badge variant="outline">{item.log.action}</Badge>
                </TableCell>
                <TableCell>{item.log.duration ? `${item.log.duration}ms` : "N/A"}</TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDistanceToNow(item.log.createdAt, { addSuffix: true })}
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

export default async function AdminLogsPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations('adminLogsPage');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">
          {t('title', { defaultValue: 'System Logs' })}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {t('subtitle', { defaultValue: 'Monitor tool usage and system activity' })}
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
        <LogsContent params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
