"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/services/supabase";
import "./configuracoes.css";

export default function ConfiguracoesProfissionalPage() {
  const [email, setEmail] = useState("");
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      try {
        const { data, error } = await supabase.auth.getUser();

        if (error) throw error;
        if (!data.user) {
          throw new Error("Usuário não autenticado.");
        }

        if (ativo) {
          setEmail(data.user.email || "");
        }
      } catch (error) {
        console.error(error);

        if (ativo) {
          setErro("Não foi possível carregar sua conta.");
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

  async function alterarSenha(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (salvando) return;

    setMensagem("");
    setErro("");

    if (!email) {
      setErro("Não foi possível identificar o e-mail da conta.");
      return;
    }

    if (!senhaAtual) {
      setErro("Informe sua senha atual.");
      return;
    }

    if (novaSenha.length < 8) {
      setErro("A nova senha deve ter pelo menos 8 caracteres.");
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setErro("A confirmação não corresponde à nova senha.");
      return;
    }

    if (novaSenha === senhaAtual) {
      setErro("A nova senha deve ser diferente da senha atual.");
      return;
    }

    setSalvando(true);

    try {
      const { error: erroAutenticacao } =
        await supabase.auth.signInWithPassword({
          email,
          password: senhaAtual,
        });

      if (erroAutenticacao) {
        throw new Error(
          "Não foi possível confirmar a senha atual. Verifique-a e tente novamente."
        );
      }

      const { error: erroAtualizacao } =
        await supabase.auth.updateUser({
          password: novaSenha,
        });

      if (erroAtualizacao) {
        throw erroAtualizacao;
      }

      setSenhaAtual("");
      setNovaSenha("");
      setConfirmarSenha("");

      setMensagem("Senha alterada com sucesso!");
    } catch (error) {
      console.error(error);

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível alterar a senha."
      );
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return (
      <div className="config-prof-page">
        <p className="config-prof-carregando">
          Carregando configurações...
        </p>
      </div>
    );
  }

  return (
    <div className="config-prof-page">
      <header className="config-prof-header">
        <span className="prof-dashboard-label">
          MINHA CONTA
        </span>

        <h1>Configurações</h1>

        <p>
          Gerencie a segurança e as informações de acesso
          da sua conta profissional no Celebra.
        </p>
      </header>

      <section className="config-prof-card">
        <div className="config-prof-secao">
          <span className="config-prof-numero">01</span>

          <div>
            <h2>E-mail da conta</h2>
            <p>
              Este é o endereço utilizado para acessar
              sua conta profissional.
            </p>
          </div>
        </div>

        <label className="config-prof-campo">
          E-mail cadastrado
          <input
            type="email"
            value={email}
            disabled
            title="O e-mail não pode ser alterado nesta página"
          />
        </label>
      </section>

      <section className="config-prof-card">
        <div className="config-prof-secao">
          <span className="config-prof-numero">02</span>

          <div>
            <h2>Alterar senha</h2>
            <p>
              Para sua segurança, confirme a senha atual
              antes de definir uma nova.
            </p>
          </div>
        </div>

        <form
          onSubmit={alterarSenha}
          className="config-prof-form"
        >
          <label className="config-prof-campo">
            Senha atual
            <input
              type="password"
              value={senhaAtual}
              onChange={(e) =>
                setSenhaAtual(e.target.value)
              }
              autoComplete="current-password"
              required
              placeholder="Digite sua senha atual"
            />
          </label>

          <div className="config-prof-grid">
            <label className="config-prof-campo">
              Nova senha
              <input
                type="password"
                value={novaSenha}
                onChange={(e) =>
                  setNovaSenha(e.target.value)
                }
                autoComplete="new-password"
                minLength={8}
                required
                placeholder="Mínimo de 8 caracteres"
              />
            </label>

            <label className="config-prof-campo">
              Confirmar nova senha
              <input
                type="password"
                value={confirmarSenha}
                onChange={(e) =>
                  setConfirmarSenha(e.target.value)
                }
                autoComplete="new-password"
                required
                placeholder="Repita a nova senha"
              />
            </label>
          </div>

          <p className="config-prof-dica">
            Utilize uma senha forte, com pelo menos
            8 caracteres, e evite reutilizar senhas
            de outros serviços.
          </p>

          {mensagem && (
            <p
              className="config-prof-sucesso"
              role="status"
            >
              {mensagem}
            </p>
          )}

          {erro && (
            <p
              className="config-prof-erro"
              role="alert"
            >
              {erro}
            </p>
          )}

          <div className="config-prof-acoes">
            <button
              type="submit"
              disabled={salvando || !email}
            >
              {salvando
                ? "Alterando senha..."
                : "Atualizar senha"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
