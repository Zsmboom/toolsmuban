import { createFileRoute, Link, redirect, useRouter } from '@tanstack/react-router';
import { useState } from 'react';
import { Play } from 'lucide-react';
import { getDashboardDataFn } from '~/lib/account/server-fns';
import { getRecentToolRunsFn, runToolFn } from '~/lib/tools/server-fns';
import { TOOLS } from '~/lib/tools/registry';
import { useTranslations } from '~/lib/i18n-context';
import { buildPageHead } from '~/lib/site-config';
import { formatDateTime, formatNumber } from '~/lib/format';
import AppShell from '~/components/layout/app-shell';
import { Card } from '~/components/ui/card';
import Button from '~/components/ui/button';
import Table, { Cell, Row } from '~/components/ui/table';
import { Field, Textarea } from '~/components/ui/field';

export const Route = createFileRoute('/tools')({
  loader: async () => {
    const data = await getDashboardDataFn();
    if (!data) throw redirect({ to: '/login' });
    const runs = await getRecentToolRunsFn();
    return { ...data, runs };
  },
  head: () =>
    buildPageHead({
      title: 'Tools',
      description: 'Run tools and track credit usage.',
      path: '/tools',
      noIndex: true,
    }),
  component: ToolsPage,
});

function ToolsPage() {
  const { user, credits, runs } = Route.useLoaderData();
  const router = useRouter();
  const t = useTranslations('tools');
  const tc = useTranslations('credits');
  const tcm = useTranslations('common');

  const tool = TOOLS.demo;
  const [input, setInput] = useState('');
  const [output, setOutput] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [balance, setBalance] = useState(credits?.balance ?? 0);

  const unlimited = credits?.unlimited ?? false;

  const handleRun = async () => {
    setRunning(true);
    setError(null);
    setOutput(null);

    try {
      const result = await runToolFn({ data: { toolId: tool.id, input } });

      if (!result.ok) {
        setError(result.error === 'INSUFFICIENT_CREDITS' ? tc('insufficient') : t('runFailed'));
        return;
      }

      setOutput(result.output ?? '');
      if (typeof result.balanceAfter === 'number') setBalance(result.balanceAfter);
      // 刷新 loader，让侧栏和运行记录同步到最新
      await router.invalidate();
    } catch (err) {
      console.error('Tool run failed:', err);
      setError(t('runFailed'));
    } finally {
      setRunning(false);
    }
  };

  return (
    <AppShell
      user={user}
      title={t('title')}
      description={t('subtitle')}
      actions={
        <div className="surface px-4 py-2.5 text-sm">
          <span className="text-muted-foreground">{tc('balance')}: </span>
          <span className="tabular text-foreground">
            {unlimited ? tc('unlimited') : formatNumber(balance)}
          </span>
        </div>
      }
    >
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-medium text-foreground">{t('demoName')}</h2>
            <p className="measure mt-2 text-sm text-muted-foreground">{t('demoDescription')}</p>
          </div>
          <span className="tabular shrink-0 text-xs text-primary">
            {t('costLabel', { cost: tool.cost })}
          </span>
        </div>

        <div className="mt-6">
          <Field id="tool-input" label={t('input')} error={error}>
            <Textarea
              id="tool-input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              rows={3}
              maxLength={5000}
              placeholder={t('inputPlaceholder')}
              aria-describedby={error ? 'tool-input-error' : undefined}
            />
          </Field>
        </div>

        {error === tc('insufficient') ? (
          <p className="mt-2 text-xs text-muted-foreground">
            <Link
              to="/{-$locale}/pricing"
              className="text-primary underline decoration-primary/30 underline-offset-4"
            >
              {tcm('upgrade')}
            </Link>
          </p>
        ) : null}

        <Button onClick={handleRun} disabled={running || input.length === 0} className="mt-5">
          <Play className="h-3.5 w-3.5" aria-hidden="true" />
          {running ? t('running') : t('run')}
        </Button>

        {output !== null ? (
          <div className="mt-6">
            <p className="text-sm font-medium text-foreground">{t('result')}</p>
            <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-words rounded-[var(--radius)] border border-border bg-subtle p-4 text-sm text-foreground">
              {output}
            </pre>
          </div>
        ) : null}
      </Card>

      <h2 className="eyebrow mt-10">{t('recentRuns')}</h2>
      <div className="mt-4">
        <Table
          columns={[t('tool'), t('creditsUsed'), tcm('date')]}
          empty={t('noRuns')}
          caption={t('recentRuns')}
        >
          {runs.map((run) => (
            <Row key={run.id}>
              <Cell>{run.toolName}</Cell>
              <Cell numeric>{run.creditsUsed}</Cell>
              <Cell numeric muted>
                {formatDateTime(run.createdAt)}
              </Cell>
            </Row>
          ))}
        </Table>
      </div>
    </AppShell>
  );
}
