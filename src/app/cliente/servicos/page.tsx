
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import {
  listarCategorias,
  listarServicos,
} from "@/controllers/servicoController";

import {
  listarFavoritos,
  adicionarFavorito,
  removerFavorito,
} from "@/controllers/favoritoController";

import {
  listarImagensServico,
} from "@/controllers/servicoImagemController";

import type {
  CategoriaServico,
  Servico,
} from "@/models/Servico";
import { supabase } from "@/services/supabase";

type ResumoAvaliacao = { media: number; total: number };

function idProfissional(servico: Servico): string | null {
  const registro = servico as Servico & {
    profissional_id?: string | null;
    profissionais?: { id?: string | null } | null;
  };
  return registro.profissional_id ?? registro.profissionais?.id ?? null;
}

export default function ServicosPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const categoriaInicial =
    searchParams.get("categoria") ?? "";

  const [servicos, setServicos] = useState<Servico[]>([]);
  const [categorias, setCategorias] =
    useState<CategoriaServico[]>([]);

  const [categoriaSelecionada, setCategoriaSelecionada] =
    useState(categoriaInicial);

  const [busca, setBusca] = useState("");
  const [buscaAplicada, setBuscaAplicada] = useState("");

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [capas, setCapas] =
    useState<Record<string, string>>({});

  const [favoritos, setFavoritos] =
    useState<string[]>([]);

  const [favoritosPendentes, setFavoritosPendentes] =
    useState<string[]>([]);

  const [resumos, setResumos] = useState<Record<string, ResumoAvaliacao>>({});

  // ========================================
  // CARREGAR FAVORITOS
  // ========================================

  useEffect(() => {
    async function carregarFavoritos() {
      try {
        const ids = await listarFavoritos();
        setFavoritos(ids);
      } catch (error) {
        console.error(
          "Erro ao carregar favoritos:",
          error
        );
      }
    }

    void carregarFavoritos();
  }, []);

  // ========================================
  // ADICIONAR / REMOVER FAVORITO
  // ========================================

  async function alternarFavorito(servicoId: string) {
    if (favoritosPendentes.includes(servicoId)) {
      return;
    }

    const jaFavorito = favoritos.includes(servicoId);

    setFavoritosPendentes((anterior) => [
      ...anterior,
      servicoId,
    ]);

    try {
      if (jaFavorito) {
        await removerFavorito(servicoId);

        setFavoritos((anterior) =>
          anterior.filter((id) => id !== servicoId)
        );
      } else {
        await adicionarFavorito(servicoId);

        setFavoritos((anterior) => [
          ...anterior,
          servicoId,
        ]);
      }
    } catch (error) {
      console.error(
        "Erro ao alterar favorito:",
        error
      );

      alert("Não foi possível atualizar o favorito.");
    } finally {
      setFavoritosPendentes((anterior) =>
        anterior.filter((id) => id !== servicoId)
      );
    }
  }

  // ========================================
  // CARREGAR SERVIÇOS E CATEGORIAS
  // ========================================

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
    void carregarDados();
  }, [carregarDados]);

  // ========================================
  // CARREGAR AVALIAÇÕES PÚBLICAS DOS PROFISSIONAIS
  // ========================================

  useEffect(() => {
    let cancelado = false;

    async function carregarAvaliacoes() {
      const ids = [...new Set(servicos.map(idProfissional).filter((id): id is string => Boolean(id)))];
      if (ids.length === 0) {
        setResumos({});
        return;
      }

      const { data, error } = await supabase
        .from("avaliacoes")
        .select("profissional_id, nota")
        .in("profissional_id", ids);

      if (cancelado) return;
      if (error) {
        console.error("Erro ao consultar avaliações públicas:", error);
        setResumos({});
        return;
      }

      const somas: Record<string, { soma: number; total: number }> = {};
      for (const item of data ?? []) {
        const id = item.profissional_id as string;
        const nota = Number(item.nota);
        if (!id || !Number.isFinite(nota)) continue;
        if (!somas[id]) somas[id] = { soma: 0, total: 0 };
        somas[id].soma += nota;
        somas[id].total += 1;
      }

      const resultado: Record<string, ResumoAvaliacao> = {};
      for (const [id, valor] of Object.entries(somas)) {
        resultado[id] = { media: valor.soma / valor.total, total: valor.total };
      }
      setResumos(resultado);
    }

    void carregarAvaliacoes();
    return () => { cancelado = true; };
  }, [servicos]);

  // ========================================
  // CARREGAR FOTOS DE CAPA
  // ========================================

  useEffect(() => {
    let cancelado = false;

    async function carregarCapas() {
      if (servicos.length === 0) {
        setCapas({});
        return;
      }

      const resultados = await Promise.all(
        servicos.map(async (servico) => {
          try {
            const imagens =
              await listarImagensServico(servico.id);

            const capa =
              imagens.find((imagem) => imagem.capa) ??
              imagens[0];

            return {
              servicoId: servico.id,
              url: capa?.url ?? "",
            };
          } catch (error) {
            console.error(
              `Erro ao carregar capa do serviço ${servico.id}:`,
              error
            );

            return {
              servicoId: servico.id,
              url: "",
            };
          }
        })
      );

      if (cancelado) return;

      const novasCapas: Record<string, string> = {};

      for (const resultado of resultados) {
        if (resultado.url) {
          novasCapas[resultado.servicoId] =
            resultado.url;
        }
      }

      setCapas(novasCapas);
    }

    void carregarCapas();

    return () => {
      cancelado = true;
    };
  }, [servicos]);

  // ========================================
  // FILTROS DE CATEGORIA
  // ========================================

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

  // ========================================
  // PESQUISA
  // ========================================

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

  // ========================================
  // INTERFACE
  // ========================================

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
          <span className="pesquisa-icone">
            ⌕
          </span>

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
          type="button"
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
            type="button"
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

          {(categoriaSelecionada || buscaAplicada) && (
            <button
              type="button"
              className="limpar-filtros"
              onClick={() => {
                setCategoriaSelecionada("");
                setBusca("");
                setBuscaAplicada("");

                router.replace("/cliente/servicos");
              }}
            >
              Limpar filtros
            </button>
          )}
        </div>

        {/* CARREGANDO */}

        {carregando && (
          <div className="servicos-loading">
            <div className="loading-simbolo">
              ✦
            </div>

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

              <button
                type="button"
                onClick={carregarDados}
              >
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
                type="button"
                onClick={() => {
                  setCategoriaSelecionada("");
                  setBusca("");
                  setBuscaAplicada("");

                  router.replace("/cliente/servicos");
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
                  resumo={resumos[idProfissional(servico) ?? ""]}
                  capaUrl={capas[servico.id]}
                  favorito={favoritos.includes(
                    servico.id
                  )}
                  favoritoPendente={
                    favoritosPendentes.includes(
                      servico.id
                    )
                  }
                  onFavorito={() =>
                    alternarFavorito(servico.id)
                  }
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

// ========================================
// COMPONENTE DO CARD
// ========================================

function ServicoCard({
  servico,
  resumo,
  capaUrl,
  onClick,
  favorito,
  favoritoPendente,
  onFavorito,
}: {
  servico: Servico;
  resumo?: ResumoAvaliacao;
  capaUrl?: string;
  onClick: () => void;
  favorito: boolean;
  favoritoPendente: boolean;
  onFavorito: () => void;
}) {
  const [imagemFalhou, setImagemFalhou] =
    useState(false);

  useEffect(() => {
    setImagemFalhou(false);
  }, [capaUrl]);

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
      {/* IMAGEM DO SERVIÇO */}

      <div
        className="servico-card-imagem"
        style={{
          position: "relative",
          overflow: "hidden",
        }}
      >
        {capaUrl && !imagemFalhou ? (
          <img
            src={capaUrl}
            alt={`Foto do serviço ${servico.nome}`}
            loading="lazy"
            onError={() => setImagemFalhou(true)}
            style={{
              width: "100%",
              height: "100%",
              position: "absolute",
              inset: 0,
              objectFit: "cover",
              display: "block",
            }}
          />
        ) : (
          <div className="servico-card-placeholder">
            <span>
              {servico.categorias_servico?.icone ||
                "✦"}
            </span>
          </div>
        )}

        {/* CATEGORIA */}

        {servico.categorias_servico && (
          <span
            className="servico-categoria-tag"
            style={{
              position: "absolute",
              zIndex: 2,
            }}
          >
            {servico.categorias_servico.nome}
          </span>
        )}

        {/* FAVORITO */}

        <button
          type="button"
          className="servico-favorito-preview"
          title={
            favorito
              ? "Remover dos favoritos"
              : "Adicionar aos favoritos"
          }
          aria-label={
            favorito
              ? "Remover dos favoritos"
              : "Adicionar aos favoritos"
          }
          aria-pressed={favorito}
          disabled={favoritoPendente}
          onClick={(event) => {
            event.stopPropagation();
            onFavorito();
          }}
          style={{
            color: favorito
              ? "#e63946"
              : undefined,
            opacity: favoritoPendente ? 0.5 : 1,
            position: "absolute",
            zIndex: 3,
          }}
        >
          {favorito ? "★" : "☆"}
        </button>
      </div>

      {/* CONTEÚDO */}

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

        <div style={{ marginTop: 8, marginBottom: 8, fontSize: 13 }}>
          {resumo ? (
            <span aria-label={`Nota média ${resumo.media.toFixed(1)} de 5`}>
              <span style={{ color: "#d6aa46", fontWeight: 700 }}>
                ★ {resumo.media.toFixed(1).replace(".", ",")}
              </span>
              <span style={{ color: "#999", marginLeft: 7 }}>
                ({resumo.total} {resumo.total === 1 ? "avaliação" : "avaliações"} do profissional)
              </span>
            </span>
          ) : (
            <span style={{ color: "#888" }}>Ainda sem avaliações</span>
          )}
        </div>

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
