"use client";

import { useRouter } from "next/navigation";
import "./cadastro.css";

export default function CadastroPage() {
  const router = useRouter();

  return (
    <main className="cadastro-page">
      <div className="decoracao decoracao-topo" />
      <div className="decoracao decoracao-baixo" />

      <header className="cadastro-header">
        <button
          className="cadastro-logo"
          onClick={() => router.push("/")}
        >
          <span>✦</span>
          Celebra
        </button>

        <button
          className="btn-voltar"
          onClick={() => router.push("/")}
        >
          ← Voltar
        </button>
      </header>

      <section className="cadastro-conteudo">
        <div className="cadastro-intro">
          <span className="cadastro-label">
            BEM-VINDO À CELEBRA
          </span>

          <h1>Como você quer começar?</h1>

          <p>
            Escolha o tipo de conta que combina com o que você
            deseja fazer na Celebra.
          </p>
        </div>

        <div className="cadastro-opcoes">
          <article className="cadastro-card">
            <div className="card-icone">♡</div>

            <span className="card-label">
              PARA QUEM ORGANIZA
            </span>

            <h2>Quero organizar</h2>

            <p>
              Encontre espaços, buffet, decoração e outros
              profissionais para tornar sua celebração especial.
            </p>

            <ul>
              <li>
                <span>✓</span>
                Explore serviços por categoria
              </li>

              <li>
                <span>✓</span>
                Crie e organize seus eventos
              </li>

              <li>
                <span>✓</span>
                Receba orçamentos de profissionais
              </li>
            </ul>

            <button
              className="btn-card btn-cliente"
              onClick={() =>
                router.push("/cadastro/cliente")
              }
            >
              Criar conta de cliente
              <span>→</span>
            </button>
          </article>

          <article className="cadastro-card destaque">
            <div className="card-tag">
              PARA PROFISSIONAIS
            </div>

            <div className="card-icone">✦</div>

            <span className="card-label">
              PARA QUEM REALIZA
            </span>

            <h2>Quero oferecer serviços</h2>

            <p>
              Apresente seu trabalho, encontre eventos e
              transforme novas oportunidades em clientes.
            </p>

            <ul>
              <li>
                <span>✓</span>
                Cadastre seus serviços
              </li>

              <li>
                <span>✓</span>
                Receba interesses de clientes
              </li>

              <li>
                <span>✓</span>
                Encontre eventos e envie orçamentos
              </li>
            </ul>

            <button
              className="btn-card btn-profissional"
              onClick={() =>
                router.push("/cadastro/profissional")
              }
            >
              Criar conta profissional
              <span>→</span>
            </button>
          </article>
        </div>

        <div className="ja-tem-conta">
          <span>Já faz parte da Celebra?</span>

          <button onClick={() => router.push("/login")}>
            Entrar na minha conta
          </button>
        </div>
      </section>

      <footer className="cadastro-footer">
        <span>✦</span>
        <p>Planeje. Conecte. Celebre.</p>
      </footer>
    </main>
  );
}