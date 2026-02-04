import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value;
                },
                set(name: string, value: string, options: CookieOptions) {
                    request.cookies.set({ name, value, ...options });
                    response = NextResponse.next({
                        request: { headers: request.headers },
                    });
                    response.cookies.set({ name, value, ...options });
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({ name, value: '', ...options });
                    response = NextResponse.next({
                        request: { headers: request.headers },
                    });
                    response.cookies.set({ name, value: '', ...options });
                },
            },
        }
    );

    const pathname = request.nextUrl.pathname;
    const publicRoutes = ['/login', '/forgot-password', '/reset-password', '/mobile', '/feedback', '/api/auth'];
    const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route)) || pathname === '/';

    // Se for rota pública, podemos retornar mais cedo se não for o login (que queremos redirecionar logados)
    // Mas para simplificar, vamos apenas garantir que não chamamos getUser() desnecessariamente se for estático
    // O matcher já cuida de estáticos, mas vamos manter a lógica aqui limpa.

    const { data: { user } } = await supabase.auth.getUser();

    // If not authenticated and trying to access protected route
    if (!user && !isPublicRoute) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // If authenticated and trying to access login page
    if (user && pathname === '/login') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Role-based access control for authenticated users
    if (user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('user_id', user.id)
            .single();

        const userRole = profile?.role;

        // Admin-only routes (none currently - users tab is hidden in UI for gestor)
        const adminOnlyRoutes: string[] = [];
        if (adminOnlyRoutes.some(route => pathname.startsWith(route))) {
            if (userRole !== 'admin') {
                return NextResponse.redirect(new URL('/dashboard/access-denied', request.url));
            }
        }

        // Gestor + Admin routes (including settings for brands/models management)
        const gestorRoutes = ['/dashboard/approvals', '/dashboard/vehicles', '/dashboard/drivers', '/dashboard/settings'];
        if (gestorRoutes.some(route => pathname.startsWith(route))) {
            if (userRole !== 'admin' && userRole !== 'gestor') {
                return NextResponse.redirect(new URL('/dashboard/access-denied', request.url));
            }
        }

        // Solicitante is restricted to requests and profile only
        if (userRole === 'solicitante') {
            const allowedForSolicitante = ['/dashboard/requests', '/dashboard/profile', '/dashboard/access-denied'];
            const isAllowed = allowedForSolicitante.some(route => pathname.startsWith(route))
                || pathname === '/dashboard';

            if (!isAllowed && pathname.startsWith('/dashboard')) {
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
