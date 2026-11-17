import { createFileRoute } from '@tanstack/react-router';
import { Mail } from 'lucide-react';
import Section from '~/components/ui/section';
import { useTranslations } from '~/lib/i18n-context';
import { normalizeLocale } from '~/lib/i18n';
import { buildPageHead, siteConfig } from '~/lib/site-config';

export const Route = createFileRoute('/{-$locale}/contact')({
  head: ({ match }) =>
    buildPageHead({
      locale: normalizeLocale(match.params.locale),
      title: 'Contact',
      description: `Get in touch with the ${siteConfig.name} team.`,
      path: '/contact',
    }),
  component: ContactPage,
});

const TOPICS = ['support', 'billing', 'security', 'other'] as const;

/**
 * 联系页独有的是**分流卡**：每一类问题各自写清楚响应时效。
 * 只给一个邮箱地址的联系页，等于把「多久有人回我」这个真正的问题
 * 留给用户自己猜。
 */
function ContactPage() {
  const t = useTranslations('contact');

  return (
    <Section tight headingLevel="h1" title={t('title')} lede={t('subtitle')}>
      <div className="callout flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        <Mail className="h-4 w-4 text-primary" aria-hidden="true" />
        <span className="text-foreground">{t('emailUs')}</span>
        <a
          href={`mailto:${siteConfig.contactEmail}`}
          className="tabular font-medium text-primary underline decoration-primary/30 underline-offset-4 transition-colors hover:decoration-primary"
        >
          {siteConfig.contactEmail}
        </a>
      </div>

      <ul className="grid-hairline mt-10 sm:grid-cols-2">
        {TOPICS.map((topic) => (
          <li key={topic} className="bg-card p-6 sm:p-7">
            <h2 className="text-base font-medium text-foreground">{t(`topics.${topic}.title`)}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {t(`topics.${topic}.description`)}
            </p>
            <p className="tabular mt-4 text-xs text-primary">{t(`topics.${topic}.sla`)}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}
