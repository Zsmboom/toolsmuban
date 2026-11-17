import {
  BarChart3,
  CreditCard,
  FileCode2,
  Globe,
  KeyRound,
  ShieldCheck,
  Smartphone,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import Section from '~/components/ui/section';
import { useTranslations } from '~/lib/i18n-context';

/**
 * 能力网格。
 *
 * 之前这里的八条是写死的英文，而 messages.features.* 里同样的八条
 * 一直躺着没被用过 —— 中文站点开首页就会露出英文。现在只从 i18n 读。
 *
 * 图标统一走 lucide-react，不再手写 24×24 的 SVG path。
 */
const FEATURES: { key: string; icon: LucideIcon }[] = [
  { key: 'lightningFast', icon: Zap },
  { key: 'secureAuth', icon: ShieldCheck },
  { key: 'dualPayment', icon: CreditCard },
  { key: 'analytics', icon: BarChart3 },
  { key: 'responsive', icon: Smartphone },
  { key: 'typescript', icon: FileCode2 },
  { key: 'roleAccess', icon: KeyRound },
  { key: 'multiCountry', icon: Globe },
];

export default function Features({ showHeading = true }: { showHeading?: boolean } = {}) {
  const t = useTranslations('features');

  return (
    <Section
      id="features"
      eyebrow={showHeading ? t('eyebrow') : undefined}
      title={showHeading ? t('title') : undefined}
      lede={showHeading ? t('subtitle') : undefined}
      // /features 页的 H1 已经说过一遍了，这里不再重复一个区块标题，
      // 顶部内边距也交给上面那个标题区，避免两段留白叠在一起
      className={showHeading ? undefined : '[&>div]:pt-0'}
    >
      <ul className="grid-hairline sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((feature) => (
          <li key={feature.key} className="bg-card p-6 sm:p-7">
            <feature.icon className="h-5 w-5 text-primary" aria-hidden="true" />
            <h3 className="mt-4 text-base font-medium text-foreground">
              {t(`${feature.key}.title`)}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {t(`${feature.key}.description`)}
            </p>
          </li>
        ))}
      </ul>
    </Section>
  );
}

const BOUNDARIES = ['noContent', 'noEmailMarketing', 'noTeams', 'noMobileApp'] as const;

/**
 * 「模板不做什么」—— 边界写在动手之前，而不是等人搭了一半才发现。
 * 这是 /features 页独有的一块，让它和首页的能力网格长得不一样。
 */
export function Boundaries() {
  const t = useTranslations('boundaries');

  return (
    <Section tone="subtle" tight eyebrow={t('eyebrow')} title={t('title')} lede={t('lede')}>
      <ul className="grid gap-px bg-border sm:grid-cols-2">
        {BOUNDARIES.map((key) => (
          <li key={key} className="bg-subtle p-6 sm:p-7">
            <h3 className="text-base font-medium text-foreground">{t(`${key}.title`)}</h3>
            <p className="measure mt-2 text-sm leading-relaxed text-muted-foreground">
              {t(`${key}.description`)}
            </p>
          </li>
        ))}
      </ul>
    </Section>
  );
}
