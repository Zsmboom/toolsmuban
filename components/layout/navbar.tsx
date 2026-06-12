"use client";

import { Link } from "@/navigation";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/language/language-switcher";
import { usePathname } from "@/navigation";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const t = useTranslations('nav');
  const tCommon = useTranslations('common');
  const tHero = useTranslations('hero');

  const navLinks = [
    { href: "/#features", label: t('features') },
    { href: "/pricing", label: t('pricing') },
    { href: "/blog", label: t('blog') },
    { href: "/about", label: t('about') },
  ];

  const isActive = (href: string) => {
    const cleanPath = href.startsWith('/#') ? '/' : href;
    return pathname === cleanPath;
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link
          href="/"
          className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent hover:opacity-80 transition-opacity"
        >
          SaaS Template
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "relative px-3 py-2 text-sm font-medium transition-colors rounded-lg",
                "hover:text-primary",
                isActive(link.href)
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              {link.label}
              {isActive(link.href) && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-primary rounded-full" />
              )}
            </Link>
          ))}
          <div className="ml-4 pl-4 border-l">
            <LanguageSwitcher />
          </div>
          <Link href="/login">
            <Button variant="ghost" size="sm" className="active:scale-95 transition-transform">
              {tCommon('login')}
            </Button>
          </Link>
          <Link href="/login">
            <Button size="sm" className="active:scale-95 transition-transform shadow-md hover:shadow-lg">
              {tHero('cta')}
            </Button>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-3 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Close menu" : "Open menu"}
          aria-expanded={isOpen}
          aria-controls="mobile-menu"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Navigation */}
      <div
        id="mobile-menu"
        className={cn(
          "md:hidden overflow-hidden transition-all duration-300 ease-in-out",
          isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="border-t bg-background/95 backdrop-blur-xl">
          <div className="container mx-auto flex flex-col gap-2 px-4 py-4">
            {navLinks.map((link, index) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted hover:text-primary",
                  isActive(link.href) && "bg-primary/10 text-primary"
                )}
                onClick={() => setIsOpen(false)}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 mt-2 border-t space-y-2">
              <LanguageSwitcher />
              <div className="flex flex-col gap-2 pt-2">
                <Link href="/login" onClick={() => setIsOpen(false)}>
                  <Button variant="ghost" className="w-full active:scale-95 transition-transform">
                    {tCommon('login')}
                  </Button>
                </Link>
                <Link href="/login" onClick={() => setIsOpen(false)}>
                  <Button className="w-full active:scale-95 transition-transform shadow-md">
                    {tHero('cta')}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
