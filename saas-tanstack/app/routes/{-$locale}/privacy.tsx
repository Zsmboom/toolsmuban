import { createFileRoute } from '@tanstack/react-router';
import LegalPage from '~/components/marketing/legal-page';
import { normalizeLocale } from '~/lib/i18n';
import { buildPageHead, siteConfig } from '~/lib/site-config';

export const Route = createFileRoute('/{-$locale}/privacy')({
  head: ({ match }) =>
    buildPageHead({
      locale: normalizeLocale(match.params.locale),
      title: 'Privacy Policy',
      description: `How ${siteConfig.name} collects, uses and protects your personal data.`,
      path: '/privacy',
    }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return <LegalPage titleKey="privacyPage" />;
}
