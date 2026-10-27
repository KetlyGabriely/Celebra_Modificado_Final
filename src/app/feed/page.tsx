"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/services/supabase";
import {
  excluirPublicacaoFeed,
  listarPublicacoesFeed,
  type PublicacaoFeed,
} from "@/controllers/feedController";

import {
  buscarInteracoesPublicacaoFeed,
  curtirPublicacaoFeed,
  descurtirPublicacaoFeed,
  salvarPublicacaoFeed,
  removerPublicacaoSalvaFeed,
  listarComentariosFeed,
  comentarPublicacaoFeed,
  editarComentarioFeed,
  excluirComentarioFeed,
  type ComentarioFeed,
  type InteracoesPublicacaoFeed,
} from "@/controllers/feedInteracoesController";

type Autor = { nome: string; profissional: boolean; fotoUrl: string | null };

function urlFotoPerfil(caminho: string | null): string | null {
  if (!caminho) return null;
  return supabase.storage.from("perfis-celebra").getPublicUrl(caminho).data.publicUrl;
}

function AvatarAutor({ autor, tamanho = "grande" }: { autor: Autor; tamanho?: "grande" | "pequeno" }) {
  const dimensao = tamanho === "grande" ? "h-11 w-11 text-lg" : "h-9 w-9 text-sm";
  return (
    <div aria-hidden="true" className={`flex ${dimensao} shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#d6aa46]/50 bg-[#d6aa46]/10 font-bold text-[#d6aa46]`}>
      {autor.fotoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={autor.fotoUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
      ) : autor.nome.charAt(0).toUpperCase()}
    </div>
  );
}
type ServicoMarcado = { id: string; nome: string; profissional_id: string };

function formatarData(valor: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit", month: "long", year: "numeric",
  }).format(new Date(valor));
}

function InteracoesFeed({
  publicacaoId,
  usuarioId,
}: {
  publicacaoId: string;
  usuarioId: string | null;
}) {
  const [dados, setDados] = useState<InteracoesPublicacaoFeed | null>(null);
  const [comentarios, setComentarios] = useState<ComentarioFeed[]>([]);
  const [autoresComentarios, setAutoresComentarios] = useState<Record<string, Autor>>({});
  const [aberto, setAberto] = useState(false);
  const [texto, setTexto] = useState("");
  const [editando, setEditando] = useState<string | null>(null);
  const [textoEdicao, setTextoEdicao] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const atualizar = useCallback(async () => {
    const [resumo, lista] = await Promise.all([
      buscarInteracoesPublicacaoFeed(publicacaoId),
      listarComentariosFeed(publicacaoId),
    ]);
    setDados(resumo);
    setComentarios(lista);
  }, [publicacaoId]);

  useEffect(() => {
    let ativo = true;
    Promise.all([
      buscarInteracoesPublicacaoFeed(publicacaoId),
      listarComentariosFeed(publicacaoId),
    ]).then(([resumo, lista]) => {
      if (!ativo) return;
      setDados(resumo);
      setComentarios(lista);
    }).catch((e: unknown) => {
      if (ativo) setErro(e instanceof Error ? e.message : "Erro ao carregar interações.");
    });
    return () => { ativo = false; };
  }, [publicacaoId]);

  // Identifica autores dos comentários usando apenas colunas existentes.
  // Nenhum nome ou foto é obtido de dados privados do Auth.
  const idsAutores = [...new Set(comentarios.map((c) => c.usuario_id))];
  const chaveAutores = idsAutores.slice().sort().join(",");

  useEffect(() => {
    if (!chaveAutores) return;
    let ativo = true;
    const ids = chaveAutores.split(",");

    async function carregarAutores() {
      const [profissionais, clientes, perfis] = await Promise.all([
        supabase.from("profissionais")
          .select("usuario_id, nome_empresa").in("usuario_id", ids),
        supabase.from("clientes")
          .select("usuario_id").in("usuario_id", ids),
        supabase.from("perfis_publicos").select("usuario_id, nome_publico, foto_caminho").in("usuario_id", ids),
      ]);

      if (!ativo) return;
      const mapa: Record<string, Autor> = {};
      if (!clientes.error) {
        for (const cliente of clientes.data ?? []) {
          mapa[cliente.usuario_id] = { nome: "Cliente Celebra", profissional: false, fotoUrl: null };
        }
      }
      if (!profissionais.error) {
        for (const profissional of profissionais.data ?? []) {
          mapa[profissional.usuario_id] = {
            nome: profissional.nome_empresa?.trim() || "Profissional Celebra",
            profissional: true,
            fotoUrl: null,
          };
        }
      }
      if (!perfis.error) {
        for (const perfil of perfis.data ?? []) {
          const anterior = mapa[perfil.usuario_id];
          mapa[perfil.usuario_id] = {
            nome: perfil.nome_publico?.trim() || anterior?.nome || "Membro Celebra",
            profissional: anterior?.profissional ?? false,
            fotoUrl: urlFotoPerfil(perfil.foto_caminho),
          };
        }
      }
      setAutoresComentarios(mapa);
    }

    void carregarAutores();
    return () => { ativo = false; };
  }, [chaveAutores]);

  async function executar(acao: () => Promise<unknown>) {
    if (ocupado) return;
    setOcupado(true);
    setErro(null);
    try {
      await acao();
      await atualizar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível realizar a ação.");
    } finally {
      setOcupado(false);
    }
  }

  function exigirLogin() {
    if (usuarioId) return false;
    setErro("Entre na sua conta para interagir com a publicação.");
    return true;
  }

  return (
    <section className="border-t border-zinc-800 px-4 py-4 sm:px-5">
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" disabled={ocupado || !dados}
          onClick={() => {
            if (exigirLogin() || !dados) return;
            void executar(() => dados.curtiu
              ? descurtirPublicacaoFeed(publicacaoId)
              : curtirPublicacaoFeed(publicacaoId));
          }}
          aria-pressed={dados?.curtiu ?? false}
          className={`rounded-lg border px-3 py-2 text-sm disabled:opacity-50 ${dados?.curtiu ? "border-red-500 text-red-400" : "border-zinc-700 text-zinc-200 hover:border-[#d6aa46]"}`}>
          {dados?.curtiu ? "♥ Curtido" : "♡ Curtir"} · {dados?.totalCurtidas ?? 0}
        </button>
        <button type="button" onClick={() => setAberto((v) => !v)}
          className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-200 hover:border-[#d6aa46]">
          Comentários · {dados?.totalComentarios ?? 0}
        </button>
        <button type="button" disabled={ocupado || !dados}
          aria-pressed={dados?.salvou ?? false}
          onClick={() => {
            if (exigirLogin() || !dados) return;
            void executar(() => dados.salvou
              ? removerPublicacaoSalvaFeed(publicacaoId)
              : salvarPublicacaoFeed(publicacaoId));
          }}
          className={`rounded-lg border px-3 py-2 text-sm disabled:opacity-50 ${dados?.salvou ? "border-[#d6aa46] text-[#d6aa46]" : "border-zinc-700 text-zinc-200 hover:border-[#d6aa46]"}`}>
          {dados?.salvou ? "★ Salvo" : "☆ Salvar"}
        </button>
      </div>

      {erro && <p role="alert" className="mt-3 text-sm text-red-400">{erro}</p>}

      {aberto && (
        <div className="mt-5 space-y-4">
          {comentarios.length === 0
            ? <p className="text-sm text-zinc-400">Nenhum comentário ainda.</p>
            : comentarios.map((c) => (
              <div key={c.id} className="rounded-xl bg-[#202020] p-3">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <Link href={`/perfil/${c.usuario_id}`} aria-label={`Ver perfil de ${autoresComentarios[c.usuario_id]?.nome ?? "Membro Celebra"}`} className="shrink-0 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#d6aa46]">
                      <AvatarAutor autor={autoresComentarios[c.usuario_id] ?? { nome: "Membro Celebra", profissional: false, fotoUrl: null }} tamanho="pequeno" />
                    </Link>
                    <div className="min-w-0">
                      <p className="break-words text-sm font-semibold text-zinc-100">
                        <Link href={`/perfil/${c.usuario_id}`} className="hover:text-[#d6aa46] hover:underline focus-visible:underline">{autoresComentarios[c.usuario_id]?.nome ?? "Membro Celebra"}</Link>
                        {c.usuario_id === usuarioId && <span className="ml-2 text-xs font-normal text-[#d6aa46]">(você)</span>}
                      </p>
                      <p className="text-xs text-zinc-400">
                        {autoresComentarios[c.usuario_id]?.profissional ? "Profissional" : "Cliente ou membro"} · {formatarData(c.criado_em)}
                      </p>
                    </div>
                  </div>
                  {c.usuario_id === usuarioId && (
                    <div className="flex gap-3 text-xs">
                      <button type="button" disabled={ocupado}
                        onClick={() => { setEditando(c.id); setTextoEdicao(c.conteudo); }}
                        className="text-[#d6aa46]">Editar</button>
                      <button type="button" disabled={ocupado}
                        onClick={() => {
                          if (window.confirm("Excluir este comentário?"))
                            void executar(() => excluirComentarioFeed(c.id));
                        }}
                        className="text-red-400">Excluir</button>
                    </div>
                  )}
                </div>
                {editando === c.id ? (
                  <div className="space-y-2">
                    <textarea value={textoEdicao} onChange={(e) => setTextoEdicao(e.target.value)}
                      maxLength={1000} rows={3}
                      className="w-full rounded-lg border border-zinc-700 bg-[#111] p-3 text-sm text-white" />
                    <div className="flex gap-2">
                      <button type="button" disabled={ocupado || !textoEdicao.trim()}
                        onClick={() => void executar(async () => {
                          await editarComentarioFeed(c.id, textoEdicao);
                          setEditando(null);
                        })}
                        className="rounded-lg bg-[#d6aa46] px-3 py-2 text-xs font-bold text-black disabled:opacity-50">Salvar</button>
                      <button type="button" onClick={() => setEditando(null)}
                        className="rounded-lg border border-zinc-700 px-3 py-2 text-xs">Cancelar</button>
                    </div>
                  </div>
                ) : <p className="whitespace-pre-wrap break-words text-sm text-zinc-200">{c.conteudo}</p>}
              </div>
            ))}

          {usuarioId ? (
            <form onSubmit={(e) => {
              e.preventDefault();
              if (!texto.trim()) return;
              void executar(async () => {
                await comentarPublicacaoFeed(publicacaoId, texto);
                setTexto("");
              });
            }} className="flex flex-col gap-2">
              <textarea value={texto} onChange={(e) => setTexto(e.target.value)}
                placeholder="Escreva um comentário..." maxLength={1000} rows={3}
                className="w-full rounded-lg border border-zinc-700 bg-[#101010] p-3 text-sm text-white placeholder:text-zinc-500" />
              <button type="submit" disabled={ocupado || !texto.trim()}
                className="self-end rounded-lg bg-[#d6aa46] px-4 py-2 text-sm font-bold text-black disabled:opacity-50">
                {ocupado ? "Aguarde..." : "Comentar"}
              </button>
            </form>
          ) : <p className="text-sm text-zinc-400">Faça login para comentar.</p>}
        </div>
      )}
    </section>
  );
}

export default function FeedPage() {
  const [publicacoes, setPublicacoes] = useState<PublicacaoFeed[]>([]);
  const [autores, setAutores] = useState<Record<string, Autor>>({});
  const [servicos, setServicos] = useState<Record<string, ServicoMarcado>>({});
  const [fotosAtivas, setFotosAtivas] = useState<Record<string, number>>({});
  const [usuarioId, setUsuarioId] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [excluindoId, setExcluindoId] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const [posts, auth] = await Promise.all([
        listarPublicacoesFeed(50),
        supabase.auth.getUser(),
      ]);
      if (auth.error) throw auth.error;
      setUsuarioId(auth.data.user?.id ?? null);
      setPublicacoes(posts);

      const usuariosIds = [...new Set(posts.map((p) => p.usuario_id))];
      const servicosIds = [...new Set(posts.flatMap((p) => p.servicos_marcados.map((s) => s.servico_id)))];
      const nomes: Record<string, Autor> = {};
      const mapaServicos: Record<string, ServicoMarcado> = {};

      if (usuariosIds.length) {
        const [profissionais, clientes, perfis] = await Promise.all([
          supabase.from("profissionais").select("usuario_id, nome_empresa").in("usuario_id", usuariosIds),
          supabase.from("clientes").select("usuario_id").in("usuario_id", usuariosIds),
          supabase.from("perfis_publicos").select("usuario_id, nome_publico, foto_caminho").in("usuario_id", usuariosIds),
        ]);
        if (profissionais.error) throw profissionais.error;
        if (clientes.error) throw clientes.error;
        for (const c of clientes.data ?? []) {
          nomes[c.usuario_id] = { nome: "Cliente Celebra", profissional: false, fotoUrl: null };
        }
        for (const p of profissionais.data ?? []) {
          nomes[p.usuario_id] = { nome: p.nome_empresa?.trim() || "Profissional Celebra", profissional: true, fotoUrl: null };
        }
        if (!perfis.error) {
          for (const perfil of perfis.data ?? []) {
            const anterior = nomes[perfil.usuario_id];
            nomes[perfil.usuario_id] = {
              nome: perfil.nome_publico?.trim() || anterior?.nome || "Membro Celebra",
              profissional: anterior?.profissional ?? false,
              fotoUrl: urlFotoPerfil(perfil.foto_caminho),
            };
          }
        }
      }
      if (servicosIds.length) {
        const { data, error: servicosErro } = await supabase
          .from("servicos")
          .select("id, nome, profissional_id")
          .in("id", servicosIds);
        if (servicosErro) throw servicosErro;
        for (const s of data ?? []) mapaServicos[s.id] = s;
      }
      setAutores(nomes);
      setServicos(mapaServicos);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível carregar o feed.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => { void carregar(); }, [carregar]);

  function mudarFoto(id: string, total: number, passo: number) {
    setFotosAtivas((atual) => ({
      ...atual,
      [id]: ((atual[id] ?? 0) + passo + total) % total,
    }));
  }

  async function excluir(id: string) {
    if (!window.confirm("Deseja excluir esta publicação e suas fotos?")) return;
    setExcluindoId(id);
    try {
      await excluirPublicacaoFeed(id);
      setPublicacoes((atual) => atual.filter((p) => p.id !== id));
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Não foi possível excluir a publicação.");
    } finally {
      setExcluindoId(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#090909] px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.25em] text-[#d6aa46]">Comunidade Celebra</p>
            <h1 className="text-3xl font-bold sm:text-4xl">Feed Celebra</h1>
            <p className="mt-2 text-sm text-zinc-400">Inspirações, eventos e profissionais em destaque.</p>
          </div>
          <Link href="/feed/criar" className="rounded-xl bg-[#d6aa46] px-5 py-3 text-sm font-bold text-[#090909] transition hover:bg-[#e8bf62]">
            + Criar publicação
          </Link>
        </header>

        {erro && (
          <div role="alert" className="mb-6 rounded-xl border border-red-700/50 bg-red-950/30 p-4 text-sm text-red-200">
            {erro}
            <button onClick={() => void carregar()} className="ml-3 font-bold underline">Tentar novamente</button>
          </div>
        )}

        {carregando ? (
          <p className="py-16 text-center text-zinc-400">Carregando publicações...</p>
        ) : publicacoes.length === 0 && !erro ? (
          <section className="rounded-2xl border border-zinc-800 bg-[#121212] p-10 text-center">
            <div className="mb-3 text-4xl">✦</div>
            <h2 className="text-xl font-semibold">O feed está começando!</h2>
            <p className="mt-2 text-zinc-400">Compartilhe as fotos do seu evento e inspire outras pessoas.</p>
            <Link href="/feed/criar" className="mt-5 inline-block text-sm font-semibold text-[#d6aa46] underline">Fazer primeira publicação</Link>
          </section>
        ) : (
          <div className="space-y-7">
            {publicacoes.map((post) => {
              const total = post.fotos.length;
              const indice = Math.min(fotosAtivas[post.id] ?? 0, Math.max(0, total - 1));
              const autor = autores[post.usuario_id] ?? { nome: "Membro Celebra", profissional: false, fotoUrl: null };
              return (
                <article key={post.id} className="overflow-hidden rounded-2xl border border-zinc-800 bg-[#141414]">
                  <div className="flex items-center justify-between gap-3 p-4 sm:p-5">
                    <div className="flex min-w-0 items-center gap-3">
                      <Link href={`/perfil/${post.usuario_id}`} aria-label={`Ver perfil de ${autor.nome}`} className="shrink-0 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#d6aa46]">
                        <AvatarAutor autor={autor} />
                      </Link>
                      <div className="min-w-0">
                        <p className="truncate font-semibold"><Link href={`/perfil/${post.usuario_id}`} className="hover:text-[#d6aa46] hover:underline focus-visible:underline">{autor.nome}</Link></p>
                        <p className="text-xs text-zinc-400">{autor.profissional ? "Profissional" : "Cliente"} · {formatarData(post.criado_em)}</p>
                      </div>
                    </div>
                    {usuarioId === post.usuario_id && (
                      <button type="button" disabled={excluindoId === post.id} onClick={() => void excluir(post.id)} className="rounded-lg border border-zinc-700 px-3 py-2 text-xs text-zinc-300 hover:border-red-500 hover:text-red-300 disabled:opacity-50">
                        {excluindoId === post.id ? "Excluindo..." : "Excluir"}
                      </button>
                    )}
                  </div>

                  {total > 0 && (
                    <div className="relative flex aspect-[4/3] items-center justify-center bg-black sm:aspect-[16/10]">
                      {/* Usamos img porque as URLs do Storage podem não estar configuradas no next.config. */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={post.fotos[indice].url} alt={`Foto ${indice + 1} da publicação`} className="h-full w-full object-contain" loading="lazy" />
                      {total > 1 && (
                        <>
                          <button type="button" aria-label="Foto anterior" onClick={() => mudarFoto(post.id, total, -1)} className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/70 px-3 py-2 text-xl text-white hover:bg-black">‹</button>
                          <button type="button" aria-label="Próxima foto" onClick={() => mudarFoto(post.id, total, 1)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/70 px-3 py-2 text-xl text-white hover:bg-black">›</button>
                          <span className="absolute bottom-3 right-3 rounded-full bg-black/75 px-3 py-1 text-xs">{indice + 1} / {total}</span>
                        </>
                      )}
                    </div>
                  )}

                  <div className="space-y-4 p-4 sm:p-5">
                    {post.tipo_evento && (
                      <span className="inline-flex rounded-full border border-[#d6aa46]/40 bg-[#d6aa46]/10 px-3 py-1 text-xs font-semibold text-[#d6aa46]">{post.tipo_evento}</span>
                    )}
                    {post.legenda && <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-zinc-200">{post.legenda}</p>}
                    {post.servicos_marcados.length > 0 && (
                      <div className="border-t border-zinc-800 pt-4">
                        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">Serviços marcados</p>
                        <div className="flex flex-wrap gap-2">
                          {post.servicos_marcados.map(({ servico_id }) => {
                            const servico = servicos[servico_id];
                            return servico ? (
                              <Link key={servico_id} href={`/cliente/servicos/${servico_id}`} className="rounded-lg border border-[#d6aa46]/40 bg-[#d6aa46]/10 px-3 py-2 text-sm text-[#e8bf62] transition hover:bg-[#d6aa46]/20">
                                ↗ {servico.nome}
                              </Link>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                  <InteracoesFeed publicacaoId={post.id} usuarioId={usuarioId} />
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
