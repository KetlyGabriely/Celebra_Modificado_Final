"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { buscarMeuPerfil } from "@/controllers/authController";

export default function HeaderProfissional() {
  const router = useRouter();

  const [nome, setNome] = useState("Profissional");

  useEffect(() => {
    async function carregar() {
      try {
        const perfil = await buscarMeuPerfil();

        if (perfil?.nome) {
          setNome(perfil.nome);
        }
      } catch (error) {
        console.error(error);
      }
    }

    carregar();
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
        className="prof-header-usuario"
        onClick={() =>
          router.push("/profissional/perfil")
        }
      >
        <div>
          <strong>{primeiroNome}</strong>
          <span>Profissional</span>
        </div>

        <div className="prof-header-avatar">
          {inicial}
        </div>
      </button>
    </header>
  );
}