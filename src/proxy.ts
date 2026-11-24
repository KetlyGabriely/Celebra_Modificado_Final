
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          supabaseResponse = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Verifica a sessão do usuário
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  const rotaCliente =
    pathname === "/cliente" ||
    pathname.startsWith("/cliente/");

  const rotaProfissional =
    pathname === "/profissional" ||
    pathname.startsWith("/profissional/");

  // Redireciona quem não estiver autenticado
  if (!user && (rotaCliente || rotaProfissional)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";

    const response = NextResponse.redirect(url);

    supabaseResponse.cookies.getAll().forEach((cookie) => {
      response.cookies.set(cookie);
    });

    return response;
  }

  // Verifica o tipo de usuário nas rotas protegidas
  if (user && (rotaCliente || rotaProfissional)) {
    const { data: perfil, error } = await supabase
      .from("perfis")
      .select("tipo")
      .eq("id", user.id)
      .maybeSingle();

    if (error || !perfil) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.search = "";

      const response = NextResponse.redirect(url);

      supabaseResponse.cookies.getAll().forEach((cookie) => {
        response.cookies.set(cookie);
      });

      return response;
    }

    const tipo = perfil.tipo;

    // Cliente não acessa a área profissional
    if (
      rotaProfissional &&
      tipo !== "profissional" &&
      tipo !== "admin"
    ) {
      const url = request.nextUrl.clone();
      url.pathname = "/cliente";
      url.search = "";

      const response = NextResponse.redirect(url);

      supabaseResponse.cookies.getAll().forEach((cookie) => {
        response.cookies.set(cookie);
      });

      return response;
    }

    // Profissional não acessa a área do cliente
    if (
      rotaCliente &&
      tipo !== "cliente" &&
      tipo !== "admin"
    ) {
      const url = request.nextUrl.clone();
      url.pathname = "/profissional";
      url.search = "";

      const response = NextResponse.redirect(url);

      supabaseResponse.cookies.getAll().forEach((cookie) => {
        response.cookies.set(cookie);
      });

      return response;
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/cliente/:path*",
    "/profissional/:path*",
  ],
};
