"use client";

import { Link } from "@/navigation";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/language/language-switcher";
import { Twitter, Linkedin, Github } from "lucide-react";
import { cn } from "@/lib/utils";

export function Footer() {
  const t = useTranslations('footer');
  const tCommon = useTranslations('common');

  const socialLinks = [
    { label: "Twitter", href: "#", icon: Twitter, hoverColor: "hover:text-sky-500" },
    { label: "LinkedIn", href: "#", icon: Linkedin, hoverColor: "hover:text-blue-600" },
    { label: "GitHub", href: "#", icon: Github, hoverColor: "hover:text-foreground" },
  ];

  const footerLinks = [
    {
      title: t('company'),
      links: [
        { label: t('aboutUs'), href: "/about" },
        { label: t('careers'), href: "#" },
        { label: tCommon('blog'), href: "/blog" },
      ],
    },
    {
      title: t('product'),
      links: [
        { label: t('features'), href: "/#features" },
        { label: tCommon('pricing'), href: "/pricing" },
        { label: t('documentation'), href: "#" },
      ],
    },
    {
      title: t('legal'),
      links: [
        { label: t('terms'), href: "/terms" },
        { label: t('privacy'), href: "/privacy" },
        { label: t('cookiePolicy'), href: "#" },
      ],
    },
  ];

  return (
    <footer className="border-t bg-muted/50">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-6">
          {footerLinks.map((group) => (
            <div key={group.title} className="lg:col-span-1">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-foreground">
                {group.title}
              </h3>
              <ul className="space-y-3">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-all duration-200 hover:text-primary hover:translate-x-0.5 inline-block"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Social & Language */}
          <div className="lg:col-span-3">
            <div className="flex flex-col h-full justify-between">
              <div>
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-foreground">
                  {t('connect')}
                </h3>
                <div className="flex gap-3 mb-6">
                  {socialLinks.map((social) => {
                    const Icon = social.icon;
                    return (
                      <a
                        key={social.label}
                        href={social.href}
                        aria-label={social.label}
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-lg border bg-background text-muted-foreground",
                          "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
                          social.hoverColor
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </a>
                    );
                  })}
                </div>
              </div>
              <div className="mt-4">
                <LanguageSwitcher />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} SaaS Template. {t('allRightsReserved')}</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-primary transition-colors">
              {t('privacy')}
            </Link>
            <Link href="/terms" className="hover:text-primary transition-colors">
              {t('terms')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
