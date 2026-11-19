"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import SidebarCliente from "@/components/cliente/SidebarCliente";
import HeaderCliente from "@/components/cliente/HeaderCliente";

import SidebarProfissional from "@/components/profissional/SidebarProfissional";
import HeaderProfissional from "@/components/profissional/HeaderProfissional";

import { supabase } from "@/services/supabase";

import "../cliente/cliente.css";
import "../profissional/profissional.css";

type TipoUsuario = "CLIENTE" | "PROFISSIONAL";

export default function FeedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();

  const [tipoUsuario, setTipoUsuario] =
    useState<TipoUsuario | null>(null);

  const [carregando, setCarregando] =
    useState(true);

  useEffect(() => {
    let ativo = true;

    async function verificarUsuario() {
      try {
        /* ================================================
           1. BUSCAR USUÁRIO AUTENTICADO
        ================================================= */

        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (!ativo) return;

        if (authError || !user) {
          router.replace("/login");
          return;
        }

        /* ================================================
           2. VERIFICAR SE É PROFISSIONAL
        ================================================= */

        const {
          data: profissional,
          error: erroProfissional,
        } = await supabase
          .from("profissionais")
          .select("usuario_id")
          .eq("usuario_id", user.id)
          .maybeSingle();

        if (!ativo) return;

        if (erroProfissional) {
          console.error(
            "Erro ao verificar profissional:",
            erroProfissional
          );
        }

        if (profissional) {
          setTipoUsuario("PROFISSIONAL");
          return;
        }

        /* ================================================
           3. VERIFICAR SE É CLIENTE
        ================================================= */

        const {
          data: cliente,
          error: erroCliente,
        } = await supabase
          .from("clientes")
          .select("usuario_id")
          .eq("usuario_id", user.id)
          .maybeSingle();

        if (!ativo) return;

        if (erroCliente) {
          console.error(
            "Erro ao verificar cliente:",
            erroCliente
          );
        }

        if (cliente) {
          setTipoUsuario("CLIENTE");
          return;
        }

        /* ================================================
           4. USUÁRIO SEM PERFIL
        ================================================= */

        console.error(
          "O usuário autenticado não possui perfil de cliente ou profissional."
        );

        router.replace("/login");
      } catch (error) {
        console.error(
          "Erro ao identificar usuário:",
          error
        );

        if (ativo) {
          router.replace("/login");
        }
      } finally {
        if (ativo) {
          setCarregando(false);
        }
      }
    }

    void verificarUsuario();

    return () => {
      ativo = false;
    };
  }, [router]);

  /* ====================================================
     CARREGAMENTO
  ==================================================== */

  if (carregando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#090909] text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-[#d6aa46]" />

          <p className="text-sm text-zinc-400">
            Carregando Feed Celebra...
          </p>
        </div>
      </div>
    );
  }

  /* ====================================================
     PROFISSIONAL
  ==================================================== */

  if (tipoUsuario === "PROFISSIONAL") {
    return (
      <div className="profissional-dashboard">
        <SidebarProfissional />

        <div className="profissional-area">
          <HeaderProfissional />

          <main className="profissional-main">
            {children}
          </main>
        </div>
      </div>
    );
  }

  /* ====================================================
     CLIENTE
  ==================================================== */

  if (tipoUsuario === "CLIENTE") {
    return (
      <div className="cliente-dashboard">
        <SidebarCliente />

        <div className="cliente-area">
          <HeaderCliente />

          <main className="cliente-main">
            {children}
          </main>
        </div>
      </div>
    );
  }

  return null;
}