"use client";

import { useEffect, useMemo, useState } from "react";

import { criarPublicacaoFeed } from "@/controllers/feedController";
import { supabase } from "@/services/supabase";
import AcoesFeed from "@/components/feed/AcoesFeed";

type ServicoOpcao = {
  id: string;
  nome: string;
  profissionais:
    | { nome_empresa: string }
    | { nome_empresa: string }[]
    | null;
};

const tipos = [
  "Casamento",
  "Aniversário",
  "Formatura",
  "Chá revelação",
  "Evento corporativo",
  "Festa infantil",
  "Outro",
];

export default function CriarPublicacaoFeedPage() {
  const [fotos, setFotos] = useState<File[]>([]);
  const [legenda, setLegenda] = useState("");
  const [tipoEvento, setTipoEvento] = useState("");
  const [busca, setBusca] = useState("");
  const [servicos, setServicos] = useState<ServicoOpcao[]>([]);
  const [marcados, setMarcados] = useState<string[]>([]);

  const [carregandoServicos, setCarregandoServicos] =
    useState(true);

  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  /* =========================================================
     PREVIEW DAS FOTOS
  ========================================================= */

  const previews = useMemo(
    () => fotos.map((foto) => URL.createObjectURL(foto)),
    [fotos]
  );

  useEffect(() => {
    return () => {
      previews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previews]);

  /* =========================================================
     CARREGAR SERVIÇOS
  ========================================================= */

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      const { data, error } = await supabase
        .from("servicos")
        .select(
          "id, nome, profissionais(nome_empresa)"
        )
        .eq("ativo", true)
        .order("nome", { ascending: true })
        .limit(300);

      if (!ativo) return;

      if (error) {
        setErro(
          `Não foi possível carregar os serviços: ${error.message}`
        );
      } else {
        setServicos((data ?? []) as ServicoOpcao[]);
      }

      setCarregandoServicos(false);
    }

    void carregar();

    return () => {
      ativo = false;
    };
  }, []);

  /* =========================================================
     FILTRO DE SERVIÇOS
  ========================================================= */

  const filtrados = servicos
    .filter((servico) => {
      const profissional = Array.isArray(
        servico.profissionais
      )
        ? servico.profissionais[0]?.nome_empresa
        : servico.profissionais?.nome_empresa;

      return `${servico.nome} ${profissional ?? ""}`
        .toLocaleLowerCase("pt-BR")
        .includes(
          busca.toLocaleLowerCase("pt-BR")
        );
    })
    .slice(0, 30);

  /* =========================================================
     SELECIONAR FOTOS
  ========================================================= */

  function selecionarFotos(
    arquivos: FileList | null
  ) {
    if (!arquivos) return;

    setErro("");

    const novos = Array.from(arquivos);

    if (fotos.length + novos.length > 10) {
      setErro(
        "Você pode selecionar no máximo 10 fotos."
      );

      return;
    }

    const possuiArquivoInvalido = novos.some(
      (foto) =>
        ![
          "image/jpeg",
          "image/png",
          "image/webp",
        ].includes(foto.type) ||
        foto.size === 0 ||
        foto.size > 10 * 1024 * 1024
    );

    if (possuiArquivoInvalido) {
      setErro(
        "Use fotos JPG, PNG ou WebP, com até 10 MB cada."
      );

      return;
    }

    setFotos((anteriores) => [
      ...anteriores,
      ...novos,
    ]);
  }

  /* =========================================================
     MARCAR SERVIÇO
  ========================================================= */

  function alternarServico(id: string) {
    setMarcados((anteriores) =>
      anteriores.includes(id)
        ? anteriores.filter(
            (item) => item !== id
          )
        : anteriores.length < 20
          ? [...anteriores, id]
          : anteriores
    );
  }

  /* =========================================================
     PUBLICAR
  ========================================================= */

  async function publicar(
    evento: React.FormEvent<HTMLFormElement>
  ) {
    evento.preventDefault();

    if (enviando) return;

    setErro("");
    setSucesso("");

    if (fotos.length === 0) {
      setErro(
        "Selecione pelo menos uma foto."
      );

      return;
    }

    setEnviando(true);

    try {
      await criarPublicacaoFeed({
        legenda,
        tipo_evento:
          tipoEvento || undefined,
        fotos,
        servicos_ids: marcados,
      });

      setSucesso(
        "Publicação criada com sucesso!"
      );

      setFotos([]);
      setLegenda("");
      setTipoEvento("");
      setMarcados([]);
    } catch (falha) {
      setErro(
        falha instanceof Error
          ? falha.message
          : "Não foi possível publicar."
      );
    } finally {
      setEnviando(false);
    }
  }

  /* =========================================================
     RENDERIZAÇÃO
  ========================================================= */

  return (
    <main className="min-h-screen bg-[#090909] px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-3xl">

        {/* =================================================
            NAVEGAÇÃO DO FEED
        ================================================= */}

        <div className="mb-8">
          <AcoesFeed mostrarVoltar />
        </div>

        {/* =================================================
            CABEÇALHO
        ================================================= */}

        <header className="mb-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#d6aa46]">
            Feed Celebra
          </p>

          <h1 className="text-3xl font-bold sm:text-4xl">
            Compartilhe seu evento
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">
            Inspire outras pessoas com fotos e
            indique os serviços que fizeram
            parte desse momento.
          </p>
        </header>

        {/* =================================================
            FORMULÁRIO
        ================================================= */}

        <form
          onSubmit={publicar}
          className="space-y-7 rounded-2xl border border-zinc-800 bg-[#141414] p-5 sm:p-8"
        >
          {/* ===============================================
              FOTOS
          =============================================== */}

          <section>
            <label className="mb-3 block font-semibold">
              Fotos do evento{" "}
              <span className="text-[#d6aa46]">
                *
              </span>
            </label>

            <label className="flex cursor-pointer flex-col items-center rounded-xl border border-dashed border-[#d6aa46]/60 bg-[#d6aa46]/5 px-5 py-8 text-center transition hover:border-[#d6aa46] hover:bg-[#d6aa46]/10">
              <span className="text-3xl">
                📷
              </span>

              <span className="mt-2 font-medium">
                Escolher fotos
              </span>

              <span className="mt-1 text-xs text-zinc-400">
                JPG, PNG ou WebP • até 10 MB
                por foto • máximo de 10
              </span>

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                disabled={enviando}
                className="sr-only"
                onChange={(e) => {
                  selecionarFotos(
                    e.target.files
                  );

                  e.target.value = "";
                }}
              />
            </label>

            {/* PREVIEWS */}

            {previews.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {previews.map(
                  (url, indice) => (
                    <div
                      key={url}
                      className="relative aspect-square overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt={`Foto ${
                          indice + 1
                        }`}
                        className="h-full w-full object-cover"
                      />

                      <button
                        type="button"
                        disabled={enviando}
                        onClick={() =>
                          setFotos(
                            (atual) =>
                              atual.filter(
                                (
                                  _,
                                  indiceAtual
                                ) =>
                                  indiceAtual !==
                                  indice
                              )
                          )
                        }
                        className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/80 text-sm text-white transition hover:bg-red-800"
                        aria-label={`Remover foto ${
                          indice + 1
                        }`}
                      >
                        ✕
                      </button>
                    </div>
                  )
                )}
              </div>
            )}

            <p className="mt-2 text-xs text-zinc-500">
              {fotos.length}/10 fotos
              selecionadas
            </p>
          </section>

          {/* ===============================================
              LEGENDA
          =============================================== */}

          <section>
            <label
              htmlFor="legenda"
              className="mb-2 block font-semibold"
            >
              Legenda
            </label>

            <textarea
              id="legenda"
              value={legenda}
              maxLength={3000}
              onChange={(e) =>
                setLegenda(e.target.value)
              }
              disabled={enviando}
              rows={5}
              placeholder="Conte como foi esse momento especial..."
              className="w-full resize-y rounded-xl border border-zinc-700 bg-[#0b0b0b] p-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-[#d6aa46]"
            />

            <p className="text-right text-xs text-zinc-500">
              {legenda.length}/3000
            </p>
          </section>

          {/* ===============================================
              TIPO DE EVENTO
          =============================================== */}

          <section>
            <label
              htmlFor="tipo"
              className="mb-2 block font-semibold"
            >
              Tipo de evento
            </label>

            <select
              id="tipo"
              value={tipoEvento}
              onChange={(e) =>
                setTipoEvento(e.target.value)
              }
              disabled={enviando}
              className="w-full rounded-xl border border-zinc-700 bg-[#0b0b0b] p-3 text-white outline-none transition focus:border-[#d6aa46]"
            >
              <option value="">
                Selecione (opcional)
              </option>

              {tipos.map((tipo) => (
                <option
                  key={tipo}
                  value={tipo}
                >
                  {tipo}
                </option>
              ))}
            </select>
          </section>

          {/* ===============================================
              SERVIÇOS
          =============================================== */}

          <section>
            <div className="mb-2 font-semibold">
              Marcar serviços do Celebra{" "}
              <span className="text-sm font-normal text-zinc-500">
                (opcional)
              </span>
            </div>

            <p className="mb-3 text-sm leading-relaxed text-zinc-400">
              Marque somente serviços
              relacionados às fotos. A marcação
              não significa contratação
              verificada.
            </p>

            {/* BUSCA */}

            <input
              value={busca}
              onChange={(e) =>
                setBusca(e.target.value)
              }
              disabled={enviando}
              placeholder="Buscar serviço ou empresa..."
              className="w-full rounded-xl border border-zinc-700 bg-[#0b0b0b] p-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-[#d6aa46]"
            />

            {/* LISTA DE SERVIÇOS */}

            <div className="mt-3 max-h-64 space-y-2 overflow-y-auto pr-1">
              {carregandoServicos && (
                <p className="py-3 text-sm text-zinc-400">
                  Carregando serviços...
                </p>
              )}

              {!carregandoServicos &&
                filtrados.length === 0 && (
                  <p className="py-3 text-sm text-zinc-400">
                    Nenhum serviço
                    encontrado.
                  </p>
                )}

              {filtrados.map(
                (servico) => {
                  const empresa =
                    Array.isArray(
                      servico.profissionais
                    )
                      ? servico
                          .profissionais[0]
                          ?.nome_empresa
                      : servico
                          .profissionais
                          ?.nome_empresa;

                  const selecionado =
                    marcados.includes(
                      servico.id
                    );

                  return (
                    <label
                      key={servico.id}
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${
                        selecionado
                          ? "border-[#d6aa46]/70 bg-[#d6aa46]/5"
                          : "border-zinc-800 hover:border-[#d6aa46]/50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={
                          selecionado
                        }
                        onChange={() =>
                          alternarServico(
                            servico.id
                          )
                        }
                        disabled={
                          enviando ||
                          (!selecionado &&
                            marcados.length >=
                              20)
                        }
                        className="accent-[#d6aa46]"
                      />

                      <span>
                        <span className="block text-sm font-medium">
                          {
                            servico.nome
                          }
                        </span>

                        <span className="text-xs text-zinc-400">
                          {empresa ||
                            "Profissional Celebra"}
                        </span>
                      </span>
                    </label>
                  );
                }
              )}
            </div>

            <p className="mt-2 text-xs text-zinc-500">
              {marcados.length}/20 serviços
              marcados
            </p>
          </section>

          {/* ===============================================
              MENSAGEM DE ERRO
          =============================================== */}

          {erro && (
            <p
              role="alert"
              className="rounded-xl border border-red-900 bg-red-950/40 p-3 text-sm text-red-300"
            >
              {erro}
            </p>
          )}

          {/* ===============================================
              MENSAGEM DE SUCESSO
          =============================================== */}

          {sucesso && (
            <p
              role="status"
              className="rounded-xl border border-emerald-900 bg-emerald-950/30 p-3 text-sm text-emerald-300"
            >
              {sucesso}
            </p>
          )}

          {/* ===============================================
              PUBLICAR
          =============================================== */}

          <button
            type="submit"
            disabled={
              enviando ||
              fotos.length === 0
            }
            className="w-full rounded-xl bg-[#d6aa46] px-5 py-3 font-bold text-black transition hover:bg-[#ebc56e] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {enviando
              ? "Publicando fotos, aguarde..."
              : "Publicar no Feed Celebra"}
          </button>
        </form>
      </div>
    </main>
  );
}
