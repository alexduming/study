import createIntlMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "@/core/i18n/config";
import { betterFetch } from "@better-fetch/fetch";
import { Session } from "better-auth";
import { envConfigs } from "@/config";

const intlMiddleware = createIntlMiddleware(routing);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Handle internationalization first
  const intlResponse = intlMiddleware(request);

  // Extract locale from pathname
  const locale = pathname.split("/")[1];
  const isValidLocale = routing.locales.includes(locale as any);
  const pathWithoutLocale = isValidLocale
    ? pathname.slice(locale.length + 1)
    : pathname;

  // Only check authentication for admin routes
  if (
    pathWithoutLocale.startsWith("/admin") ||
    pathWithoutLocale.startsWith("/settings") ||
    pathWithoutLocale.startsWith("/activity")
  ) {
    try {
      // Use configured auth_url instead of request.nextUrl.origin
      // This fixes the issue when deployed behind reverse proxy (like in Dokploy)
      // where request.nextUrl.origin returns internal address (e.g. http://localhost:3000)
      const baseURL = envConfigs.auth_url;

      const { data: session } = await betterFetch<Session>(
        "/api/auth/get-session",
        {
          baseURL: baseURL,
          headers: {
            cookie: request.headers.get("cookie") || "", // Forward the cookies from the request
          },
        }
      );

      console.log("session in proxy", session, baseURL);

      if (!session) {
        // Redirect to sign-in page with locale and callback URL
        const signInUrl = new URL(
          isValidLocale ? `/${locale}/sign-in` : "/sign-in",
          request.url
        );
        // Add the current path (including search params) as callback - use relative path for multi-language support
        const callbackPath = pathWithoutLocale + request.nextUrl.search;
        signInUrl.searchParams.set("callbackUrl", callbackPath);
        return NextResponse.redirect(signInUrl);
      }
    } catch (error) {
      // If session validation fails, redirect to sign-in
      const signInUrl = new URL(
        isValidLocale ? `/${locale}/sign-in` : "/sign-in",
        request.url
      );
      // Add the current path (including search params) as callback - use relative path for multi-language support
      const callbackPath = pathWithoutLocale + request.nextUrl.search;
      signInUrl.searchParams.set("callbackUrl", callbackPath);
      return NextResponse.redirect(signInUrl);
    }
  }

  intlResponse.headers.set("x-pathname", request.nextUrl.pathname);
  intlResponse.headers.set("x-url", request.url);

  // For all other routes (including /, /sign-in, /sign-up, /sign-out), just return the intl response
  return intlResponse;
}

export const config = {
  matcher:
    "/((?!api|trpc|_next|_vercel|privacy-policy|terms-of-service|.*\\..*).*)",
};
