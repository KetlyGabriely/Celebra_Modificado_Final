"use client";

import {
  FormEvent,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import {
  enviarRecuperacaoSenha,
} from "@/controllers/authController";

import "./EsqueciSenha.css";

export default function EsqueciSenhaPage() {
  const router = useRouter();

  const [email, setEmail] =
    useState("");

  const [erro, setErro] =
    useState("");

  const [sucesso, setSucesso] =
    useState(false);

  const [carregando, setCarregando] =
    useState(false);

  async function enviar(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    try {
      setErro("");
      setCarregando(true);

      if (!email.trim()) {
        throw new Error(
          "Informe seu e-mail."
        );
      }

      await enviarRecuperacaoSenha(
        email
      );

      setSucesso(true);
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível enviar a recuperação."
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="recuperacao-page">
      <div className="recuperacao-container">

        <div className="recuperacao-logo">
          <h1>Celebra</h1>
          <span>✦</span>
        </div>

        <div className="recuperacao-card">

          {!sucesso ? (
            <>
              <div className="recuperacao-header">
                <span>
                  RECUPERAÇÃO DE CONTA
                </span>

                <h2>
                  Esqueceu sua senha?
                </h2>

                <p>
                  Informe o e-mail
                  cadastrado na sua conta.
                  Enviaremos as instruções
                  para criar uma nova senha.
                </p>
              </div>

              {erro && (
                <div className="recuperacao-erro">
                  <span>!</span>

                  <p>{erro}</p>
                </div>
              )}

              <form
                onSubmit={enviar}
                className="recuperacao-form"
              >
                <div className="recuperacao-campo">
                  <label htmlFor="email">
                    E-mail
                  </label>

                  <input
                    id="email"
                    type="email"
                    placeholder="Digite seu e-mail"
                    value={email}
                    onChange={(event) =>
                      setEmail(
                        event.target.value
                      )
                    }
                    autoComplete="email"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="recuperacao-enviar"
                  disabled={carregando}
                >
                  {carregando
                    ? "Enviando..."
                    : "Enviar recuperação"}
                </button>
              </form>
            </>
          ) : (
            <div className="recuperacao-sucesso">

              <div className="recuperacao-sucesso-icone">
                ✓
              </div>

              <span>
                E-MAIL ENVIADO
              </span>

              <h2>
                Verifique sua caixa de entrada
              </h2>

              <p>
                Se houver uma conta associada
                ao endereço informado, você
                receberá as instruções para
                redefinir sua senha.
              </p>

              <p className="recuperacao-dica">
                Não encontrou o e-mail?
                Verifique também sua caixa
                de spam ou lixo eletrônico.
              </p>

              <button
                type="button"
                className="recuperacao-voltar-login"
                onClick={() =>
                  router.push("/login")
                }
              >
                Voltar para o login
              </button>
            </div>
          )}

          {!sucesso && (
            <button
              type="button"
              className="recuperacao-voltar"
              onClick={() =>
                router.push("/login")
              }
            >
              ← Voltar para o login
            </button>
          )}

        </div>

        <p className="recuperacao-rodape">
          Planeje. Celebre. Viva momentos inesquecíveis.
        </p>

      </div>
    </div>
  );
}