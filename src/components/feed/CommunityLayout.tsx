"use client";

import { useEffect, useState } from "react";
import { buscarMeuPerfil } from "@/controllers/authController";
import SidebarCliente from "@/components/cliente/SidebarCliente";
import HeaderCliente from "@/components/cliente/HeaderCliente";
import SidebarProfissional from "@/components/profissional/SidebarProfissional";
import HeaderProfissional from "@/components/profissional/HeaderProfissional";
import FeedActionsRail from "@/components/feed/FeedActionsRail";

export default function CommunityLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [ehProfissional, setEhProfissional] = useState(false);

  useEffect(() => {
    let ativo = true;

    buscarMeuPerfil()
      .then((perfil) => {
        if (ativo) setEhProfissional(perfil?.tipo === "profissional");
      })
      .catch((error: unknown) => {
        console.error("Não foi possível identificar o tipo de perfil:", error);
        if (ativo) setEhProfissional(false);
      });

    return () => {
      ativo = false;
    };
  }, []);

  const DashboardSidebar = ehProfissional
    ? SidebarProfissional
    : SidebarCliente;
  const DashboardHeader = ehProfissional
    ? HeaderProfissional
    : HeaderCliente;

  return (
    <div className={ehProfissional ? "profissional-dashboard" : "cliente-dashboard"}>
      <DashboardSidebar />
      <FeedActionsRail />
      <div className={ehProfissional ? "profissional-area" : "cliente-area"}>
        <DashboardHeader />
        <main className={ehProfissional ? "profissional-main" : "cliente-main"}>
          {children}
        </main>
      </div>
    </div>
  );
}
