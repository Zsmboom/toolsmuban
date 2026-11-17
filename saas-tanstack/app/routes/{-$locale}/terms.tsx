import { createFileRoute } from '@tanstack/react-router';
import LegalPage from '~/components/marketing/legal-page';
import { normalizeLocale } from '~/lib/i18n';
import { buildPageHead, siteConfig } from '~/lib/site-config';

export const Route = createFileRoute('/{-$locale}/terms')({
  head: ({ match }) =>
    buildPageHead({
      locale: normalizeLocale(match.params.locale),
      title: 'Terms of Service',
      description: `The terms that govern your use of ${siteConfig.name}.`,
      path: '/terms',
    }),
  component: TermsPage,
});

function TermsPage() {
  return <LegalPage titleKey="termsPage" />;
}
