"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "@/services/supabase";
import {
  carregarPaginaPerfilPublico,
  type PaginaPerfilPublico,
} from "@/controllers/perfilPublicoVisualizacaoController";

function dataBR(valor: string): string {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(valor));
}

export default function PerfilPublicoPage() {
  const params = useParams<{ id: string }>();
  const usuarioId = typeof params.id === "string" ? params.id : "";
  const [pagina, setPagina] = useState<PaginaPerfilPublico | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [meuId, setMeuId] = useState<string | null>(null);
  const [fotosAtivas, setFotosAtivas] = useState<Record<string, number>>({});
  const [nomesServicos, setNomesServicos] = useState<Record<string, string>>({});

  const carregar = useCallback(async () => {
    if (!usuarioId) {
      setErro("Perfil inválido.");
      setCarregando(false);
      return;
    }
    setCarregando(true);
    setErro(null);
    try {
      const [resultado, autenticacao] = await Promise.all([
        carregarPaginaPerfilPublico(usuarioId, 50),
        supabase.auth.getUser(),
      ]);
      if (autenticacao.error) {
        // A visualização de perfis públicos também funciona sem login.
        setMeuId(null);
      } else {
        setMeuId(autenticacao.data.user?.id ?? null);
      }
      setPagina(resultado);
      const ids = [...new Set((resultado?.publicacoes ?? []).flatMap((p) => p.servicos_marcados.map((s) => s.servico_id)))];
      if (ids.length) {
        const { data, error } = await supabase.from("servicos").select("id, nome").in("id", ids);
        if (!error) {
          const mapa: Record<string, string> = {};
          for (const item of data ?? []) mapa[item.id] = item.nome;
          setNomesServicos(mapa);
        } else {
          setNomesServicos({});
        }
      } else {
        setNomesServicos({});
      }
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível carregar o perfil.");
    } finally {
      setCarregando(false);
    }
  }, [usuarioId]);

  useEffect(() => { void carregar(); }, [carregar]);

  function mudarFoto(publicacaoId: string, total: number, passo: number) {
    if (total < 2) return;
    setFotosAtivas((anterior) => ({
      ...anterior,
      [publicacaoId]: ((anterior[publicacaoId] ?? 0) + passo + total) % total,
    }));
  }

  return (
    <main className="min-h-screen bg-[#090909] px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link href="/feed" className="text-sm font-semibold text-[#d6aa46] hover:underline">← Voltar ao Feed</Link>
          {meuId === usuarioId && (
            <Link href="/perfil/editar" className="rounded-xl border border-[#d6aa46] px-4 py-2 text-sm font-semibold text-[#d6aa46] hover:bg-[#d6aa46]/10">Editar meu perfil</Link>
          )}
        </div>

        {carregando ? (
          <p className="py-16 text-center text-zinc-400">Carregando perfil...</p>
        ) : erro ? (
          <section role="alert" className="rounded-2xl border border-red-800 bg-red-950/20 p-6 text-red-200">
            <p>{erro}</p>
            <button type="button" onClick={() => void carregar()} className="mt-3 text-sm font-bold underline">Tentar novamente</button>
          </section>
        ) : !pagina ? (
          <section className="rounded-2xl border border-zinc-800 bg-[#141414] p-8 text-center">
            <h1 className="text-xl font-semibold">Perfil não encontrado</h1>
            <p className="mt-2 text-sm text-zinc-400">Este usuário não possui um perfil público disponível.</p>
          </section>
        ) : (
          <>
            <section className="mb-8 rounded-2xl border border-zinc-800 bg-[#141414] p-5 sm:p-7">
              <p className="mb-5 text-xs font-bold uppercase tracking-[0.2em] text-[#d6aa46]">Perfil Celebra</p>
              <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
                {pagina.perfil.foto_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={pagina.perfil.foto_url} alt={`Foto de ${pagina.perfil.nome}`} className="h-24 w-24 shrink-0 rounded-full border-2 border-[#d6aa46] object-cover" />
                ) : (
                  <div aria-hidden="true" className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-2 border-[#d6aa46] bg-[#d6aa46]/10 text-4xl font-bold text-[#d6aa46]">
                    {pagina.perfil.nome.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h1 className="break-words text-2xl font-bold sm:text-3xl">{pagina.perfil.nome}</h1>
                  <p className="mt-1 text-sm font-medium text-[#d6aa46]">{pagina.perfil.profissional ? "Profissional Celebra" : "Membro Celebra"}</p>
                  {pagina.perfil.biografia && <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-zinc-300">{pagina.perfil.biografia}</p>}
                  <p className="mt-3 text-xs text-zinc-400">{pagina.publicacoes.length} {pagina.publicacoes.length === 1 ? "publicação exibida" : "publicações exibidas"}</p>
                </div>
              </div>
            </section>

            <h2 className="mb-5 text-xl font-bold">Publicações</h2>
            {pagina.publicacoes.length === 0 ? (
              <section className="rounded-2xl border border-zinc-800 bg-[#141414] p-8 text-center text-zinc-400">Este perfil ainda não tem publicações.</section>
            ) : (
              <div className="space-y-6">
                {pagina.publicacoes.map((post) => {
                  const total = post.fotos.length;
                  const indice = Math.min(fotosAtivas[post.id] ?? 0, Math.max(total - 1, 0));
                  return (
                    <article key={post.id} className="overflow-hidden rounded-2xl border border-zinc-800 bg-[#141414]">
                      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-4 sm:px-5">
                        <span className="text-sm font-semibold text-zinc-100">{pagina.perfil.nome}</span>
                        <time className="text-xs text-zinc-400" dateTime={post.criado_em}>{dataBR(post.criado_em)}</time>
                      </div>
                      {total > 0 && (
                        <div className="relative flex aspect-[4/3] items-center justify-center bg-black sm:aspect-[16/10]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={post.fotos[indice].url} alt={`Foto ${indice + 1} da publicação`} loading="lazy" className="h-full w-full object-contain" />
                          {total > 1 && (
                            <>
                              <button type="button" aria-label="Foto anterior" onClick={() => mudarFoto(post.id, total, -1)} className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/70 px-3 py-2 text-xl">‹</button>
                              <button type="button" aria-label="Próxima foto" onClick={() => mudarFoto(post.id, total, 1)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/70 px-3 py-2 text-xl">›</button>
                              <span className="absolute bottom-3 right-3 rounded-full bg-black/75 px-3 py-1 text-xs">{indice + 1} / {total}</span>
                            </>
                          )}
                        </div>
                      )}
                      <div className="space-y-3 p-4 sm:p-5">
                        {post.tipo_evento && <span className="inline-block rounded-full border border-[#d6aa46]/40 bg-[#d6aa46]/10 px-3 py-1 text-xs font-semibold text-[#d6aa46]">{post.tipo_evento}</span>}
                        {post.legenda && <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-zinc-200">{post.legenda}</p>}
                        {post.servicos_marcados.length > 0 && (
                          <div className="flex flex-wrap gap-2 border-t border-zinc-800 pt-3">
                            {post.servicos_marcados.map(({ servico_id }) => nomesServicos[servico_id] ? (
                              <Link key={servico_id} href={`/cliente/servicos/${servico_id}`} className="rounded-lg border border-[#d6aa46]/40 bg-[#d6aa46]/10 px-3 py-2 text-sm text-[#e8bf62] hover:bg-[#d6aa46]/20">↗ {nomesServicos[servico_id]}</Link>
                            ) : null)}
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
