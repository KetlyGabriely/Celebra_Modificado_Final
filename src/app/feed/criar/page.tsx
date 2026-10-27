"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { criarPublicacaoFeed } from "@/controllers/feedController";
import { supabase } from "@/services/supabase";

type ServicoOpcao = { id: string; nome: string; profissionais: { nome_empresa: string } | { nome_empresa: string }[] | null };

const tipos = ["Casamento", "Aniversário", "Formatura", "Chá revelação", "Evento corporativo", "Festa infantil", "Outro"];

export default function CriarPublicacaoFeedPage() {
  const router = useRouter();
  const [fotos, setFotos] = useState<File[]>([]);
  const [legenda, setLegenda] = useState("");
  const [tipoEvento, setTipoEvento] = useState("");
  const [busca, setBusca] = useState("");
  const [servicos, setServicos] = useState<ServicoOpcao[]>([]);
  const [marcados, setMarcados] = useState<string[]>([]);
  const [carregandoServicos, setCarregandoServicos] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const previews = useMemo(() => fotos.map((foto) => URL.createObjectURL(foto)), [fotos]);
  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);

  useEffect(() => {
    let ativo = true;
    async function carregar() {
      const { data, error } = await supabase.from("servicos")
        .select("id, nome, profissionais(nome_empresa)")
        .eq("ativo", true)
        .order("nome", { ascending: true })
        .limit(300);
      if (!ativo) return;
      if (error) setErro(`Não foi possível carregar os serviços: ${error.message}`);
      else setServicos((data ?? []) as ServicoOpcao[]);
      setCarregandoServicos(false);
    }
    void carregar();
    return () => { ativo = false; };
  }, []);

  const filtrados = servicos.filter((servico) => {
    const profissional = Array.isArray(servico.profissionais)
      ? servico.profissionais[0]?.nome_empresa
      : servico.profissionais?.nome_empresa;
    return `${servico.nome} ${profissional ?? ""}`.toLocaleLowerCase("pt-BR")
      .includes(busca.toLocaleLowerCase("pt-BR"));
  }).slice(0, 30);

  function selecionarFotos(arquivos: FileList | null) {
    if (!arquivos) return;
    setErro("");
    const novos = Array.from(arquivos);
    if (fotos.length + novos.length > 10) {
      setErro("Você pode selecionar no máximo 10 fotos.");
      return;
    }
    if (novos.some((f) => !["image/jpeg", "image/png", "image/webp"].includes(f.type) || f.size === 0 || f.size > 10 * 1024 * 1024)) {
      setErro("Use fotos JPG, PNG ou WebP, com até 10 MB cada.");
      return;
    }
    setFotos((anteriores) => [...anteriores, ...novos]);
  }

  function alternarServico(id: string) {
    setMarcados((anteriores) => anteriores.includes(id)
      ? anteriores.filter((item) => item !== id)
      : anteriores.length < 20 ? [...anteriores, id] : anteriores);
  }

  async function publicar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (enviando) return;
    setErro("");
    setSucesso("");
    if (fotos.length === 0) { setErro("Selecione pelo menos uma foto."); return; }
    setEnviando(true);
    try {
      await criarPublicacaoFeed({
        legenda,
        tipo_evento: tipoEvento || undefined,
        fotos,
        servicos_ids: marcados,
      });
      setSucesso("Publicação criada com sucesso!");
      setFotos([]);
      setLegenda("");
      setTipoEvento("");
      setMarcados([]);
      // A página /feed será criada na etapa 20.3.
      // Por enquanto, mostramos a confirmação nesta tela.
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : "Não foi possível publicar.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#090909] px-4 py-10 text-white">
      <div className="mx-auto max-w-3xl">
        <button type="button" onClick={() => router.back()} className="mb-6 text-sm text-zinc-400 hover:text-white">← Voltar</button>
        <div className="mb-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-[#d6aa46]">Feed Celebra</p>
          <h1 className="text-3xl font-bold">Compartilhe seu evento</h1>
          <p className="mt-2 text-zinc-400">Inspire outras pessoas com fotos e indique os serviços que fizeram parte desse momento.</p>
        </div>
        <form onSubmit={publicar} className="space-y-7 rounded-2xl border border-zinc-800 bg-[#141414] p-5 sm:p-8">
          <section>
            <label className="mb-3 block font-semibold">Fotos do evento <span className="text-[#d6aa46]">*</span></label>
            <label className="flex cursor-pointer flex-col items-center rounded-xl border border-dashed border-[#d6aa46]/60 bg-[#d6aa46]/5 px-5 py-8 text-center hover:bg-[#d6aa46]/10">
              <span className="text-3xl">📷</span>
              <span className="mt-2 font-medium">Escolher fotos</span>
              <span className="mt-1 text-xs text-zinc-400">JPG, PNG ou WebP • até 10 MB por foto • máximo de 10</span>
              <input type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={enviando} className="sr-only" onChange={(e) => { selecionarFotos(e.target.files); e.target.value = ""; }} />
            </label>
            {previews.length > 0 && <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {previews.map((url, i) => <div key={url} className="relative aspect-square overflow-hidden rounded-lg bg-zinc-900">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Foto ${i + 1}`} className="h-full w-full object-cover" />
                <button type="button" disabled={enviando} onClick={() => setFotos((atual) => atual.filter((_, indice) => indice !== i))} className="absolute right-2 top-2 rounded-full bg-black/80 px-2.5 py-1 text-sm hover:bg-red-800" aria-label={`Remover foto ${i + 1}`}>✕</button>
              </div>)}
            </div>}
            <p className="mt-2 text-xs text-zinc-500">{fotos.length}/10 fotos selecionadas</p>
          </section>

          <section>
            <label htmlFor="legenda" className="mb-2 block font-semibold">Legenda</label>
            <textarea id="legenda" value={legenda} maxLength={3000} onChange={(e) => setLegenda(e.target.value)} disabled={enviando} rows={5} placeholder="Conte como foi esse momento especial..." className="w-full resize-y rounded-xl border border-zinc-700 bg-[#0b0b0b] p-3 text-white outline-none focus:border-[#d6aa46]" />
            <p className="text-right text-xs text-zinc-500">{legenda.length}/3000</p>
          </section>

          <section>
            <label htmlFor="tipo" className="mb-2 block font-semibold">Tipo de evento</label>
            <select id="tipo" value={tipoEvento} onChange={(e) => setTipoEvento(e.target.value)} disabled={enviando} className="w-full rounded-xl border border-zinc-700 bg-[#0b0b0b] p-3 text-white outline-none focus:border-[#d6aa46]">
              <option value="">Selecione (opcional)</option>
              {tipos.map((tipo) => <option key={tipo} value={tipo}>{tipo}</option>)}
            </select>
          </section>

          <section>
            <div className="mb-2 font-semibold">Marcar serviços do Celebra <span className="text-sm font-normal text-zinc-500">(opcional)</span></div>
            <p className="mb-3 text-sm text-zinc-400">Marque somente serviços relacionados às fotos. A marcação não significa contratação verificada.</p>
            <input value={busca} onChange={(e) => setBusca(e.target.value)} disabled={enviando} placeholder="Buscar serviço ou empresa..." className="w-full rounded-xl border border-zinc-700 bg-[#0b0b0b] p-3 text-white outline-none focus:border-[#d6aa46]" />
            <div className="mt-3 max-h-64 space-y-2 overflow-y-auto">
              {carregandoServicos && <p className="text-sm text-zinc-400">Carregando serviços...</p>}
              {!carregandoServicos && filtrados.length === 0 && <p className="text-sm text-zinc-400">Nenhum serviço encontrado.</p>}
              {filtrados.map((servico) => {
                const empresa = Array.isArray(servico.profissionais) ? servico.profissionais[0]?.nome_empresa : servico.profissionais?.nome_empresa;
                return <label key={servico.id} className="flex cursor-pointer items-center gap-3 rounded-lg border border-zinc-800 p-3 hover:border-[#d6aa46]/50">
                  <input type="checkbox" checked={marcados.includes(servico.id)} onChange={() => alternarServico(servico.id)} disabled={enviando || (!marcados.includes(servico.id) && marcados.length >= 20)} className="accent-[#d6aa46]" />
                  <span><span className="block text-sm font-medium">{servico.nome}</span><span className="text-xs text-zinc-400">{empresa || "Profissional Celebra"}</span></span>
                </label>;
              })}
            </div>
            <p className="mt-2 text-xs text-zinc-500">{marcados.length}/20 serviços marcados</p>
          </section>

          {erro && <p role="alert" className="rounded-lg border border-red-900 bg-red-950/40 p-3 text-sm text-red-300">{erro}</p>}
          {sucesso && <p role="status" className="rounded-lg border border-emerald-900 bg-emerald-950/30 p-3 text-sm text-emerald-300">{sucesso}</p>}
          <button type="submit" disabled={enviando || fotos.length === 0} className="w-full rounded-xl bg-[#d6aa46] px-5 py-3 font-bold text-black transition hover:bg-[#ebc56e] disabled:cursor-not-allowed disabled:opacity-50">
            {enviando ? "Publicando fotos, aguarde..." : "Publicar no Feed Celebra"}
          </button>
        </form>
      </div>
    </main>
  );
}
