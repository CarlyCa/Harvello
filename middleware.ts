import { NextRequest, NextResponse } from "next/server";

const ADMIN_REALM = "Harvello Admin";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
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
  matcher: ["/admin/:path*", "/dashboard/:path*", "/api/demo/:path*"]
};
