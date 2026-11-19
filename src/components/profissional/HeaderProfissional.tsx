"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { buscarPerfil } from "@/controllers/perfilController";
import { logoutUsuario } from "@/controllers/authController";

export default function HeaderProfissional() {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);

  const [nome, setNome] = useState("Profissional");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [menuAberto, setMenuAberto] = useState(false);

  useEffect(() => {
    let ativo = true;

    async function carregarPerfil() {
      try {
        const perfil = await buscarPerfil();

        if (!ativo) return;

        setNome(perfil.nome || "Profissional");
        setAvatarUrl(perfil.avatar_url);
      } catch (error) {
        console.error(
          "Erro ao carregar perfil profissional:",
          error
        );
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    function atualizarHeader(event: Event) {
      const evento = event as CustomEvent<{
        nome?: string;
        avatar_url?: string | null;
      }>;

      if (evento.detail?.nome !== undefined) {
        setNome(evento.detail.nome);
      }

      if (evento.detail?.avatar_url !== undefined) {
        setAvatarUrl(evento.detail.avatar_url);
      }
    }

    carregarPerfil();

    window.addEventListener(
      "celebra:perfil-atualizado",
      atualizarHeader
    );

    return () => {
      ativo = false;
      window.removeEventListener(
        "celebra:perfil-atualizado",
        atualizarHeader
      );
    };
  }, []);

  useEffect(() => {
    function fecharAoClicarFora(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setMenuAberto(false);
      }
    }

    function fecharComEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuAberto(false);
      }
    }

    document.addEventListener("mousedown", fecharAoClicarFora);
    document.addEventListener("keydown", fecharComEscape);

    return () => {
      document.removeEventListener("mousedown", fecharAoClicarFora);
      document.removeEventListener("keydown", fecharComEscape);
    };
  }, []);

  const primeiroNome =
    nome.trim().split(" ")[0] || "Profissional";

  const inicial =
    primeiroNome.charAt(0).toUpperCase() || "P";

  function abrirPerfil() {
    setMenuAberto(false);
    router.push("/profissional/perfil");
  }

  async function sairDaConta() {
    try {
      await logoutUsuario();
      router.replace("/login");
      router.refresh();
    } catch (error) {
      console.error("Erro ao sair da conta:", error);
    }
  }

  return (
    <header className="prof-dashboard-header">
      <span className="prof-header-label">
        PAINEL PROFISSIONAL
      </span>

      <div className="header-perfil-container" ref={menuRef}>
        <button
          type="button"
          className="prof-header-usuario"
          onClick={() => setMenuAberto((aberto) => !aberto)}
          aria-expanded={menuAberto}
          aria-haspopup="true"
        >
          <div>
            <strong>
              {carregando ? "Carregando..." : primeiroNome}
            </strong>
            <span>Profissional</span>
          </div>

          <div className="prof-header-avatar">
            {!carregando && avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Foto de perfil"
                className="prof-header-avatar-imagem"
              />
            ) : (
              carregando ? "•" : inicial
            )}
          </div>
        </button>

        {menuAberto && (
          <div className="header-perfil-dropdown">
            <button type="button" onClick={abrirPerfil}>
              <span>♙</span>
              Meu perfil
            </button>

            <div className="header-menu-divider" />

            <button
              type="button"
              className="header-menu-sair"
              onClick={sairDaConta}
            >
              <span>↪</span>
              Sair da conta
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
