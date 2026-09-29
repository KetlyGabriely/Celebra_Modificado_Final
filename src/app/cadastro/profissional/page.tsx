"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { cadastrarUsuario } from "@/controllers/authController";
import "./cadastroProfissional.css";

export default function CadastroProfissionalPage() {
  const router = useRouter();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function cadastrar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro("");

    if (!nome.trim()) {
      setErro("Informe seu nome.");
      return;
    }

    if (senha.length < 6) {
      setErro("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }

    if (senha !== confirmarSenha) {
      setErro("As senhas não são iguais.");
      return;
    }

    try {
      setCarregando(true);

      const resultado = await cadastrarUsuario({
        nome: nome.trim(),
        email: email.trim(),
        senha,
        tipo: "profissional",
      });

      if (resultado.session) {
        router.push("/profissional");
        router.refresh();
        return;
      }

      router.push("/login");
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível criar sua conta."
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="cadastro-profissional-page">
      <div className="prof-decoracao prof-decoracao-topo" />
      <div className="prof-decoracao prof-decoracao-baixo" />

      {/* HEADER */}
      <header className="prof-header">
        <button
          type="button"
          className="prof-logo"
          onClick={() => router.push("/")}
        >
          <span>✦</span>
          Celebra
        </button>

        <button
          type="button"
          className="prof-voltar"
          onClick={() => router.push("/cadastro")}
        >
          ← Voltar
        </button>
      </header>

      {/* CONTEÚDO */}
      <section className="prof-conteudo">
        {/* LADO ESQUERDO */}
        <div className="prof-apresentacao">
          <span className="prof-label">
            PARA PROFISSIONAIS
          </span>

          <h1>
            Transforme seu trabalho em novas oportunidades.
          </h1>

          <p className="prof-descricao">
            Faça parte da Celebra, apresente seus serviços e
            conecte-se com pessoas que estão planejando momentos
            especiais.
          </p>

          <div className="prof-beneficios">
            <div className="prof-beneficio">
              <div className="prof-beneficio-icone">✦</div>

              <div>
                <strong>Divulgue seus serviços</strong>

                <p>
                  Cadastre os serviços que você oferece e
                  apresente seu trabalho aos clientes.
                </p>
              </div>
            </div>

            <div className="prof-beneficio">
              <div className="prof-beneficio-icone">♡</div>

              <div>
                <strong>Receba interesses</strong>

                <p>
                  Clientes podem demonstrar interesse diretamente
                  nos seus serviços e solicitar um orçamento.
                </p>
              </div>
            </div>

            <div className="prof-beneficio">
              <div className="prof-beneficio-icone">◇</div>

              <div>
                <strong>Encontre oportunidades</strong>

                <p>
                  Visualize eventos publicados compatíveis com
                  seus serviços e envie propostas aos clientes.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* FORMULÁRIO */}
        <div className="prof-form-card">
          <div className="prof-form-cabecalho">
            <span>CRIAR CONTA</span>

            <h2>Cadastro profissional</h2>

            <p>
              Comece criando seu acesso à Celebra.
            </p>
          </div>

          <form onSubmit={cadastrar}>
            <div className="prof-campo">
              <label htmlFor="nome">
                Nome completo
              </label>

              <input
                id="nome"
                type="text"
                value={nome}
                onChange={(event) =>
                  setNome(event.target.value)
                }
                placeholder="Digite seu nome"
                autoComplete="name"
                required
              />
            </div>

            <div className="prof-campo">
              <label htmlFor="email">
                E-mail
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="seu@email.com"
                autoComplete="email"
                required
              />
            </div>

            <div className="prof-form-linha">
              <div className="prof-campo">
                <label htmlFor="senha">
                  Senha
                </label>

                <input
                  id="senha"
                  type="password"
                  value={senha}
                  onChange={(event) =>
                    setSenha(event.target.value)
                  }
                  placeholder="Mínimo 6 caracteres"
                  minLength={6}
                  autoComplete="new-password"
                  required
                />
              </div>

              <div className="prof-campo">
                <label htmlFor="confirmarSenha">
                  Confirmar senha
                </label>

                <input
                  id="confirmarSenha"
                  type="password"
                  value={confirmarSenha}
                  onChange={(event) =>
                    setConfirmarSenha(event.target.value)
                  }
                  placeholder="Repita sua senha"
                  minLength={6}
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>

            {erro && (
              <div className="prof-erro">
                <span>!</span>
                <p>{erro}</p>
              </div>
            )}

            <button
              type="submit"
              className="prof-submit"
              disabled={carregando}
            >
              <span>
                {carregando
                  ? "Criando sua conta..."
                  : "Criar conta profissional"}
              </span>

              {!carregando && <span>→</span>}
            </button>
          </form>

          <div className="prof-login">
            <span>Já possui uma conta?</span>

            <button
              type="button"
              onClick={() => router.push("/login")}
            >
              Entrar →
            </button>
          </div>
        </div>
      </section>

      <footer className="prof-footer">
        <span>✦</span>
        Planeje. Conecte. Celebre.
      </footer>
    </main>
  );
}