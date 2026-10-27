
"use client";

import { useEffect, useState } from "react";
import {
  buscarPerfil,
  atualizarPerfil,
  atualizarFotoPerfil,
  type DadosPerfil,
} from "@/controllers/perfilController";
import { supabase } from "@/services/supabase";
import "./perfil.css";

export default function PerfilProfissionalPage() {
  const [perfil, setPerfil] = useState<DadosPerfil | null>(null);
  const [email, setEmail] = useState("");
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [enviandoFoto, setEnviandoFoto] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      try {
        const [dados, resultadoAuth] = await Promise.all([
          buscarPerfil(),
          supabase.auth.getUser(),
        ]);

        if (resultadoAuth.error) {
          throw resultadoAuth.error;
        }

        if (!ativo) return;

        setPerfil(dados);
        setEmail(resultadoAuth.data.user?.email || "");
        setNome(dados.nome || "");
        setTelefone(dados.telefone || "");
        setCidade(dados.cidade || "");
        setEstado(dados.estado || "");
      } catch (error) {
        console.error(error);

        if (ativo) {
          setErro("Não foi possível carregar seu perfil.");
        }
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    carregar();

    return () => {
      ativo = false;
    };
  }, []);

  async function alterarFoto(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const arquivo = event.target.files?.[0];

    if (!arquivo || enviandoFoto) return;

    setEnviandoFoto(true);
    setMensagem("");
    setErro("");

    try {
      const novaUrl = await atualizarFotoPerfil(arquivo);

      setPerfil((anterior) =>
        anterior
          ? { ...anterior, avatar_url: novaUrl }
          : anterior
      );

      window.dispatchEvent(
        new CustomEvent("celebra:perfil-atualizado", {
          detail: { avatar_url: novaUrl },
        })
      );

      setMensagem("Foto de perfil atualizada com sucesso!");
    } catch (error) {
      console.error(error);

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar a foto."
      );
    } finally {
      setEnviandoFoto(false);
      event.target.value = "";
    }
  }

  async function salvar(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (salvando) return;

    setSalvando(true);
    setMensagem("");
    setErro("");

    try {
      const atualizado = await atualizarPerfil({
        nome,
        telefone,
        cidade,
        estado,
      });

      setPerfil(atualizado);
      setNome(atualizado.nome);
      setTelefone(atualizado.telefone || "");
      setCidade(atualizado.cidade || "");
      setEstado(atualizado.estado || "");

      window.dispatchEvent(
        new CustomEvent("celebra:perfil-atualizado", {
          detail: {
            nome: atualizado.nome,
            avatar_url: atualizado.avatar_url,
          },
        })
      );

      setMensagem("Perfil atualizado com sucesso!");
    } catch (error) {
      console.error(error);

      setErro(
        error instanceof Error
          ? error.message
          : "Erro ao salvar alterações."
      );
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return (
      <div className="perfil-prof-page">
        <p className="perfil-prof-carregando">
          Carregando perfil...
        </p>
      </div>
    );
  }

  if (!perfil) {
    return (
      <div className="perfil-prof-page">
        <p className="perfil-prof-erro" role="alert">
          {erro || "Perfil não encontrado."}
        </p>
      </div>
    );
  }

  return (
    <div className="perfil-prof-page">
      <header className="perfil-prof-header">
        <span className="prof-dashboard-label">
          MINHA CONTA
        </span>

        <h1>Meu Perfil</h1>

        <p>
          Gerencie suas informações profissionais e mantenha
          seus dados atualizados no Celebra.
        </p>
      </header>

      <div className="perfil-prof-card">
        <div className="perfil-prof-identidade">
          <div className="perfil-prof-foto-area">
            <div className="perfil-prof-avatar">
              {perfil.avatar_url ? (
                <img
                  src={perfil.avatar_url}
                  alt="Foto de perfil profissional"
                />
              ) : (
                <span>
                  {perfil.nome.charAt(0).toUpperCase() || "P"}
                </span>
              )}
            </div>

            <label
              htmlFor="upload-avatar-profissional"
              className={`perfil-prof-alterar-foto ${
                enviandoFoto ? "desabilitado" : ""
              }`}
            >
              {enviandoFoto
                ? "Enviando..."
                : "Alterar foto"}
            </label>

            <input
              id="upload-avatar-profissional"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={alterarFoto}
              disabled={enviandoFoto}
              className="perfil-prof-input-foto"
            />
          </div>

          <div className="perfil-prof-identidade-texto">
            <h2>{perfil.nome}</h2>
            <p>{email}</p>

            <span className="perfil-prof-tag">
              Profissional Celebra
            </span>
          </div>
        </div>

        <form
          onSubmit={salvar}
          className="perfil-prof-form"
        >
          <div className="perfil-prof-secao">
            <span className="perfil-prof-secao-numero">
              01
            </span>

            <div>
              <h3>Informações pessoais</h3>
              <p>
                Dados utilizados para identificar sua conta.
              </p>
            </div>
          </div>

          <div className="perfil-prof-grid">
            <label>
              Nome completo *
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
                maxLength={150}
                placeholder="Seu nome completo"
              />
            </label>

            <label>
              E-mail
              <input
                type="email"
                value={email}
                disabled
                title="O e-mail não pode ser alterado aqui"
              />
            </label>

            <label>
              Telefone
              <input
                type="tel"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                maxLength={20}
                placeholder="(00) 00000-0000"
              />
            </label>

            <label>
              Cidade
              <input
                type="text"
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
                maxLength={100}
                placeholder="Sua cidade"
              />
            </label>

            <label>
              Estado
              <input
                type="text"
                value={estado}
                onChange={(e) =>
                  setEstado(e.target.value.toUpperCase())
                }
                maxLength={2}
                placeholder="SP"
              />
            </label>
          </div>

          {mensagem && (
            <p
              className="perfil-prof-sucesso"
              role="status"
            >
              {mensagem}
            </p>
          )}

          {erro && (
            <p
              className="perfil-prof-erro"
              role="alert"
            >
              {erro}
            </p>
          )}

          <div className="perfil-prof-acoes">
            <button
              type="submit"
              disabled={salvando || enviandoFoto}
            >
              {salvando
                ? "Salvando..."
                : "Salvar alterações"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
