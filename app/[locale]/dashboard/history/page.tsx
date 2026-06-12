import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
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
import { Input } from "@/components/ui/input";
import { getUserToolUsage } from "@/lib/db/queries";
import { formatDistanceToNow } from "date-fns";
import { getTranslations } from 'next-intl/server';
import type { Metadata } from "next";
import { Search } from "lucide-react";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ q?: string }>;
};

export const metadata: Metadata = {
  title: 'Usage History',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function HistoryPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const query = searchParams ? (await searchParams).q : undefined;

  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const t = await getTranslations('historyPage');
  const usageLogs = await getUserToolUsage(session.user.id, 50);

  const filteredLogs = query
    ? usageLogs.filter(
        (log) =>
          log.toolName.toLowerCase().includes(query.toLowerCase()) ||
          log.action.toLowerCase().includes(query.toLowerCase())
      )
    : usageLogs;

  return (
    <div className="space-y-8 animate-slide-up">
      <div>
        <h1 className="text-3xl font-bold">
          {t('title', { defaultValue: 'Usage History' })}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {t('subtitle', { defaultValue: 'View your recent tool usage and activity' })}
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t('search', { defaultValue: 'Search history...' })}
          className="pl-9"
          defaultValue={query || ""}
          name="q"
        />
      </div>

      <Card>
        {filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="mb-4 rounded-full bg-muted p-3">
              <Search className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">
              {query
                ? t('noResults', { defaultValue: 'No results found for your search.' })
                : t('noHistory', {
                    defaultValue: 'No usage history yet. Start using tools to see your activity here.'
                  })}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('table.tool', { defaultValue: 'Tool' })}</TableHead>
                <TableHead>{t('table.action', { defaultValue: 'Action' })}</TableHead>
                <TableHead>{t('table.duration', { defaultValue: 'Duration' })}</TableHead>
                <TableHead>{t('table.time', { defaultValue: 'Time' })}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id} className="transition-colors hover:bg-muted/50">
                  <TableCell className="font-medium">{log.toolName}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-normal">{log.action}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {log.duration ? `${log.duration}ms` : "N/A"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDistanceToNow(log.createdAt, { addSuffix: true })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
