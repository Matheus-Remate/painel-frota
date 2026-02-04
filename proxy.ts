import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
    // 1. Basic response setup
    let response = NextResponse.next({
        request: { headers: request.headers },
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) { return request.cookies.get(name)?.value; },
                set(name: string, value: string, options: CookieOptions) {
                    request.cookies.set({ name, value, ...options });
                    response = NextResponse.next({ request: { headers: request.headers } });
                    response.cookies.set({ name, value, ...options });
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({ name, value: '', ...options });
                    response = NextResponse.next({ request: { headers: request.headers } });
                    response.cookies.set({ name, value: '', ...options });
                },
            },
        }
    );

    const pathname = request.nextUrl.pathname;

    // 2. Early exit for landing page if no session cookie exists (Avoid heavy getUser)
    const hasSessionCookie = request.cookies.getAll().some(c => c.name.includes('supabase-auth-token') || c.name.startsWith('sb-'));
    const publicRoutes = ['/login', '/forgot-password', '/reset-password', '/mobile', '/feedback', '/api/auth'];
    const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

    if (!hasSessionCookie && isPublicRoute) return response;
    if (!hasSessionCookie && pathname === '/') return response;

    // 3. User check (Potential bottleneck)
    const { data: { user } } = await supabase.auth.getUser();

    // 4. Redirects for unauthenticated users
    if (!user) {
        if (!isPublicRoute && pathname !== '/') {
            const loginUrl = new URL('/login', request.url);
            loginUrl.searchParams.set('redirect', pathname);
            return NextResponse.redirect(loginUrl);
        }
        return response;
    }

    // 5. Redirects for already logged users on login page
    if (pathname === '/login') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // 6. Role-based access control (RBAC) - Optimization: Only fetch if in dashboard
    if (pathname.startsWith('/dashboard')) {
        // Fetch profile with selective fields
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('user_id', user.id)
            .single();

        const userRole = profile?.role;

        // Gestor + Admin routes
        const gestorRoutes = ['/dashboard/approvals', '/dashboard/vehicles', '/dashboard/drivers', '/dashboard/settings'];
        if (gestorRoutes.some(route => pathname.startsWith(route))) {
            if (userRole !== 'admin' && userRole !== 'gestor') {
                return NextResponse.redirect(new URL('/dashboard/access-denied', request.url));
            }
        }

        // Solicitante specialization
        if (userRole === 'solicitante') {
            const allowedForSolicitante = ['/dashboard/requests', '/dashboard/profile', '/dashboard/access-denied', '/dashboard/occurrences'];
            const isAllowed = allowedForSolicitante.some(route => pathname.startsWith(route)) || pathname === '/dashboard';

            if (!isAllowed) {
                return NextResponse.redirect(new URL('/dashboard/requests', request.url));
            }
        }
    }

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
