"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import {
  buscarMeuPerfil,
  loginUsuario,
} from "@/controllers/authController";

import "./Login.css";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function acessar(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    try {
      setErro("");
      setCarregando(true);

      if (!email.trim() || !senha.trim()) {
        throw new Error("Preencha o e-mail e a senha.");
      }

      await loginUsuario(email, senha);

      const perfil = await buscarMeuPerfil();

      if (!perfil) {
        throw new Error("Perfil do usuário não encontrado.");
      }

      if (perfil.tipo === "profissional") {
        router.push("/profissional");
        return;
      }

      if (perfil.tipo === "cliente") {
        router.push("/cliente");
        return;
      }

      if (perfil.tipo === "admin") {
        router.push("/admin");
        return;
      }

      throw new Error("Tipo de usuário inválido.");
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Erro ao realizar login."
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-container">

        {/* LOGO */}

        <div className="login-logo">
          <h1>Celebra</h1>
          <span>✦</span>
        </div>

        {/* CARD */}

        <form
          className="login-card"
          onSubmit={acessar}
        >
          <div className="login-header">
            <span>BEM-VINDO DE VOLTA</span>

            <h2>Entrar na sua conta</h2>

            <p>
              Acesse sua conta para continuar
              planejando momentos especiais.
            </p>
          </div>

          {/* ERRO */}

          {erro && (
            <div className="login-erro">
              {erro}
            </div>
          )}

          {/* EMAIL */}

          <div className="campo-login">
            <label htmlFor="email">
              E-mail
            </label>

            <input
              id="email"
              type="email"
              placeholder="Digite seu e-mail"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              autoComplete="email"
              required
            />
          </div>

          {/* SENHA */}

          <div className="campo-login">
            <label htmlFor="senha">
              Senha
            </label>

            <input
              id="senha"
              type="password"
              placeholder="Digite sua senha"
              value={senha}
              onChange={(e) =>
                setSenha(e.target.value)
              }
              autoComplete="current-password"
              required
            />
          </div>

          {/* BOTÃO */}

          <button
            className="botao-login"
            type="submit"
            disabled={carregando}
          >
            {carregando
              ? "Entrando..."
              : "Entrar"}
          </button>

          {/* CADASTRO */}

          <div className="login-cadastro">
            <p>
              Ainda não possui uma conta?
            </p>

            <button
              type="button"
              onClick={() =>
                router.push("/cadastro")
              }
            >
              Criar conta
            </button>
          </div>

          <button
            type="button"
            className="login-voltar-apresentacao"
            onClick={() =>
              router.push("/")
            }
          >
            Voltar para apresentação
          </button>
        </form>

        <p className="login-rodape">
          Planeje. Celebre. Viva momentos inesquecíveis.
        </p>

      </div>
    </div>
  );
}