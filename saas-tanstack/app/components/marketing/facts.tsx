import { useTranslations } from '~/lib/i18n-context';
import { ENABLED_LOCALES } from '~/lib/i18n';
import { toolList } from '~/lib/tools/registry';

/**
 * 事实条 —— 只写这个模板**真实**的数字，而且尽量从代码里读出来，
 * 不手写。写「快速、简单、免费」是让每个用这套模板的站
 * 看起来像同一个站的最快方式。
 *
 * 数值走等宽（规矩 3）：它们是数据不是文案。
 */
export default function Facts() {
  const t = useTranslations('facts');

  const items = [
    { value: '3', labelKey: 'paymentProviders' },
    { value: String(ENABLED_LOCALES.length), labelKey: 'locales' },
    { value: '2', labelKey: 'databases' },
    { value: String(toolList.length), labelKey: 'tools' },
  ];

  return (
    <section className="border-b border-border bg-subtle">
      <div className="shell">
        <dl className="grid grid-cols-2 divide-x divide-y divide-border border-x border-border sm:grid-cols-4 sm:divide-y-0">
          {items.map((item) => (
            <div key={item.labelKey} className="px-5 py-7 sm:px-6">
              <dt className="tabular text-2xl text-foreground sm:text-3xl">{item.value}</dt>
              <dd className="mt-2 text-sm text-muted-foreground">{t(item.labelKey)}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
