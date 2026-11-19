"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import { supabase } from "@/services/supabase";
import AcoesFeed from "@/components/feed/AcoesFeed";

import {
  listarIdsPublicacoesSalvasFeed,
  removerPublicacaoSalvaFeed,
} from "@/controllers/feedInteracoesController";

/* =========================================================
   TIPOS
========================================================= */

type Foto = {
  id: string;
  caminho_storage: string;
  ordem: number;
};

type Marcacao = {
  servico_id: string;
};

type PublicacaoSalva = {
  id: string;
  usuario_id: string;
  legenda: string;
  tipo_evento: string | null;
  criado_em: string;
  feed_fotos: Foto[];
  feed_servicos_marcados: Marcacao[];
};

type Autor = {
  nome: string;
  profissional: boolean;
};

type Servico = {
  id: string;
  nome: string;
};

/* =========================================================
   FUNÇÕES AUXILIARES
========================================================= */

function formatarData(valor: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(valor));
}

/* =========================================================
   PÁGINA
========================================================= */

export default function PublicacoesSalvasPage() {
  const [publicacoes, setPublicacoes] = useState<
    PublicacaoSalva[]
  >([]);

  const [autores, setAutores] = useState<
    Record<string, Autor>
  >({});

  const [servicos, setServicos] = useState<
    Record<string, Servico>
  >({});

  const [indices, setIndices] = useState<
    Record<string, number>
  >({});

  const [carregando, setCarregando] =
    useState(true);

  const [erro, setErro] =
    useState<string | null>(null);

  const [logado, setLogado] =
    useState(false);

  const [removendo, setRemovendo] =
    useState<string | null>(null);

  /* =========================================================
     CARREGAR PUBLICAÇÕES SALVAS
  ========================================================= */

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);

    try {
      const {
        data: auth,
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        throw authError;
      }

      if (!auth.user) {
        setLogado(false);
        setPublicacoes([]);
        return;
      }

      setLogado(true);

      const ids =
        await listarIdsPublicacoesSalvasFeed();

      if (!ids.length) {
        setPublicacoes([]);
        return;
      }

      /* -----------------------------------------------------
         BUSCAR PUBLICAÇÕES EM LOTES
      ----------------------------------------------------- */

      const lotes: PublicacaoSalva[] = [];

      for (
        let i = 0;
        i < ids.length;
        i += 100
      ) {
        const { data, error } =
          await supabase
            .from("feed_publicacoes")
            .select(
              "id, usuario_id, legenda, tipo_evento, criado_em, feed_fotos(id, caminho_storage, ordem), feed_servicos_marcados(servico_id)"
            )
            .in(
              "id",
              ids.slice(i, i + 100)
            );

        if (error) {
          throw error;
        }

        lotes.push(
          ...((data ?? []) as PublicacaoSalva[])
        );
      }

      /* -----------------------------------------------------
         MANTER ORDEM DOS SALVOS
      ----------------------------------------------------- */

      const mapa = new Map(
        lotes.map((publicacao) => [
          publicacao.id,
          publicacao,
        ])
      );

      const ordenadas = ids
        .map((id) => mapa.get(id))
        .filter(
          (
            publicacao
          ): publicacao is PublicacaoSalva =>
            Boolean(publicacao)
        );

      setPublicacoes(ordenadas);

      /* -----------------------------------------------------
         IDS DOS AUTORES E SERVIÇOS
      ----------------------------------------------------- */

      const usuariosIds = [
        ...new Set(
          ordenadas.map(
            (publicacao) =>
              publicacao.usuario_id
          )
        ),
      ];

      const servicosIds = [
        ...new Set(
          ordenadas.flatMap(
            (publicacao) =>
              publicacao.feed_servicos_marcados.map(
                (marcacao) =>
                  marcacao.servico_id
              )
          )
        ),
      ];

      const nomes: Record<
        string,
        Autor
      > = {};

      const mapaServicos: Record<
        string,
        Servico
      > = {};

      /* -----------------------------------------------------
         AUTORES
      ----------------------------------------------------- */

      if (usuariosIds.length) {
        const [profissionais, clientes] =
          await Promise.all([
            supabase
              .from("profissionais")
              .select(
                "usuario_id, nome_empresa"
              )
              .in(
                "usuario_id",
                usuariosIds
              ),

            supabase
              .from("clientes")
              .select("usuario_id")
              .in(
                "usuario_id",
                usuariosIds
              ),
          ]);

        if (profissionais.error) {
          throw profissionais.error;
        }

        if (clientes.error) {
          throw clientes.error;
        }

        for (
          const cliente of clientes.data ??
          []
        ) {
          nomes[cliente.usuario_id] = {
            nome: "Cliente Celebra",
            profissional: false,
          };
        }

        for (
          const profissional of
            profissionais.data ?? []
        ) {
          nomes[
            profissional.usuario_id
          ] = {
            nome:
              profissional.nome_empresa?.trim() ||
              "Profissional Celebra",

            profissional: true,
          };
        }
      }

      /* -----------------------------------------------------
         SERVIÇOS
      ----------------------------------------------------- */

      if (servicosIds.length) {
        const { data, error } =
          await supabase
            .from("servicos")
            .select("id, nome")
            .in("id", servicosIds);

        if (error) {
          throw error;
        }

        for (
          const servico of data ?? []
        ) {
          mapaServicos[servico.id] =
            servico;
        }
      }

      setAutores(nomes);
      setServicos(mapaServicos);
    } catch (e) {
      setErro(
        e instanceof Error
          ? e.message
          : "Não foi possível carregar os salvos."
      );
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  /* =========================================================
     REMOVER DOS SALVOS
  ========================================================= */

  async function remover(id: string) {
    if (removendo) return;

    setRemovendo(id);
    setErro(null);

    try {
      await removerPublicacaoSalvaFeed(
        id
      );

      setPublicacoes((atual) =>
        atual.filter(
          (publicacao) =>
            publicacao.id !== id
        )
      );
    } catch (e) {
      setErro(
        e instanceof Error
          ? e.message
          : "Não foi possível remover dos salvos."
      );
    } finally {
      setRemovendo(null);
    }
  }

  /* =========================================================
     CARROSSEL DE FOTOS
  ========================================================= */

  function mudarFoto(
    id: string,
    total: number,
    passo: number
  ) {
    setIndices((atual) => ({
      ...atual,

      [id]:
        ((atual[id] ?? 0) +
          passo +
          total) %
        total,
    }));
  }

  /* =========================================================
     RENDERIZAÇÃO
  ========================================================= */

  return (
    <main className="min-h-screen bg-[#090909] px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-3xl">

        {/* =================================================
            NAVEGAÇÃO PADRONIZADA DO FEED
        ================================================= */}

        <div className="mb-8">
          <AcoesFeed mostrarVoltar />
        </div>

        {/* =================================================
            CABEÇALHO
        ================================================= */}

        <header className="mb-8">
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.25em] text-[#d6aa46]">
            Comunidade Celebra
          </p>

          <h1 className="text-3xl font-bold sm:text-4xl">
            Publicações salvas
          </h1>

          <p className="mt-2 text-sm text-zinc-400">
            Suas inspirações favoritas, em
            um só lugar.
          </p>
        </header>

        {/* =================================================
            ERRO
        ================================================= */}

        {erro && (
          <div
            role="alert"
            className="mb-5 rounded-xl border border-red-800 bg-red-950/30 p-4 text-sm text-red-200"
          >
            {erro}

            <button
              type="button"
              onClick={() =>
                void carregar()
              }
              className="ml-2 underline"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {/* =================================================
            CARREGANDO
        ================================================= */}

        {carregando ? (
          <p className="py-16 text-center text-zinc-400">
            Carregando publicações
            salvas...
          </p>
        ) : !logado ? (
          /* ===============================================
             USUÁRIO NÃO LOGADO
          =============================================== */

          <div className="rounded-2xl border border-zinc-800 bg-[#141414] p-8 text-center">
            <p className="text-zinc-300">
              Entre na sua conta para
              visualizar suas publicações
              salvas.
            </p>

            <Link
              href="/feed"
              className="mt-4 inline-block font-medium text-[#d6aa46] underline"
            >
              Voltar ao feed
            </Link>
          </div>
        ) : publicacoes.length === 0 ? (
          /* ===============================================
             NENHUMA PUBLICAÇÃO SALVA
          =============================================== */

          <div className="rounded-2xl border border-zinc-800 bg-[#141414] p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#d6aa46]/30 bg-[#d6aa46]/10 text-2xl text-[#d6aa46]">
              ☆
            </div>

            <h2 className="mt-4 text-xl font-semibold">
              Nenhuma publicação salva
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-zinc-400">
              Use o botão Salvar nas
              publicações do feed para
              guardar suas inspirações e
              encontrá-las aqui.
            </p>

            <Link
              href="/feed"
              className="mt-5 inline-block font-medium text-[#d6aa46] underline"
            >
              Explorar o feed
            </Link>
          </div>
        ) : (
          /* ===============================================
             LISTA DE PUBLICAÇÕES SALVAS
          =============================================== */

          <div className="space-y-7">
            {publicacoes.map(
              (post) => {
                const fotos = [
                  ...post.feed_fotos,
                ].sort(
                  (a, b) =>
                    a.ordem - b.ordem
                );

                const total =
                  fotos.length;

                const indice = Math.min(
                  indices[post.id] ?? 0,
                  Math.max(
                    total - 1,
                    0
                  )
                );

                const autor =
                  autores[
                    post.usuario_id
                  ] ?? {
                    nome: "Membro Celebra",
                    profissional: false,
                  };

                return (
                  <article
                    key={post.id}
                    className="overflow-hidden rounded-2xl border border-zinc-800 bg-[#141414]"
                  >
                    {/* =====================================
                        AUTOR
                    ===================================== */}

                    <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5">
                      <div className="min-w-0">
                        <p className="truncate font-semibold">
                          {autor.nome}
                        </p>

                        <p className="text-xs text-zinc-400">
                          {autor.profissional
                            ? "Profissional"
                            : "Cliente"}{" "}
                          ·{" "}
                          {formatarData(
                            post.criado_em
                          )}
                        </p>
                      </div>

                      {/* REMOVER DOS SALVOS */}

                      <button
                        type="button"
                        disabled={
                          removendo ===
                          post.id
                        }
                        onClick={() =>
                          void remover(
                            post.id
                          )
                        }
                        className="rounded-lg border border-[#d6aa46]/50 px-3 py-2 text-xs font-semibold text-[#d6aa46] transition hover:bg-[#d6aa46]/10 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {removendo ===
                        post.id
                          ? "Removendo..."
                          : "★ Remover dos salvos"}
                      </button>
                    </div>

                    {/* =====================================
                        FOTOS
                    ===================================== */}

                    {total > 0 && (
                      <div className="relative flex aspect-[4/3] items-center justify-center bg-black sm:aspect-[16/10]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={
                            supabase.storage
                              .from(
                                "feed-celebra"
                              )
                              .getPublicUrl(
                                fotos[
                                  indice
                                ]
                                  .caminho_storage
                              ).data
                              .publicUrl
                          }
                          alt={`Foto ${
                            indice + 1
                          } da publicação`}
                          loading="lazy"
                          className="h-full w-full object-contain"
                        />

                        {/* CARROSSEL */}

                        {total > 1 && (
                          <>
                            <button
                              type="button"
                              aria-label="Foto anterior"
                              onClick={() =>
                                mudarFoto(
                                  post.id,
                                  total,
                                  -1
                                )
                              }
                              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/70 px-3 py-2 text-xl text-white transition hover:bg-black"
                            >
                              ‹
                            </button>

                            <button
                              type="button"
                              aria-label="Próxima foto"
                              onClick={() =>
                                mudarFoto(
                                  post.id,
                                  total,
                                  1
                                )
                              }
                              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/70 px-3 py-2 text-xl text-white transition hover:bg-black"
                            >
                              ›
                            </button>

                            <span className="absolute bottom-3 right-3 rounded-full bg-black/75 px-3 py-1 text-xs">
                              {indice + 1} /{" "}
                              {total}
                            </span>
                          </>
                        )}
                      </div>
                    )}

                    {/* =====================================
                        CONTEÚDO
                    ===================================== */}

                    <div className="space-y-4 p-4 sm:p-5">
                      {/* TIPO DO EVENTO */}

                      {post.tipo_evento && (
                        <span className="inline-flex rounded-full border border-[#d6aa46]/40 bg-[#d6aa46]/10 px-3 py-1 text-xs font-semibold text-[#d6aa46]">
                          {
                            post.tipo_evento
                          }
                        </span>
                      )}

                      {/* LEGENDA */}

                      {post.legenda && (
                        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-zinc-200">
                          {post.legenda}
                        </p>
                      )}

                      {/* SERVIÇOS MARCADOS */}

                      {post
                        .feed_servicos_marcados
                        .length > 0 && (
                        <div className="border-t border-zinc-800 pt-4">
                          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                            Serviços marcados
                          </p>

                          <div className="flex flex-wrap gap-2">
                            {post.feed_servicos_marcados.map(
                              ({
                                servico_id,
                              }) => {
                                const servico =
                                  servicos[
                                    servico_id
                                  ];

                                return servico ? (
                                  <Link
                                    key={
                                      servico_id
                                    }
                                    href={`/cliente/servicos/${servico_id}`}
                                    className="rounded-lg border border-[#d6aa46]/40 bg-[#d6aa46]/10 px-3 py-2 text-sm text-[#e8bf62] transition hover:bg-[#d6aa46]/20"
                                  >
                                    ↗{" "}
                                    {
                                      servico.nome
                                    }
                                  </Link>
                                ) : null;
                              }
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </article>
                );
              }
            )}
          </div>
        )}
      </div>
    </main>
  );
}
