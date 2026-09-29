"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import {
  listarCategorias,
  listarServicos,
} from "@/controllers/servicoController";

import type {
  CategoriaServico,
  Servico,
} from "@/models/Servico";

export default function ServicosPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const categoriaInicial =
    searchParams.get("categoria") ?? "";

  const [servicos, setServicos] = useState<Servico[]>([]);
  const [categorias, setCategorias] = useState<
    CategoriaServico[]
  >([]);

  const [categoriaSelecionada, setCategoriaSelecionada] =
    useState(categoriaInicial);

  const [busca, setBusca] = useState("");
  const [buscaAplicada, setBuscaAplicada] = useState("");

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const carregarDados = useCallback(async () => {
    try {
      setCarregando(true);
      setErro("");

      const [categoriasData, servicosData] =
        await Promise.all([
          listarCategorias(),

          listarServicos({
            categoria:
              categoriaSelecionada || undefined,

            busca:
              buscaAplicada || undefined,
          }),
        ]);

      setCategorias(categoriasData);
      setServicos(servicosData);
    } catch (error) {
      console.error(error);

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar os serviços."
      );
    } finally {
      setCarregando(false);
    }
  }, [categoriaSelecionada, buscaAplicada]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  function selecionarCategoria(slug: string) {
    setCategoriaSelecionada(slug);

    const params = new URLSearchParams(
      searchParams.toString()
    );

    if (slug) {
      params.set("categoria", slug);
    } else {
      params.delete("categoria");
    }

    const query = params.toString();

    router.replace(
      query
        ? `/cliente/servicos?${query}`
        : "/cliente/servicos"
    );
  }

  function pesquisar(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setBuscaAplicada(busca.trim());
  }

  function limparPesquisa() {
    setBusca("");
    setBuscaAplicada("");
  }

  return (
    <div className="servicos-page">
      {/* CABEÇALHO */}

      <section className="servicos-cabecalho">
        <div>
          <span className="dashboard-label">
            MARKETPLACE CELEBRA
          </span>

          <h1>Encontre o serviço ideal.</h1>

          <p>
            Explore profissionais e serviços para sua
            celebração. Você não precisa ter um evento
            criado para começar.
          </p>
        </div>
      </section>

      {/* PESQUISA */}

      <section className="servicos-pesquisa-area">
        <form
          className="servicos-pesquisa"
          onSubmit={pesquisar}
        >
          <span className="pesquisa-icone">⌕</span>

          <input
            type="text"
            value={busca}
            onChange={(event) =>
              setBusca(event.target.value)
            }
            placeholder="Busque por buffet, decoração, fotografia, cidade..."
          />

          {busca && (
            <button
              type="button"
              className="pesquisa-limpar"
              onClick={limparPesquisa}
            >
              ×
            </button>
          )}

          <button
            type="submit"
            className="pesquisa-botao"
          >
            Buscar
          </button>
        </form>
      </section>

      {/* CATEGORIAS */}

      <section className="servicos-filtros">
        <button
          className={`filtro-categoria ${
            categoriaSelecionada === ""
              ? "selecionado"
              : ""
          }`}
          onClick={() => selecionarCategoria("")}
        >
          Todos
        </button>

        {categorias.map((categoria) => (
          <button
            key={categoria.id}
            className={`filtro-categoria ${
              categoriaSelecionada === categoria.slug
                ? "selecionado"
                : ""
            }`}
            onClick={() =>
              selecionarCategoria(categoria.slug)
            }
          >
            {categoria.icone && (
              <span>{categoria.icone}</span>
            )}

            {categoria.nome}
          </button>
        ))}
      </section>

      {/* RESULTADOS */}

      <section className="servicos-resultados">
        <div className="resultados-header">
          <div>
            <span className="dashboard-label">
              SERVIÇOS
            </span>

            <h2>
              {carregando
                ? "Buscando..."
                : `${servicos.length} ${
                    servicos.length === 1
                      ? "serviço encontrado"
                      : "serviços encontrados"
                  }`}
            </h2>
          </div>

          {(categoriaSelecionada ||
            buscaAplicada) && (
            <button
              className="limpar-filtros"
              onClick={() => {
                setCategoriaSelecionada("");
                setBusca("");
                setBuscaAplicada("");

                router.replace(
                  "/cliente/servicos"
                );
              }}
            >
              Limpar filtros
            </button>
          )}
        </div>

        {/* CARREGANDO */}

        {carregando && (
          <div className="servicos-loading">
            <div className="loading-simbolo">✦</div>

            <p>Buscando serviços...</p>
          </div>
        )}

        {/* ERRO */}

        {!carregando && erro && (
          <div className="servicos-erro">
            <span>!</span>

            <div>
              <strong>
                Não foi possível carregar os serviços.
              </strong>

              <p>{erro}</p>

              <button onClick={carregarDados}>
                Tentar novamente
              </button>
            </div>
          </div>
        )}

        {/* SEM RESULTADOS */}

        {!carregando &&
          !erro &&
          servicos.length === 0 && (
            <div className="servicos-vazio">
              <span>◇</span>

              <h3>Nenhum serviço encontrado</h3>

              <p>
                Tente selecionar outra categoria ou
                alterar sua pesquisa.
              </p>

              <button
                onClick={() => {
                  setCategoriaSelecionada("");
                  setBusca("");
                  setBuscaAplicada("");

                  router.replace(
                    "/cliente/servicos"
                  );
                }}
              >
                Ver todos os serviços
              </button>
            </div>
          )}

        {/* CARDS */}

        {!carregando &&
          !erro &&
          servicos.length > 0 && (
            <div className="servicos-grid">
              {servicos.map((servico) => (
                <ServicoCard
                  key={servico.id}
                  servico={servico}
                  onClick={() =>
                    router.push(
                      `/cliente/servicos/${servico.id}`
                    )
                  }
                />
              ))}
            </div>
          )}
      </section>
    </div>
  );
}

function ServicoCard({
  servico,
  onClick,
}: {
  servico: Servico;
  onClick: () => void;
}) {
  const preco =
    servico.preco_inicial != null
      ? new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
        }).format(Number(servico.preco_inicial))
      : null;

  const localizacao = [
    servico.cidade,
    servico.estado,
  ]
    .filter(Boolean)
    .join(" - ");

  return (
    <article
      className="servico-card"
      onClick={onClick}
    >
      <div className="servico-card-imagem">
        <div className="servico-card-placeholder">
          <span>
            {servico.categorias_servico?.icone ||
              "✦"}
          </span>
        </div>

        {servico.categorias_servico && (
          <span className="servico-categoria-tag">
            {servico.categorias_servico.nome}
          </span>
        )}

        <button
          type="button"
          className="servico-favorito-preview"
          title="Favoritos serão ativados em seguida"
          onClick={(event) => {
            event.stopPropagation();
          }}
        >
          ☆
        </button>
      </div>

      <div className="servico-card-conteudo">
        <div className="servico-profissional">
          <span>
            {servico.profissionais?.nome_empresa ||
              "Profissional Celebra"}
          </span>

          {servico.profissionais?.verificado && (
            <span
              className="profissional-verificado"
              title="Profissional verificado"
            >
              ✓
            </span>
          )}
        </div>

        <h3>{servico.nome}</h3>

        <p className="servico-descricao">
          {servico.descricao ||
            "Conheça este serviço e solicite mais informações ao profissional."}
        </p>

        <div className="servico-card-rodape">
          <div>
            {preco ? (
              <>
                <span className="preco-label">
                  A partir de
                </span>

                <strong>{preco}</strong>
              </>
            ) : (
              <strong>Sob consulta</strong>
            )}
          </div>

          {localizacao && (
            <span className="servico-localizacao">
              {localizacao}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}