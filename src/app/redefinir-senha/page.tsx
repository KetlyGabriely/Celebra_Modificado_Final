"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import { supabase } from "@/services/supabase";

import {
  redefinirSenha,
} from "@/controllers/authController";

import "./RedefinirSenha.css";

export default function RedefinirSenhaPage() {
  const router = useRouter();

  const [senha, setSenha] =
    useState("");

  const [confirmarSenha, setConfirmarSenha] =
    useState("");

  const [mostrarSenha, setMostrarSenha] =
    useState(false);

  const [erro, setErro] =
    useState("");

  const [sucesso, setSucesso] =
    useState(false);

  const [carregando, setCarregando] =
    useState(false);

  const [verificando, setVerificando] =
    useState(true);

  const [sessaoValida, setSessaoValida] =
    useState(false);

  useEffect(() => {
    let ativo = true;

    async function verificarSessao() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!ativo) return;

        if (session) {
          setSessaoValida(true);
        }

        /*
         * Quando o Supabase processa o link de recuperação,
         * a sessão também pode chegar por um evento de Auth.
         */
        const {
          data: { subscription },
        } =
          supabase.auth.onAuthStateChange(
            (event, sessionAtual) => {
              if (!ativo) return;

              if (
                event ===
                  "PASSWORD_RECOVERY" ||
                sessionAtual
              ) {
                setSessaoValida(true);
                setVerificando(false);
              }
            }
          );

        if (session) {
          setVerificando(false);
        } else {
          /*
           * Dá um pequeno tempo para o Supabase
           * processar o link de recuperação.
           */
          window.setTimeout(() => {
            if (ativo) {
              setVerificando(false);
            }
          }, 1500);
        }

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error(
          "Erro ao verificar recuperação:",
          error
        );

        if (ativo) {
          setVerificando(false);
        }
      }
    }

    let limpar:
      | (() => void)
      | undefined;

    verificarSessao().then(
      (resultado) => {
        if (resultado) {
          limpar = resultado;
        }
      }
    );

    return () => {
      ativo = false;

      if (limpar) {
        limpar();
      }
    };
  }, []);

  async function salvar(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    try {
      setErro("");
      setCarregando(true);

      if (!senha) {
        throw new Error(
          "Informe sua nova senha."
        );
      }

      if (senha.length < 6) {
        throw new Error(
          "A senha deve possuir pelo menos 6 caracteres."
        );
      }

      if (!confirmarSenha) {
        throw new Error(
          "Confirme sua nova senha."
        );
      }

      if (senha !== confirmarSenha) {
        throw new Error(
          "As senhas informadas não são iguais."
        );
      }

      await redefinirSenha(senha);

      setSucesso(true);

      /*
       * Encerra a sessão temporária criada
       * durante a recuperação.
       */
      await supabase.auth.signOut();

    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível redefinir sua senha."
      );
    } finally {
      setCarregando(false);
    }
  }

  if (verificando) {
    return (
      <div className="redefinir-page">
        <div className="redefinir-carregando">
          <div className="redefinir-spinner" />

          <p>
            Verificando seu link de recuperação...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="redefinir-page">
      <div className="redefinir-container">

        <div className="redefinir-logo">
          <h1>Celebra</h1>
          <span>✦</span>
        </div>

        <div className="redefinir-card">

          {!sessaoValida && !sucesso ? (
            <div className="redefinir-link-invalido">

              <div className="redefinir-alerta-icone">
                !
              </div>

              <span>
                LINK INVÁLIDO
              </span>

              <h2>
                Não foi possível validar a recuperação
              </h2>

              <p>
                Este link pode ter expirado,
                já ter sido utilizado ou não ser
                mais válido.
              </p>

              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/esqueci-senha"
                  )
                }
              >
                Solicitar novo link
              </button>

              <button
                type="button"
                className="redefinir-link-secundario"
                onClick={() =>
                  router.push("/login")
                }
              >
                Voltar para o login
              </button>

            </div>
          ) : sucesso ? (
            <div className="redefinir-sucesso">

              <div className="redefinir-sucesso-icone">
                ✓
              </div>

              <span>
                SENHA ALTERADA
              </span>

              <h2>
                Sua nova senha está pronta
              </h2>

              <p>
                A senha da sua conta foi
                redefinida com sucesso.
                Agora você pode entrar
                novamente no Celebra.
              </p>

              <button
                type="button"
                onClick={() =>
                  router.replace("/login")
                }
              >
                Ir para o login
              </button>

            </div>
          ) : (
            <>
              <div className="redefinir-header">

                <span>
                  NOVA SENHA
                </span>

                <h2>
                  Redefina sua senha
                </h2>

                <p>
                  Escolha uma nova senha para
                  acessar sua conta Celebra.
                </p>

              </div>

              {erro && (
                <div className="redefinir-erro">
                  <span>!</span>

                  <p>{erro}</p>
                </div>
              )}

              <form
                className="redefinir-form"
                onSubmit={salvar}
              >
                <div className="redefinir-campo">

                  <label htmlFor="senha">
                    Nova senha
                  </label>

                  <div className="redefinir-input-senha">

                    <input
                      id="senha"
                      type={
                        mostrarSenha
                          ? "text"
                          : "password"
                      }
                      placeholder="Digite sua nova senha"
                      value={senha}
                      onChange={(event) =>
                        setSenha(
                          event.target.value
                        )
                      }
                      autoComplete="new-password"
                      required
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setMostrarSenha(
                          (valor) => !valor
                        )
                      }
                    >
                      {mostrarSenha
                        ? "Ocultar"
                        : "Mostrar"}
                    </button>

                  </div>

                  <small>
                    Use pelo menos 6 caracteres.
                  </small>

                </div>

                <div className="redefinir-campo">

                  <label htmlFor="confirmarSenha">
                    Confirmar nova senha
                  </label>

                  <input
                    id="confirmarSenha"
                    type={
                      mostrarSenha
                        ? "text"
                        : "password"
                    }
                    placeholder="Digite novamente sua senha"
                    value={confirmarSenha}
                    onChange={(event) =>
                      setConfirmarSenha(
                        event.target.value
                      )
                    }
                    autoComplete="new-password"
                    required
                  />

                </div>

                <button
                  type="submit"
                  className="redefinir-enviar"
                  disabled={carregando}
                >
                  {carregando
                    ? "Alterando senha..."
                    : "Redefinir senha"}
                </button>

              </form>
            </>
          )}

        </div>

        <p className="redefinir-rodape">
          Planeje. Celebre. Viva momentos inesquecíveis.
        </p>

      </div>
    </div>
  );
}