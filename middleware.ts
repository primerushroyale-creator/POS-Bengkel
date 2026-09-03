import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const role = request.cookies.get('bengkel_role')?.value || 'kasir';

  // 1. Root route handling
  if (pathname === '/') {
    const url = request.nextUrl.clone();
    if (role === 'mekanik') {
      url.pathname = '/admin/work-orders';
    } else {
      url.pathname = '/pos';
    }
    return NextResponse.redirect(url);
  }

  // 2. Proteksi Role: MEKANIK
  // Mekanik HANYA boleh mengakses /admin/work-orders (SPK Servis)
  if (role === 'mekanik') {
    const isAllowedMekanikRoute = pathname.startsWith('/admin/work-orders');
    if (!isAllowedMekanikRoute) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/work-orders';
      return NextResponse.redirect(url);
    }
  }

  // 3. Proteksi Role: KASIR
  // Kasir DILARANG mengakses Dashboard Owner (/admin), Master Produk (/admin/products), dan Audit Logs (/admin/audit-logs)
  if (role === 'kasir') {
    const isForbiddenKasirRoute =
      pathname === '/admin' ||
      pathname.startsWith('/admin/products') ||
      pathname.startsWith('/admin/audit-logs');

    if (isForbiddenKasirRoute) {
      const url = request.nextUrl.clone();
      url.pathname = '/pos';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files with extensions
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};
