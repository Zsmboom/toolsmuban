"use client";

import { Link } from "@/navigation";
import { usePathname } from "@/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Wrench,
  History,
  Settings,
  LogOut,
  Users,
  BarChart,
  CreditCard,
  FileText,
  Globe,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/language/language-switcher";

interface SidebarProps {
  isAdmin?: boolean;
}

export function Sidebar({ isAdmin = false }: SidebarProps = {}) {
  const pathname = usePathname();
  const t = useTranslations('common');
  const tDashboard = useTranslations('dashboard');
  const tAdmin = useTranslations('admin');

  const userNavItems = [
    {
      titleKey: 'dashboard' as const,
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      titleKey: 'tools' as const,
      href: "/dashboard/tools",
      icon: Wrench,
      useNamespace: 'dashboard' as const,
    },
    {
      titleKey: 'history' as const,
      href: "/dashboard/history",
      icon: History,
      useNamespace: 'dashboard' as const,
    },
    {
      titleKey: 'settings' as const,
      href: "/dashboard/settings",
      icon: Settings,
    },
  ];

  const adminNavItems = [
    {
      titleKey: 'title' as const,
      href: "/admin",
      icon: BarChart,
      useNamespace: 'admin' as const,
    },
    {
      titleKey: 'users' as const,
      href: "/admin/users",
      icon: Users,
      useNamespace: 'admin' as const,
    },
    {
      titleKey: 'subscriptions' as const,
      href: "/admin/subscriptions",
      icon: CreditCard,
      useNamespace: 'admin' as const,
    },
    {
      titleKey: 'logs' as const,
      href: "/admin/logs",
      icon: FileText,
      useNamespace: 'admin' as const,
    },
    {
      titleKey: 'analytics' as const,
      href: "/admin/analytics/countries",
      icon: Globe,
      useNamespace: 'admin' as const,
    },
  ];

  return (
    <aside className="hidden md:flex w-64 flex-col border-r bg-background">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/dashboard" className="text-xl font-bold text-primary">
          SaaS Template
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        <div className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t('mainMenu')}
        </div>
        {userNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          const title = item.useNamespace === 'dashboard'
            ? tDashboard(item.titleKey)
            : t(item.titleKey);

          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                )}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                {title}
              </div>
            </Link>
          );
        })}

        {isAdmin && (
          <>
            <div className="my-4 border-t" />
            <div className="mb-2 mt-6 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {tAdmin('title')}
            </div>
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              const title = item.useNamespace === 'admin'
                ? tAdmin(item.titleKey)
                : t(item.titleKey);

              return (
                <Link key={item.href} href={item.href}>
                  <div
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    )}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                    {title}
                  </div>
                </Link>
              );
            })}
          </>
        )}
      </nav>

      <div className="border-t p-4 space-y-2">
        <LanguageSwitcher />
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          <LogOut className="mr-3 h-5 w-5" />
          {t('logout')}
        </Button>
      </div>
    </aside>
  );
}
