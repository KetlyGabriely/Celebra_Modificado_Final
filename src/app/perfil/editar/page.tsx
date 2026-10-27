"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  buscarMeuPerfilPublico,
  salvarMeuPerfilPublico,
  enviarMinhaFotoPerfil,
  removerMinhaFotoPerfil,
  type PerfilPublico,
} from "@/controllers/perfilPublicoController";

const MAX_FOTO = 5 * 1024 * 1024;
const TIPOS = new Set(["image/jpeg", "image/png", "image/webp"]);

function mensagemErro(erro: unknown): string {
  return erro instanceof Error ? erro.message : "Ocorreu um erro inesperado.";
}

export default function EditarPerfilPage() {
  const [perfil, setPerfil] = useState<PerfilPublico | null>(null);
  const [nome, setNome] = useState("");
  const [biografia, setBiografia] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [processandoFoto, setProcessandoFoto] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const inputFoto = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let ativo = true;
    buscarMeuPerfilPublico()
      .then((dados) => {
        if (!ativo) return;
        setPerfil(dados);
        setNome(dados?.nome_publico ?? "");
        setBiografia(dados?.biografia ?? "");
      })
      .catch((e: unknown) => {
        if (ativo) setErro(mensagemErro(e));
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    return () => { ativo = false; };
  }, []);

  async function salvar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (salvando || processandoFoto) return;
    setErro(null);
    setSucesso(null);
    setSalvando(true);
    try {
      const atualizado = await salvarMeuPerfilPublico({
        nome_publico: nome,
        biografia,
      });
      setPerfil(atualizado);
      setNome(atualizado.nome_publico);
      setBiografia(atualizado.biografia ?? "");
      setSucesso("Perfil salvo com sucesso!");
    } catch (e) {
      setErro(mensagemErro(e));
    } finally {
      setSalvando(false);
    }
  }

  async function trocarFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    e.target.value = "";
    if (!arquivo || processandoFoto || salvando) return;
    setErro(null);
    setSucesso(null);
    if (!TIPOS.has(arquivo.type) || arquivo.size <= 0 || arquivo.size > MAX_FOTO) {
      setErro("Escolha uma foto JPG, PNG ou WebP de até 5 MB.");
      return;
    }
    if (!perfil) {
      setErro("Primeiro salve seu nome público para liberar o envio da foto.");
      return;
    }
    setProcessandoFoto(true);
    try {
      const atualizado = await enviarMinhaFotoPerfil(arquivo);
      setPerfil(atualizado);
      setSucesso("Foto de perfil atualizada!");
    } catch (e) {
      // Uma falha ao limpar a foto antiga pode ocorrer após salvar a nova.
      // Recarregamos o perfil para refletir o estado real do banco.
      setErro(mensagemErro(e));
      try { setPerfil(await buscarMeuPerfilPublico()); } catch { /* preserva o erro original */ }
    } finally {
      setProcessandoFoto(false);
    }
  }

  async function removerFoto() {
    if (!perfil?.foto_caminho || processandoFoto || salvando) return;
    if (!window.confirm("Remover sua foto de perfil?")) return;
    setErro(null);
    setSucesso(null);
    setProcessandoFoto(true);
    try {
      const atualizado = await removerMinhaFotoPerfil();
      setPerfil(atualizado);
      setSucesso("Foto removida com sucesso!");
    } catch (e) {
      setErro(mensagemErro(e));
      try { setPerfil(await buscarMeuPerfilPublico()); } catch { /* preserva o erro original */ }
    } finally {
      setProcessandoFoto(false);
    }
  }

  const ocupado = salvando || processandoFoto;
  const fotoUrl = perfil?.foto_url
    ? `${perfil.foto_url}${perfil.atualizado_em ? `?v=${encodeURIComponent(perfil.atualizado_em)}` : ""}`
    : null;

  return (
    <main className="min-h-screen bg-[#090909] px-4 py-10 text-white sm:px-6">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.25em] text-[#d6aa46]">Comunidade Celebra</p>
            <h1 className="text-3xl font-bold">Editar perfil público</h1>
            <p className="mt-2 text-sm text-zinc-400">Personalize como você aparece na comunidade.</p>
          </div>
          <Link href="/feed" className="rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-200 hover:border-[#d6aa46]">
            Voltar ao feed
          </Link>
        </div>

        {erro && <div role="alert" className="mb-5 rounded-xl border border-red-800 bg-red-950/30 p-4 text-sm text-red-200">{erro}</div>}
        {sucesso && <div role="status" className="mb-5 rounded-xl border border-[#d6aa46]/40 bg-[#d6aa46]/10 p-4 text-sm text-[#e8bf62]">{sucesso}</div>}

        {carregando ? (
          <p className="py-14 text-center text-zinc-400">Carregando seu perfil...</p>
        ) : (
          <div className="space-y-6">
            <section className="rounded-2xl border border-zinc-800 bg-[#141414] p-5 sm:p-7">
              <h2 className="mb-5 text-lg font-semibold">Foto de perfil</h2>
              <div className="flex flex-wrap items-center gap-5">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[#d6aa46]/70 bg-[#2a2417] text-4xl font-bold text-[#d6aa46]">
                  {fotoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={fotoUrl} alt="Sua foto de perfil" className="h-full w-full object-cover" />
                  ) : (nome.trim().charAt(0).toUpperCase() || "C")}
                </div>
                <div className="space-y-3">
                  <p className="text-sm text-zinc-400">JPG, PNG ou WebP. Máximo de 5 MB.</p>
                  <input ref={inputFoto} type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => void trocarFoto(e)} className="hidden" aria-label="Escolher foto de perfil" />
                  <div className="flex flex-wrap gap-2">
                    <button type="button" disabled={ocupado || !perfil} onClick={() => inputFoto.current?.click()}
                      className="rounded-lg bg-[#d6aa46] px-4 py-2 text-sm font-bold text-[#090909] hover:bg-[#e8bf62] disabled:cursor-not-allowed disabled:opacity-50">
                      {processandoFoto ? "Processando..." : fotoUrl ? "Trocar foto" : "Adicionar foto"}
                    </button>
                    {fotoUrl && <button type="button" disabled={ocupado} onClick={() => void removerFoto()}
                      className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-200 hover:border-red-500 hover:text-red-300 disabled:opacity-50">Remover foto</button>}
                  </div>
                  {!perfil && <p className="text-xs text-zinc-500">Salve seu nome público primeiro para adicionar uma foto.</p>}
                </div>
              </div>
            </section>

            <form onSubmit={(e) => void salvar(e)} className="space-y-5 rounded-2xl border border-zinc-800 bg-[#141414] p-5 sm:p-7">
              <h2 className="text-lg font-semibold">Informações públicas</h2>
              <div>
                <label htmlFor="nome-publico" className="mb-2 block text-sm font-medium text-zinc-200">Nome público *</label>
                <input id="nome-publico" type="text" required minLength={2} maxLength={100} value={nome} onChange={(e) => setNome(e.target.value)}
                  placeholder="Como você quer ser chamado?" disabled={ocupado}
                  className="w-full rounded-xl border border-zinc-700 bg-[#0d0d0d] px-4 py-3 text-white outline-none placeholder:text-zinc-500 focus:border-[#d6aa46] disabled:opacity-60" />
                <p className="mt-1 text-right text-xs text-zinc-500">{nome.length}/100</p>
              </div>
              <div>
                <label htmlFor="biografia" className="mb-2 block text-sm font-medium text-zinc-200">Biografia</label>
                <textarea id="biografia" rows={5} maxLength={500} value={biografia} onChange={(e) => setBiografia(e.target.value)}
                  placeholder="Conte um pouco sobre você ou seu trabalho..." disabled={ocupado}
                  className="w-full resize-y rounded-xl border border-zinc-700 bg-[#0d0d0d] px-4 py-3 text-white outline-none placeholder:text-zinc-500 focus:border-[#d6aa46] disabled:opacity-60" />
                <p className="mt-1 text-right text-xs text-zinc-500">{biografia.length}/500</p>
              </div>
              <button type="submit" disabled={ocupado || nome.trim().length < 2}
                className="w-full rounded-xl bg-[#d6aa46] px-5 py-3 font-bold text-[#090909] hover:bg-[#e8bf62] disabled:cursor-not-allowed disabled:opacity-50">
                {salvando ? "Salvando..." : "Salvar perfil"}
              </button>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}
