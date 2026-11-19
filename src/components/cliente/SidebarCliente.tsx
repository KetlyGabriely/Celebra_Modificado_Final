"use client";

import { usePathname, useRouter } from "next/navigation";

export default function SidebarCliente() {
  const router = useRouter();
  const pathname = usePathname();

  const itens = [
    { nome: "Início", rota: "/cliente", icone: "⌂" },
    { nome: "Explorar serviços", rota: "/cliente/servicos", icone: "◇" },
    { nome: "Meus eventos", rota: "/cliente/eventos", icone: "♡" },
    { nome: "Orçamentos", rota: "/cliente/orcamentos", icone: "▤" },
    { nome: "Favoritos", rota: "/cliente/favoritos", icone: "☆" },
    { nome: "Feed Celebra", rota: "/feed", icone: "◉" },
    { nome: "Meu perfil", rota: "/cliente/perfil", icone: "○" },
    {
      nome: "Configurações",
      rota: "/cliente/configuracoes",
      icone: "⚙",
    },
  ];

  function estaAtivo(rota: string) {
    if (rota === "/cliente") {
      return pathname === "/cliente";
    }

    return pathname.startsWith(rota);
  }

  return (
    <aside className="cliente-sidebar">
      <button
        className="sidebar-logo"
        onClick={() => router.push("/cliente")}
      >
        <span>✦</span>
        <strong>Celebra</strong>
      </button>

      <div className="sidebar-divisor" />

      <span className="sidebar-label">MENU</span>

      <nav className="sidebar-nav">
        {itens.map((item) => (
          <button
            key={item.rota}
            className={`sidebar-item ${
              estaAtivo(item.rota) ? "ativo" : ""
            }`}
            onClick={() => router.push(item.rota)}
          >
            <span className="sidebar-icone">
              {item.icone}
            </span>

            <span>{item.nome}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-final">
        <div className="sidebar-ajuda">
          <span className="ajuda-icone">?</span>

          <div>
            <strong>Precisa de ajuda?</strong>
            <p>Estamos aqui para você.</p>
          </div>
        </div>
      </div>
    </aside>
  );
}