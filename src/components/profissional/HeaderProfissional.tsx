"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { buscarPerfil } from "@/controllers/perfilController";

export default function HeaderProfissional() {
  const router = useRouter();

  const [nome, setNome] = useState("Profissional");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

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

  const primeiroNome =
    nome.trim().split(" ")[0] || "Profissional";

  const inicial =
    primeiroNome.charAt(0).toUpperCase() || "P";

  return (
    <header className="prof-dashboard-header">
      <span className="prof-header-label">
        PAINEL PROFISSIONAL
      </span>

      <button
        type="button"
        className="prof-header-usuario"
        onClick={() => router.push("/profissional/perfil")}
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
    </header>
  );
}
