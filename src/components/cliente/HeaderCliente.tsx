
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { buscarPerfil } from "@/controllers/perfilController";

export default function HeaderCliente() {
  const router = useRouter();

  const [nome, setNome] = useState("Cliente");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let ativo = true;

    async function carregarPerfil() {
      try {
        const perfil = await buscarPerfil();

        if (!ativo) return;

        setNome(perfil.nome || "Cliente");
        setAvatarUrl(perfil.avatar_url);
      } catch (error) {
        console.error("Erro ao carregar perfil:", error);
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    carregarPerfil();

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
    nome.trim().split(" ")[0] || "Cliente";

  const inicial =
    primeiroNome.charAt(0).toUpperCase() || "C";

  return (
    <header className="cliente-dashboard-header">
      <div>
        <span className="dashboard-header-label">
          ÁREA DO CLIENTE
        </span>
      </div>

      <button
        type="button"
        className="dashboard-usuario"
        onClick={() => router.push("/cliente/perfil")}
      >
        <div className="usuario-texto">
          <strong>
            {carregando ? "Carregando..." : primeiroNome}
          </strong>
          <span>Cliente</span>
        </div>

        <div className="usuario-avatar">
          {!carregando && avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Foto de perfil"
              className="usuario-avatar-imagem"
            />
          ) : (
            carregando ? "•" : inicial
          )}
        </div>
      </button>
    </header>
  );
}
