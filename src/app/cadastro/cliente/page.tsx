"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { cadastrarUsuario } from "@/controllers/authController";
import "./cadastroCliente.css";

export default function CadastroClientePage() {
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
        tipo: "cliente",
      });

      if (resultado.session) {
        router.push("/cliente");
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
    <main className="cadastro-cliente-page">
      <div className="cliente-decoracao cliente-decoracao-topo" />
      <div className="cliente-decoracao cliente-decoracao-baixo" />

      {/* HEADER */}
      <header className="cliente-header">
        <button
          type="button"
          className="cliente-logo"
          onClick={() => router.push("/")}
        >
          <span>✦</span>
          Celebra
        </button>

        <button
          type="button"
          className="cliente-voltar"
          onClick={() => router.push("/cadastro")}
        >
          ← Voltar
        </button>
      </header>

      {/* CONTEÚDO */}
      <section className="cliente-conteudo">
        {/* LADO ESQUERDO */}
        <div className="cliente-apresentacao">
          <span className="cliente-label">
            PARA QUEM ORGANIZA
          </span>

          <h1>
            Sua próxima celebração começa aqui.
          </h1>

          <p className="cliente-descricao">
            Crie sua conta e encontre tudo o que precisa para
            planejar momentos especiais.
          </p>

          <div className="cliente-beneficios">
            <div className="beneficio">
              <div className="beneficio-icone">◇</div>

              <div>
                <strong>Explore serviços</strong>
                <p>
                  Encontre espaços, buffet, decoração, fotografia
                  e outros serviços por categoria.
                </p>
              </div>
            </div>

            <div className="beneficio">
              <div className="beneficio-icone">♡</div>

              <div>
                <strong>Crie seus eventos</strong>
                <p>
                  Organize as principais informações da sua
                  celebração em um só lugar.
                </p>
              </div>
            </div>

            <div className="beneficio">
              <div className="beneficio-icone">✦</div>

              <div>
                <strong>Receba orçamentos</strong>
                <p>
                  Demonstre interesse em serviços e converse com
                  profissionais para receber propostas.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* FORMULÁRIO */}
        <div className="cliente-form-card">
          <div className="form-cabecalho">
            <span>CRIAR CONTA</span>

            <h2>Cadastro de cliente</h2>

            <p>
              Preencha seus dados para começar.
            </p>
          </div>

          <form onSubmit={cadastrar}>
            <div className="cliente-campo">
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

            <div className="cliente-campo">
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

            <div className="cliente-form-linha">
              <div className="cliente-campo">
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

              <div className="cliente-campo">
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
              <div className="cliente-erro">
                <span>!</span>
                <p>{erro}</p>
              </div>
            )}

            <button
              type="submit"
              className="cliente-submit"
              disabled={carregando}
            >
              <span>
                {carregando
                  ? "Criando sua conta..."
                  : "Criar minha conta"}
              </span>

              {!carregando && <span>→</span>}
            </button>
          </form>

          <div className="cliente-login">
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

      <footer className="cliente-footer">
        <span>✦</span>
        Planeje. Conecte. Celebre.
      </footer>
    </main>
  );
}