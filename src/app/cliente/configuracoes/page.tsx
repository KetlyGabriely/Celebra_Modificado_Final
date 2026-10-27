
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/services/supabase";
import "./configuracoes.css";

export default function ConfiguracoesClientePage() {
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
        if (!data.user) throw new Error("Usuário não autenticado.");

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
      // Confirma que a pessoa conhece a senha atual.
      const { error: erroAutenticacao } =
        await supabase.auth.signInWithPassword({
          email,
          password: senhaAtual,
        });

      if (erroAutenticacao) {
        throw new Error("A senha atual está incorreta.");
      }

      // Atualiza a senha no Supabase Auth.
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
      <div className="config-cliente-page">
        <p className="config-cliente-carregando">
          Carregando configurações...
        </p>
      </div>
    );
  }

  return (
    <div className="config-cliente-page">
      <header className="config-cliente-header">
        <span className="dashboard-label">
          MINHA CONTA
        </span>

        <h1>Configurações</h1>

        <p>
          Gerencie a segurança e as informações de acesso
          da sua conta Celebra.
        </p>
      </header>

      <section className="config-cliente-card">
        <div className="config-cliente-secao">
          <span className="config-cliente-numero">01</span>

          <div>
            <h2>E-mail da conta</h2>
            <p>
              Este é o endereço utilizado para acessar o Celebra.
            </p>
          </div>
        </div>

        <label className="config-cliente-campo">
          E-mail cadastrado
          <input
            type="email"
            value={email}
            disabled
            title="O e-mail não pode ser alterado nesta página"
          />
        </label>
      </section>

      <section className="config-cliente-card">
        <div className="config-cliente-secao">
          <span className="config-cliente-numero">02</span>

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
          className="config-cliente-form"
        >
          <label className="config-cliente-campo">
            Senha atual
            <input
              type="password"
              value={senhaAtual}
              onChange={(e) => setSenhaAtual(e.target.value)}
              autoComplete="current-password"
              required
              placeholder="Digite sua senha atual"
            />
          </label>

          <div className="config-cliente-grid">
            <label className="config-cliente-campo">
              Nova senha
              <input
                type="password"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
                placeholder="Mínimo de 8 caracteres"
              />
            </label>

            <label className="config-cliente-campo">
              Confirmar nova senha
              <input
                type="password"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                autoComplete="new-password"
                required
                placeholder="Repita a nova senha"
              />
            </label>
          </div>

          <p className="config-cliente-dica">
            Utilize uma senha forte e diferente das que você
            usa em outros serviços.
          </p>

          {mensagem && (
            <p className="config-cliente-sucesso" role="status">
              {mensagem}
            </p>
          )}

          {erro && (
            <p className="config-cliente-erro" role="alert">
              {erro}
            </p>
          )}

          <div className="config-cliente-acoes">
            <button type="submit" disabled={salvando || !email}>
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
