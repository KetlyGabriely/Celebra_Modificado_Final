"use client";

import { usePathname, useRouter } from "next/navigation";
import { logoutUsuario } from "@/controllers/authController";

export default function SidebarProfissional() {
  const router = useRouter();
  const pathname = usePathname();

  const itens = [
    {
      nome: "Início",
      rota: "/profissional",
      icone: "⌂",
    },
    {
      nome: "Meus serviços",
      rota: "/profissional/servicos",
      icone: "◇",
    },
    {
      nome: "Oportunidades",
      rota: "/profissional/eventos",
      icone: "✦",
    },
    {
      nome: "Interesses recebidos",
      rota: "/profissional/interesses",
      icone: "♡",
    },
    {
      nome: "Orçamentos",
      rota: "/profissional/orcamentos",
      icone: "▤",
    },
    {
      nome: "Meu perfil",
      rota: "/profissional/perfil",
      icone: "○",
    },
  ];

  function estaAtivo(rota: string) {
    if (rota === "/profissional") {
      return pathname === "/profissional";
    }

    return pathname.startsWith(rota);
  }

  async function sair() {
    try {
      await logoutUsuario();

      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Erro ao sair:", error);
    }
  }

  return (
    <aside className="profissional-sidebar">
      <button
        className="prof-sidebar-logo"
        onClick={() => router.push("/profissional")}
      >
        <span>✦</span>
        <strong>Celebra</strong>
      </button>

      <div className="prof-sidebar-divisor" />

      <span className="prof-sidebar-label">
        PROFISSIONAL
      </span>

      <nav className="prof-sidebar-nav">
        {itens.map((item) => (
          <button
            key={item.rota}
            className={`prof-sidebar-item ${
              estaAtivo(item.rota) ? "ativo" : ""
            }`}
            onClick={() => router.push(item.rota)}
          >
            <span className="prof-sidebar-icone">
              {item.icone}
            </span>

            <span>{item.nome}</span>
          </button>
        ))}
      </nav>

      <div className="prof-sidebar-final">
        <div className="prof-sidebar-dica">
          <span>✦</span>

          <div>
            <strong>Seu negócio</strong>
            <p>
              Mantenha seus serviços atualizados.
            </p>
          </div>
        </div>

        <button
          className="prof-sidebar-sair"
          onClick={sair}
        >
          <span>↪</span>
          Sair da conta
        </button>
      </div>
    </aside>
  );
}