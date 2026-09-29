"use client";

import { useRouter } from "next/navigation";
import "./landing.css";

export default function Home() {
  const router = useRouter();

  function irParaLogin() {
    router.push("/login");
  }

  function irParaCadastro() {
    router.push("/cadastro");
  }

  function scrollPara(id: string) {
    document
      .getElementById(id)
      ?.scrollIntoView({
        behavior: "smooth",
      });
  }

  return (
    <div className="apresentacao">
      {/* =========================
          HEADER
      ========================= */}

      <header className="apresentacao-header">
        <div className="logo">
          <div className="logo-icone">✦</div>

          <h1>Celebra</h1>
        </div>

        <nav className="menu">
          <button
            onClick={() =>
              scrollPara("como-funciona")
            }
          >
            Como funciona
          </button>

          <button
            onClick={() =>
              scrollPara("organizadores")
            }
          >
            Para organizadores
          </button>

          <button
            onClick={() =>
              scrollPara("profissionais")
            }
          >
            Para profissionais
          </button>

          <button
            onClick={() =>
              scrollPara("depoimentos")
            }
          >
            Depoimentos
          </button>
        </nav>

        <div className="header-acoes">
          <button
            className="botao-entrar"
            onClick={irParaLogin}
          >
            Entrar
          </button>

          <button
            className="botao-criar"
            onClick={irParaCadastro}
          >
            Criar conta
          </button>
        </div>
      </header>

      {/* =========================
          HERO
      ========================= */}

      <section className="hero">
        <div className="hero-decoracao decoracao-esquerda">
          ✦
        </div>

        <div className="hero-conteudo">
          <span className="hero-label">
            SUA CELEBRAÇÃO COMEÇA AQUI
          </span>

          <h2>Monte sua festa.</h2>

          <h3>Do sonho ao brinde.</h3>

          <p>
            Encontre profissionais, organize todos
            os detalhes e transforme sua ideia em
            uma celebração inesquecível.
          </p>

          <div className="hero-botoes">
            <button
              className="botao-organizador"
              onClick={() =>
                router.push("/cadastro/cliente")
              }
            >
              Quero organizar um evento
            </button>

            <button
              className="botao-profissional"
              onClick={() =>
                router.push("/cadastro/profissional")
              }
            >
              Sou profissional
            </button>
          </div>

          <button
            className="hero-link"
            onClick={() =>
              scrollPara("como-funciona")
            }
          >
            Descubra como funciona
          </button>
        </div>
      </section>

      {/* =========================
          ESTATÍSTICAS
      ========================= */}

      <section className="estatisticas">
        <div>
          <strong>2.847</strong>
          <span>EVENTOS PLANEJADOS</span>
        </div>

        <div>
          <strong>450+</strong>
          <span>PROFISSIONAIS</span>
        </div>

        <div>
          <strong>98%</strong>
          <span>SATISFAÇÃO</span>
        </div>
      </section>

      {/* =========================
          COMO FUNCIONA
      ========================= */}

      <section
        className="secao como-funciona"
        id="como-funciona"
      >
        <span className="secao-label">
          COMO FUNCIONA
        </span>

        <h2 className="titulo-secao">
          Tão simples quanto deve ser.
        </h2>

        <p className="descricao-secao">
          Tudo o que você precisa para começar
          a organizar sua celebração em um só lugar.
        </p>

        <div className="passos">
          <div className="passo">
            <div className="numero-passo">
              01
            </div>

            <div className="icone-passo">
              ⚡
            </div>

            <h3>
              Configure seu evento
            </h3>

            <p>
              Defina o tipo do evento,
              orçamento, número de convidados
              e a data desejada.
            </p>
          </div>

          <div className="passo">
            <div className="numero-passo">
              02
            </div>

            <div className="icone-passo">
              ◇
            </div>

            <h3>
              Reserve o espaço
            </h3>

            <p>
              Visualize opções disponíveis
              para o seu evento e encontre
              o lugar ideal.
            </p>
          </div>

          <div className="passo">
            <div className="numero-passo">
              03
            </div>

            <div className="icone-passo">
              ♙
            </div>

            <h3>
              Contrate profissionais
            </h3>

            <p>
              Compare profissionais e encontre
              profissionais para tornar seu
              evento completo.
            </p>
          </div>
        </div>

        <button
          className="botao-secao"
          onClick={() =>
            router.push("/cadastro/cliente")
          }
        >
          Montar meu evento
        </button>
      </section>

      {/* =========================
          O QUE VOCÊ ENCONTRA
      ========================= */}

      <section className="secao recursos">
        <div className="secao-cabecalho">
          <div>
            <span className="secao-label">
              TUDO EM UM SÓ LUGAR
            </span>

            <h2 className="titulo-secao">
              Tudo para o seu evento.
            </h2>
          </div>

          <p>
            A Celebra reúne diferentes serviços
            para facilitar cada etapa do planejamento.
          </p>
        </div>

        <div className="grid-recursos">
          <div className="recurso">
            <span>📸</span>

            <h3>Fotografia</h3>

            <p>
              Registre os melhores momentos
              da sua celebração.
            </p>
          </div>

          <div className="recurso">
            <span>🍽</span>

            <h3>Gastronomia</h3>

            <p>
              Encontre opções para diferentes
              estilos e quantidades de convidados.
            </p>
          </div>

          <div className="recurso">
            <span>✿</span>

            <h3>Decoração</h3>

            <p>
              Crie ambientes que combinam
              com a personalidade do evento.
            </p>
          </div>

          <div className="recurso">
            <span>♫</span>

            <h3>Música</h3>

            <p>
              Escolha profissionais para
              criar a trilha sonora perfeita.
            </p>
          </div>

          <div className="recurso">
            <span>✦</span>

            <h3>Floricultura</h3>

            <p>
              Flores e detalhes especiais
              para deixar o ambiente único.
            </p>
          </div>

          <div className="recurso">
            <span>◉</span>

            <h3>Transporte</h3>

            <p>
              Soluções para facilitar
              a chegada dos seus convidados.
            </p>
          </div>
        </div>
      </section>

      {/* =========================
          TIPOS DE EVENTOS
      ========================= */}

      <section className="secao tipos-eventos">
        <span className="secao-label">
          TODA CELEBRAÇÃO IMPORTA
        </span>

        <h2 className="titulo-secao">
          Qual é o seu momento?
        </h2>

        <p className="descricao-secao">
          Cada evento é único. A Celebra ajuda
          você a encontrar as melhores opções
          para cada tipo de celebração.
        </p>

        <div className="grid-eventos">
          <div className="card-evento">
            <span>♡</span>

            <h3>Casamentos</h3>

            <p>
              Do primeiro planejamento
              até o grande dia.
            </p>
          </div>

          <div className="card-evento">
            <span>🎂</span>

            <h3>Aniversários</h3>

            <p>
              Celebre cada momento
              do seu jeito.
            </p>
          </div>

          <div className="card-evento">
            <span>🎓</span>

            <h3>Formaturas</h3>

            <p>
              Uma conquista merece
              uma grande celebração.
            </p>
          </div>

          <div className="card-evento">
            <span>✦</span>

            <h3>Festas e eventos</h3>

            <p>
              Encontre profissionais
              para qualquer ocasião.
            </p>
          </div>
        </div>
      </section>

      {/* =========================
          ORGANIZADORES
      ========================= */}

      <section
        className="secao publico"
        id="organizadores"
      >
        <div className="publico-texto">
          <span className="secao-label">
            PARA QUEM ORGANIZA
          </span>

          <h2>
            Planeje sem transformar
            a organização em um problema.
          </h2>

          <p>
            Organizar um evento envolve muitas
            decisões. Com a Celebra, você pode
            começar definindo o seu orçamento
            e encontrar serviços adequados
            para sua celebração.
          </p>

          <ul>
            <li>✓ Defina seu orçamento</li>

            <li>
              ✓ Escolha os serviços necessários
            </li>

            <li>✓ Encontre profissionais</li>

            <li>✓ Organize seu evento</li>
          </ul>

          <button
            className="botao-organizador"
            onClick={() =>
              router.push("/cadastro/cliente")
            }
          >
            Começar a planejar
          </button>
        </div>

        <div className="publico-card">
          <span>SEU EVENTO</span>

          <h3>Casamento</h3>

          <div className="linha-card">
            Orçamento
            <strong>R$ 25.000</strong>
          </div>

          <div className="linha-card">
            Convidados
            <strong>150 pessoas</strong>
          </div>

          <div className="linha-card">
            Serviços
            <strong>6 selecionados</strong>
          </div>

          <button>
            Continuar planejamento
          </button>
        </div>
      </section>

      {/* =========================
          PROFISSIONAIS
      ========================= */}

      <section
        className="secao publico publico-invertido"
        id="profissionais"
      >
        <div className="publico-card profissional-card">
          <span>
            ÁREA PROFISSIONAL
          </span>

          <h3>
            Sua empresa na Celebra.
          </h3>

          <div className="mini-estatisticas">
            <div>
              <strong>24</strong>

              <span>
                NOVOS CONTATOS
              </span>
            </div>

            <div>
              <strong>12</strong>

              <span>
                SERVIÇOS
              </span>
            </div>
          </div>
        </div>

        <div className="publico-texto">
          <span className="secao-label">
            PARA PROFISSIONAIS
          </span>

          <h2>
            Transforme sua experiência
            em novas oportunidades.
          </h2>

          <p>
            Cadastre sua empresa e seus serviços
            para fazer parte de uma plataforma
            voltada para pessoas que estão
            organizando momentos especiais.
          </p>

          <ul>
            <li>✓ Cadastre sua empresa</li>

            <li>✓ Divulgue seus serviços</li>

            <li>✓ Gerencie suas informações</li>

            <li>✓ Alcance novos clientes</li>
          </ul>

          <button
            className="botao-profissional destaque"
            onClick={() =>
              router.push("/cadastro/profissional")
            }
          >
            Quero ser profissional
          </button>
        </div>
      </section>

      {/* =========================
          DEPOIMENTOS
      ========================= */}

      <section
        className="secao depoimentos"
        id="depoimentos"
      >
        <span className="secao-label">
          EXPERIÊNCIAS QUE CELEBRAM
        </span>

        <h2 className="titulo-secao">
          Quem usa, recomenda.
        </h2>

        <div className="grid-depoimentos">
          <article className="depoimento">
            <div className="aspas">
              “
            </div>

            <p>
              Gostei muito da ideia de poder
              começar definindo o orçamento
              antes de procurar os serviços.
            </p>

            <strong>
              Ana Clara
            </strong>

            <span>
              Organizadora de evento
            </span>
          </article>

          <article className="depoimento">
            <div className="aspas">
              “
            </div>

            <p>
              Uma plataforma interessante para
              profissionais apresentarem seus
              serviços de forma organizada.
            </p>

            <strong>
              Lucas Martins
            </strong>

            <span>
              Profissional de eventos
            </span>
          </article>

          <article className="depoimento">
            <div className="aspas">
              “
            </div>

            <p>
              A organização de um evento pode
              envolver muita coisa. Ter tudo
              reunido facilita bastante.
            </p>

            <strong>
              Mariana Costa
            </strong>

            <span>
              Organizadora
            </span>
          </article>
        </div>
      </section>

      {/* =========================
          FAQ
      ========================= */}

      <section className="secao faq">
        <span className="secao-label">
          DÚVIDAS FREQUENTES
        </span>

        <h2 className="titulo-secao">
          Perguntas que podem surgir.
        </h2>

        <div className="faq-lista">
          <details>
            <summary>
              O que é a Celebra?
            </summary>

            <p>
              A Celebra é uma plataforma criada
              para ajudar na organização de eventos
              e na conexão entre organizadores
              e profissionais.
            </p>
          </details>

          <details>
            <summary>
              Posso começar planejando pelo orçamento?
            </summary>

            <p>
              Sim. Você pode informar um orçamento
              máximo para ajudar na seleção dos
              serviços para seu evento.
            </p>
          </details>

          <details>
            <summary>
              Quais tipos de eventos posso organizar?
            </summary>

            <p>
              A plataforma pode ser utilizada para
              diferentes tipos de celebrações,
              como casamentos, aniversários,
              formaturas e festas.
            </p>
          </details>

          <details>
            <summary>
              Sou profissional. Posso cadastrar meus serviços?
            </summary>

            <p>
              Sim. Profissionais podem criar uma
              conta específica para cadastrar
              informações sobre a empresa e
              os serviços oferecidos.
            </p>
          </details>
        </div>
      </section>

      {/* =========================
          CTA FINAL
      ========================= */}

      <section className="cta-final">
        <span>
          PRONTO PARA COMEÇAR?
        </span>

        <h2>
          Seu próximo momento especial
          começa aqui.
        </h2>

        <p>
          Crie sua conta e comece a planejar
          sua próxima celebração.
        </p>

        <div>
          <button
            className="botao-organizador"
            onClick={irParaCadastro}
          >
            Criar minha conta
          </button>

          <button
            className="botao-profissional"
            onClick={irParaLogin}
          >
            Já tenho uma conta
          </button>
        </div>
      </section>

      {/* =========================
          FOOTER
      ========================= */}

      <footer>
        <div className="footer-logo">
          <div className="logo-icone">
            ✦
          </div>

          <h2>
            Celebra
          </h2>
        </div>

        <br />

        <p>
          Planeje. Conecte. Celebre.
        </p>

        <br />

        <small>
          © 2026 Celebra. Todos os direitos reservados.
        </small>
      </footer>
    </div>
  );
}