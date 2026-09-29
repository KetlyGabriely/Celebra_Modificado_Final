"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { buscarMeuPerfil } from "@/controllers/authController";

export default function HeaderCliente() {
  const router = useRouter();

  const [nome, setNome] = useState("Cliente");
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregarPerfil() {
      try {
        const perfil = await buscarMeuPerfil();

        if (perfil?.nome) {
          setNome(perfil.nome);
        }
      } catch (error) {
        console.error(
          "Erro ao carregar perfil:",
          error
        );
      } finally {
        setCarregando(false);
      }
    }

    carregarPerfil();
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
        className="dashboard-usuario"
        onClick={() =>
          router.push("/cliente/perfil")
        }
      >
        <div className="usuario-texto">
          <strong>
            {carregando ? "Carregando..." : primeiroNome}
          </strong>

          <span>Cliente</span>
        </div>

        <div className="usuario-avatar">
          {carregando ? "•" : inicial}
        </div>
      </button>
    </header>
  );
}