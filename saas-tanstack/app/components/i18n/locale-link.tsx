import { Link, type LinkComponentProps } from '@tanstack/react-router';
import { useI18n } from '~/lib/i18n-context';
import { localeParam } from '~/lib/i18n';

/**
 * 指向公开页面的链接一律用它，不要直接写 <Link to="/pricing">。
 *
 * 它会自动带上当前语言的 `{-$locale}` 参数：默认语言下参数是 undefined，
 * 生成 /pricing；中文下生成 /zh/pricing。
 *
 * 这样以后开新语言时不需要回头改每一处链接 —— 这正是把语言段
 * 提前放进路由结构的意义。
 *
 * 用法：<LocaleLink to="/{-$locale}/pricing">Pricing</LocaleLink>
 */
export default function LocaleLink({
  params,
  ...props
}: LinkComponentProps<'a'>) {
  const { locale } = useI18n();

  return (
    <Link
      {...(props as LinkComponentProps<'a'>)}
      params={{ ...localeParam(locale), ...(params as object) } as never}
    />
  );
}
