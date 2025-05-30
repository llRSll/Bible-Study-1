import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // Skip auth check for assets and API routes
  if (
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/api') ||
    request.nextUrl.pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js)$/)
  ) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  try {
    // Create a timeout promise that resolves after 2 seconds
    const timeoutPromise = new Promise((resolve) => {
      setTimeout(() => resolve({ data: { user: null } }), 2000);
    });
    
    // Race the auth request against the timeout
    const { data: { user } } = await Promise.race([
      supabase.auth.getUser(),
      timeoutPromise
    ]) as { data: { user: any } };

    // Redirects based on authentication state
    if (
      !user &&
      !request.nextUrl.pathname.includes("/login") &&
      !request.nextUrl.pathname.includes("/signup") &&
      !request.nextUrl.pathname.includes("/auth")
    ) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/login";
      return NextResponse.redirect(url);
    }

    if (
      user &&
      (request.nextUrl.pathname.includes("/login") ||
        request.nextUrl.pathname.includes("/signup"))
    ) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  } catch (error) {
    console.error("Auth middleware error:", error);
    // Continue the request even if auth check fails
  }

  return supabaseResponse;
}
