import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/middleware';
import { isPublicPath } from '@/app/api/config';

export async function proxy(request: NextRequest) {
  try {
    // Create Supabase client with request context
    const { supabase, response } = createClient(request);

    // Get the URL path
    const path = request.nextUrl.pathname;

    // Skip auth for public paths (including webhooks)
    if (isPublicPath(path)) {
      return response;
    }

    // Refresh session if it exists
    await supabase.auth.getSession();

    // Get the session after potential refresh
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const isAuthRoute = path === '/login' || path === '/signup';
    const isApiRoute = path.startsWith('/api');
    const isPublicRoute = path === '/';

    // Handle API routes
    if (isApiRoute) {
      // Require auth for API routes
      if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      return response;
    }

    // Redirect authorized users away from auth pages
    if (session && isAuthRoute) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Redirect unauthorized users to login from protected pages
    if (!session && !isAuthRoute && !isPublicRoute) {
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('next', path);
      return NextResponse.redirect(redirectUrl);
    }

    return response;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    // If there's an error, just continue the request
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (e.g. images)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
