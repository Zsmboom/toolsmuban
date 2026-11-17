import { useI18n, useTranslations } from '~/lib/i18n-context';
import { siteConfig } from '~/lib/site-config';
import { formatDate } from '~/lib/format';

/** 条款最后更新日期，改条款时记得同步 */
const LAST_UPDATED = '2026-08-16';

/**
 * 隐私政策 / 服务条款的共用骨架。
 *
 * 正文是模板占位内容 —— Stripe、Creem、PayPal 开户审核都要求这两个页面
 * 可访问，所以先保证页面存在且结构完整，上线前把条款替换成自己的即可。
 *
 * 之前这十二段条款是写死在组件里的英文，中文站打开就是一页英文。
 * 现在两种语言各存一份，正文从 messages.<page>.sections.* 读。
 */
const SECTION_KEYS = ['s1', 's2', 's3', 's4', 's5', 's6'] as const;

export default function LegalPage({ titleKey }: { titleKey: 'privacyPage' | 'termsPage' }) {
  const t = useTranslations(titleKey);
  const tl = useTranslations('legal');
  const { locale } = useI18n();

  const lastUpdated = formatDate(LAST_UPDATED, locale);

  return (
    <div className="shell py-14 sm:py-20">
      {/* 法务页是全站唯一一路单栏到底的排版 —— 它没有别的东西要看 */}
      <div className="measure">
        <h1 className="display-2 text-foreground">{t('title')}</h1>
        <p className="tabular mt-4 text-sm text-muted-foreground">
          {tl('lastUpdated', { date: lastUpdated })}
        </p>

        <div className="callout mt-8 text-sm text-foreground">{tl('placeholderNotice')}</div>

        <div className="mt-12 space-y-10">
          {SECTION_KEYS.map((key) => (
            <section key={key}>
              <h2 className="display-3 text-foreground">{t(`sections.${key}.heading`)}</h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                {t(`sections.${key}.body`)}
              </p>
            </section>
          ))}

          <section>
            <h2 className="display-3 text-foreground">{tl('contact.title')}</h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              {tl('contact.body')}{' '}
              <a
                href={`mailto:${siteConfig.contactEmail}`}
                className="tabular text-primary underline decoration-primary/30 underline-offset-4 transition-colors hover:decoration-primary"
              >
                {siteConfig.contactEmail}
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
