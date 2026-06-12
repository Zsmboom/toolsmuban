"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/language/language-switcher";
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

export function MobileSidebar({ isAdmin = false }: { isAdmin?: boolean }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const t = useTranslations('common');
  const tDashboard = useTranslations('dashboard');
  const tAdmin = useTranslations('admin');

  const userNavItems = [
    { title: tDashboard('dashboard'), href: "/dashboard", icon: LayoutDashboard },
    { title: tDashboard('tools'), href: "/dashboard/tools", icon: Wrench },
    { title: tDashboard('history'), href: "/dashboard/history", icon: History },
    { title: t('settings'), href: "/dashboard/settings", icon: Settings },
  ];

  const adminNavItems = [
    { title: tAdmin('title'), href: "/admin", icon: BarChart },
    { title: tAdmin('users'), href: "/admin/users", icon: Users },
    { title: tAdmin('subscriptions'), href: "/admin/subscriptions", icon: CreditCard },
    { title: tAdmin('logs'), href: "/admin/logs", icon: FileText },
    { title: tAdmin('analytics'), href: "/admin/analytics/countries", icon: Globe },
  ];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden min-h-[44px] min-w-[44px]"
          aria-label="Open navigation menu"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center border-b px-6">
            <Link
              href="/dashboard"
              className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"
              onClick={() => setOpen(false)}
            >
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

              return (
                <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>
                  <div
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "hover:bg-muted hover:text-primary"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {item.title}
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

                  return (
                    <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>
                      <div
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          isActive
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "hover:bg-muted hover:text-primary"
                        )}
                      >
                        <Icon className="h-5 w-5" />
                        {item.title}
                      </div>
                    </Link>
                  );
                })}
              </>
            )}
          </nav>

          <div className="border-t p-4 space-y-3">
            <LanguageSwitcher />
            <Button
              variant="ghost"
              className="w-full justify-start hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
              onClick={() => {
                signOut({ callbackUrl: "/" });
                setOpen(false);
              }}
            >
              <LogOut className="mr-3 h-5 w-5" />
              {t('logout')}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
