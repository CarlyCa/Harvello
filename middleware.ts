import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const ADMIN_REALM = "Harvello Admin";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/civic-circle")) {
    return updateCivicSession(request);
  }
  const protectsAdminPage = pathname.startsWith("/admin") || pathname.startsWith("/dashboard");
  const protectsDemoMutation = pathname.startsWith("/api/demo/") && request.method === "PATCH";

  if (!protectsAdminPage && !protectsDemoMutation) return NextResponse.next();

  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    return new NextResponse("Admin password is not configured.", { status: 503 });
  }

  const authorization = request.headers.get("authorization");
  if (hasValidAdminAuth(authorization, password)) return NextResponse.next();

  return new NextResponse("Authentication required.", {
    status: 401,
    headers: {
      "WWW-Authenticate": `Basic realm="${ADMIN_REALM}", charset="UTF-8"`
    }
  });
}

async function updateCivicSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const publicPath = request.nextUrl.pathname === "/civic-circle/login" || request.nextUrl.pathname === "/civic-circle/reset-password";

  if (!url || !key) return response;
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      }
    }
  });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user && !publicPath) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/civic-circle/login";
    loginUrl.search = "";
    return NextResponse.redirect(loginUrl);
  }
  if (user && request.nextUrl.pathname === "/civic-circle/login") {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/civic-circle/dashboard";
    dashboardUrl.search = "";
    return NextResponse.redirect(dashboardUrl);
  }
  return response;
}

function hasValidAdminAuth(authorization: string | null, password: string) {
  if (!authorization?.startsWith("Basic ")) return false;

  try {
    const decoded = atob(authorization.slice("Basic ".length));
    const separatorIndex = decoded.indexOf(":");
    if (separatorIndex === -1) return false;

    const username = decoded.slice(0, separatorIndex);
    const submittedPassword = decoded.slice(separatorIndex + 1);
    return username === "admin" && submittedPassword === password;
  } catch {
    return false;
  }
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*", "/api/demo/:path*", "/civic-circle/:path*"]
};
