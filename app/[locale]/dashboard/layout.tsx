import { Sidebar } from "@/components/layout/sidebar";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { auth } from "@/lib/auth/config";
import { getTranslations } from 'next-intl/server';

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function DashboardLayout({ children, params }: Props) {
  const { locale } = await params;

  const session = await auth();
  const isAdmin = session?.user?.role === "admin";
  const t = await getTranslations({ locale, namespace: 'dashboard' });

  return (
    <div className="flex min-h-screen">
      {/* Desktop Sidebar - hidden on mobile */}
      <Sidebar isAdmin={isAdmin} />

      <div className="flex flex-1 flex-col">
        {/* Mobile header with navigation */}
        <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-xl px-4 md:hidden">
          <MobileSidebar isAdmin={isAdmin} />
          <h1 className="text-lg font-semibold">{t('dashboard')}</h1>
        </header>

        {/* Main content area */}
        <main id="main-content" className="flex-1 overflow-y-auto bg-muted/30 p-4 md:p-8">
          <div className="mx-auto max-w-7xl">
            <Breadcrumb />
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
