import { Link } from '@tanstack/react-router';
import { useI18n, useTranslations } from '~/lib/i18n-context';
import { siteConfig } from '~/lib/site-config';
import { BUILD_YEAR } from '~/lib/format';

/** 每一项都必须指向真实存在的路由，否则页脚就是一片 404 */
const COLUMNS = [
  {
    titleKey: 'product',
    links: [
      { to: '/{-$locale}/pricing', labelKey: 'common.pricing' },
      { to: '/{-$locale}/features', labelKey: 'footer.features' },
      { to: '/{-$locale}/blog', labelKey: 'common.blog' },
    ],
  },
  {
    titleKey: 'company',
    links: [
      { to: '/{-$locale}/about', labelKey: 'footer.aboutUs' },
      { to: '/{-$locale}/contact', labelKey: 'footer.contact' },
    ],
  },
  {
    titleKey: 'legal',
    links: [
      { to: '/{-$locale}/privacy', labelKey: 'footer.privacy' },
      { to: '/{-$locale}/terms', labelKey: 'footer.terms' },
    ],
  },
] as const;

export default function Footer() {
  const tf = useTranslations('footer');
  // links 里的 key 是完整路径，直接用 t 而不是绑定命名空间
  const { t } = useI18n();

  return (
    <footer className="border-t border-border bg-subtle">
      <div className="shell py-14">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Link
              to="/{-$locale}"
              className="text-base font-medium tracking-tight text-foreground transition-colors hover:text-primary"
            >
              {siteConfig.name}
            </Link>
            <p className="measure mt-3 text-sm text-muted-foreground">{siteConfig.description}</p>
          </div>

          {COLUMNS.map((column) => (
            <div key={column.titleKey}>
              <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {tf(column.titleKey)}
              </h2>
              <ul className="mt-4 space-y-1">
                {column.links.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="inline-flex min-h-11 items-center text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {t(link.labelKey)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-border pt-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; <span className="tabular">{BUILD_YEAR}</span> {siteConfig.name}.{' '}
            {tf('allRightsReserved')}.
          </p>
          <a
            href={`mailto:${siteConfig.contactEmail}`}
            className="transition-colors hover:text-foreground"
          >
            {siteConfig.contactEmail}
          </a>
        </div>
      </div>
    </footer>
  );
}
