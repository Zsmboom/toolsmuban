import { auth } from "@/lib/auth/config";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n';

// Create the internationalization middleware
const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localeDetection: false, // Disable automatic locale detection
  localePrefix: 'as-needed',
});

// Combined middleware that handles both i18n and auth
export default auth((req) => {
  const token = req.auth;
  const isAuth = !!token;
  const isAdmin = token?.user?.role === "admin";

  // Extract pathname without locale prefix
  const pathname = req.nextUrl.pathname;
  const pathnameWithoutLocale = pathname.replace(/^\/(en|zh)/, '') || '/';

  const isAuthPage = pathnameWithoutLocale.startsWith("/login");
  const isDashboard = pathnameWithoutLocale.startsWith("/dashboard");
  const isAdminRoute = pathnameWithoutLocale.startsWith("/admin");
  const isApiAdminRoute = pathname.startsWith("/api/admin");

  // Apply internationalization first
  const intlResponse = intlMiddleware(req);

  // Redirect authenticated users away from login page
  if (isAuthPage && isAuth) {
    const locale = pathname.match(/^\/(en|zh)/)?.[1] || defaultLocale;
    const dashboardUrl = locale === defaultLocale ? "/dashboard" : `/${locale}/dashboard`;
    return NextResponse.redirect(new URL(dashboardUrl, req.url));
  }

  // Protect dashboard routes
  if (isDashboard && !isAuth) {
    const locale = pathname.match(/^\/(en|zh)/)?.[1] || defaultLocale;
    const loginUrl = locale === defaultLocale ? "/login" : `/${locale}/login`;
    return NextResponse.redirect(new URL(loginUrl, req.url));
  }

  // Protect admin routes
  if ((isAdminRoute || isApiAdminRoute) && !isAdmin) {
    const locale = pathname.match(/^\/(en|zh)/)?.[1] || defaultLocale;
    const dashboardUrl = locale === defaultLocale ? "/dashboard" : `/${locale}/dashboard`;
    return NextResponse.redirect(new URL(dashboardUrl, req.url));
  }

  return intlResponse;
});

export const config = {
  // Match all pathnames except for API routes, static files, and images
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
