import { Link } from '@tanstack/react-router';
import { ArrowUpRight, Plus } from 'lucide-react';
import Section, { type Accent } from '~/components/ui/section';
import { useTranslations } from '~/lib/i18n-context';
import { toolList } from '~/lib/tools/registry';
import { GridFill } from '~/components/ui/grid-fill';

/**
 * 工具矩阵 —— 直接从 `~/lib/tools/registry` 读，不另立一份写死的清单。
 * 用这套模板搭站时往 registry 里加条目，首页会自己长出来。
 *
 * 每张卡带自己的 `data-accent`：一眼看出这是 N 个不同的工具，
 * 而不是同一个东西的 N 种说法。
 *
 * 模板出厂只有一个 demo 工具，这时不假装很丰盛 —— 后面补一张
 * 「在 registry 里加工具」的说明卡，把下一步说清楚。
 */
const ACCENTS: Accent[] = ['orange', 'teal', 'blue', 'violet', 'green', 'amber', 'pink'];

export default function ToolGrid() {
  const t = useTranslations('toolGrid');
  const tt = useTranslations('tools');

  return (
    <Section
      id="tools"
      tone="subtle"
      eyebrow={t('eyebrow')}
      title={t('title')}
      lede={t('lede')}
    >
      <ul className="grid-hairline sm:grid-cols-2 lg:grid-cols-4">
        {toolList.map((tool, index) => (
          <li key={tool.id} data-accent={ACCENTS[index % ACCENTS.length]} className="bg-card">
            <Link
              to="/tools"
              className="group flex h-full flex-col p-6 transition-colors hover:bg-brand-subtle sm:p-7"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-medium leading-snug text-foreground">
                  {tt(tool.nameKey)}
                </h3>
                <ArrowUpRight
                  className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary"
                  aria-hidden="true"
                />
              </div>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                {tt(tool.descriptionKey)}
              </p>
              <div className="tabular mt-6 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="text-primary">{t('cost', { cost: tool.cost })}</span>
                <span aria-hidden="true">·</span>
                <span>{tool.requiresAuth ? t('signInRequired') : t('noSignIn')}</span>
              </div>
            </Link>
          </li>
        ))}

        {/* 出厂只有一个工具时，把「下一步做什么」说清楚，而不是留一片空白 */}
        <li className="flex flex-col justify-between gap-6 bg-card p-6 sm:p-7">
          <div>
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius)] border border-dashed border-border text-muted-foreground">
              <Plus className="h-4 w-4" aria-hidden="true" />
            </span>
            <h3 className="mt-4 text-lg font-medium text-foreground">{t('addTool.title')}</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {t('addTool.description')}
            </p>
          </div>
          <code className="tabular rounded-[var(--radius)] border border-border bg-subtle px-3 py-2 text-xs text-muted-foreground">
            app/lib/tools/registry.ts
          </code>
        </li>

        <GridFill count={toolList.length + 1} />
      </ul>
    </Section>
  );
}
