import { supabase } from "@/services/supabase";

const BUCKET = "feed-celebra";
const MAX_FOTOS = 10;
const MAX_BYTES = 10 * 1024 * 1024;
const TIPOS = new Set(["image/jpeg", "image/png", "image/webp"]);

export interface CriarPublicacaoFeed {
  legenda: string;
  tipo_evento?: string;
  evento_id?: string | null;
  fotos: File[];
  servicos_ids?: string[];
}

export interface FotoFeed {
  id: string;
  publicacao_id: string;
  caminho_storage: string;
  ordem: number;
  url: string;
}

export interface PublicacaoFeed {
  id: string;
  usuario_id: string;
  evento_id: string | null;
  legenda: string;
  tipo_evento: string | null;
  criado_em: string;
  fotos: FotoFeed[];
  servicos_marcados: { servico_id: string }[];
}

function mensagemErro(erro: unknown): string {
  return erro instanceof Error ? erro.message : String(erro);
}

function extensao(mime: string): string {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg";
}

export async function criarPublicacaoFeed(dados: CriarPublicacaoFeed): Promise<string> {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw new Error(authError.message);
  const usuario = authData.user;
  if (!usuario) throw new Error("Você precisa estar autenticado.");

  const legenda = dados.legenda.trim();
  const tipoEvento = dados.tipo_evento?.trim() || null;
  const fotos = dados.fotos;
  const servicosIds = [...new Set(dados.servicos_ids ?? [])];

  if (legenda.length > 3000) throw new Error("A legenda deve ter no máximo 3.000 caracteres.");
  if (tipoEvento && tipoEvento.length > 100) throw new Error("O tipo de evento é muito longo.");
  if (!fotos.length || fotos.length > MAX_FOTOS) throw new Error("Selecione entre 1 e 10 fotos.");
  if (servicosIds.length > 20) throw new Error("Marque no máximo 20 serviços.");
  for (const foto of fotos) {
    if (!TIPOS.has(foto.type)) throw new Error("Envie apenas imagens JPG, PNG ou WebP.");
    if (foto.size === 0 || foto.size > MAX_BYTES) throw new Error("Cada foto deve ter até 10 MB e não pode estar vazia.");
  }

  // A autorização definitiva de cliente/profissional e evento ocorre nas políticas RLS.
  const { data: publicacao, error: publicacaoError } = await supabase
    .from("feed_publicacoes")
    .insert({
      usuario_id: usuario.id,
      legenda,
      tipo_evento: tipoEvento,
      evento_id: dados.evento_id || null,
    })
    .select("id")
    .single();
  if (publicacaoError) throw new Error(publicacaoError.message);

  const id = publicacao.id as string;
  const caminhosEnviados: string[] = [];
  try {
    const registros: { publicacao_id: string; caminho_storage: string; ordem: number }[] = [];
    for (let i = 0; i < fotos.length; i++) {
      const foto = fotos[i];
      const caminho = `${usuario.id}/${id}/${crypto.randomUUID()}.${extensao(foto.type)}`;
      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(caminho, foto, {
        contentType: foto.type,
        upsert: false,
      });
      if (uploadError) throw new Error(`Erro ao enviar a foto ${i + 1}: ${uploadError.message}`);
      caminhosEnviados.push(caminho);
      registros.push({ publicacao_id: id, caminho_storage: caminho, ordem: i });
    }

    const { error: fotosError } = await supabase.from("feed_fotos").insert(registros);
    if (fotosError) throw new Error(fotosError.message);

    if (servicosIds.length) {
      const { error: marcacoesError } = await supabase.from("feed_servicos_marcados").insert(
        servicosIds.map((servico_id) => ({ publicacao_id: id, servico_id }))
      );
      if (marcacoesError) throw new Error(marcacoesError.message);
    }
    return id;
  } catch (erro) {
    // Compensação de falhas; não é uma transação distribuída entre DB e Storage.
    const falhas: string[] = [];
    if (caminhosEnviados.length) {
      const { error } = await supabase.storage.from(BUCKET).remove(caminhosEnviados);
      if (error) falhas.push(`arquivos: ${error.message}`);
    }
    const { error: deleteError } = await supabase.from("feed_publicacoes").delete().eq("id", id);
    if (deleteError) falhas.push(`publicação: ${deleteError.message}`);
    throw new Error(`Não foi possível publicar: ${mensagemErro(erro)}${falhas.length ? `. A limpeza também falhou (${falhas.join("; ")}).` : ""}`);
  }
}

export async function listarPublicacoesFeed(limite = 20): Promise<PublicacaoFeed[]> {
  const quantidade = Math.max(1, Math.min(50, Math.floor(limite)));
  const { data, error } = await supabase
    .from("feed_publicacoes")
    .select("id, usuario_id, evento_id, legenda, tipo_evento, criado_em, feed_fotos(id, publicacao_id, caminho_storage, ordem), feed_servicos_marcados(servico_id)")
    .order("criado_em", { ascending: false })
    .limit(quantidade);
  if (error) throw new Error(error.message);

  return (data ?? []).map((item) => {
    const fotos = [...(item.feed_fotos ?? [])]
      .sort((a, b) => a.ordem - b.ordem)
      .map((foto) => ({
        ...foto,
        url: supabase.storage.from(BUCKET).getPublicUrl(foto.caminho_storage).data.publicUrl,
      }));
    return {
      id: item.id,
      usuario_id: item.usuario_id,
      evento_id: item.evento_id,
      legenda: item.legenda,
      tipo_evento: item.tipo_evento,
      criado_em: item.criado_em,
      fotos,
      servicos_marcados: item.feed_servicos_marcados ?? [],
    };
  });
}

export async function excluirPublicacaoFeed(publicacaoId: string): Promise<void> {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw new Error(authError.message);
  if (!authData.user) throw new Error("Você precisa estar autenticado.");

  const { data: publicacao, error: buscaError } = await supabase
    .from("feed_publicacoes")
    .select("id, usuario_id, feed_fotos(caminho_storage)")
    .eq("id", publicacaoId)
    .eq("usuario_id", authData.user.id)
    .maybeSingle();
  if (buscaError) throw new Error(buscaError.message);
  if (!publicacao) throw new Error("Publicação não encontrada ou sem permissão.");

  const caminhos = (publicacao.feed_fotos ?? []).map((foto) => foto.caminho_storage);
  if (caminhos.length) {
    const { error: storageError } = await supabase.storage.from(BUCKET).remove(caminhos);
    if (storageError) throw new Error(`Não foi possível excluir as fotos: ${storageError.message}`);
  }
  const { error: deleteError } = await supabase
    .from("feed_publicacoes")
    .delete()
    .eq("id", publicacaoId)
    .eq("usuario_id", authData.user.id);
  if (deleteError) throw new Error(deleteError.message);
}
