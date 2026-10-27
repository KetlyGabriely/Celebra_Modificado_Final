import { supabase } from "@/services/supabase";

export interface ComentarioFeed {
  id: string;
  publicacao_id: string;
  usuario_id: string;
  conteudo: string;
  criado_em: string;
  atualizado_em: string;
}

export interface InteracoesPublicacaoFeed {
  totalCurtidas: number;
  totalComentarios: number;
  curtiu: boolean;
  salvou: boolean;
}

async function usuarioAtual(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw new Error(error.message);
  if (!data.user) throw new Error("Faça login para interagir com o feed.");
  return data.user.id;
}

export async function curtirPublicacaoFeed(publicacaoId: string): Promise<void> {
  const usuarioId = await usuarioAtual();
  const { error } = await supabase.from("feed_curtidas").insert({
    publicacao_id: publicacaoId,
    usuario_id: usuarioId,
  });
  if (error && error.code !== "23505") throw new Error(error.message);
}

export async function descurtirPublicacaoFeed(publicacaoId: string): Promise<void> {
  const usuarioId = await usuarioAtual();
  const { error } = await supabase.from("feed_curtidas")
    .delete().eq("publicacao_id", publicacaoId).eq("usuario_id", usuarioId);
  if (error) throw new Error(error.message);
}

export async function salvarPublicacaoFeed(publicacaoId: string): Promise<void> {
  const usuarioId = await usuarioAtual();
  const { error } = await supabase.from("feed_salvos").insert({
    publicacao_id: publicacaoId,
    usuario_id: usuarioId,
  });
  if (error && error.code !== "23505") throw new Error(error.message);
}

export async function removerPublicacaoSalvaFeed(publicacaoId: string): Promise<void> {
  const usuarioId = await usuarioAtual();
  const { error } = await supabase.from("feed_salvos")
    .delete().eq("publicacao_id", publicacaoId).eq("usuario_id", usuarioId);
  if (error) throw new Error(error.message);
}

export async function listarComentariosFeed(publicacaoId: string): Promise<ComentarioFeed[]> {
  const { data, error } = await supabase.from("feed_comentarios")
    .select("id, publicacao_id, usuario_id, conteudo, criado_em, atualizado_em")
    .eq("publicacao_id", publicacaoId)
    .order("criado_em", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as ComentarioFeed[];
}

export async function comentarPublicacaoFeed(
  publicacaoId: string,
  conteudo: string
): Promise<ComentarioFeed> {
  const usuarioId = await usuarioAtual();
  const texto = conteudo.trim();
  if (texto.length < 1 || texto.length > 1000) {
    throw new Error("O comentário deve ter entre 1 e 1.000 caracteres.");
  }
  const { data, error } = await supabase.from("feed_comentarios")
    .insert({ publicacao_id: publicacaoId, usuario_id: usuarioId, conteudo: texto })
    .select("id, publicacao_id, usuario_id, conteudo, criado_em, atualizado_em")
    .single();
  if (error) throw new Error(error.message);
  return data as ComentarioFeed;
}

export async function editarComentarioFeed(
  comentarioId: string,
  conteudo: string
): Promise<ComentarioFeed> {
  const usuarioId = await usuarioAtual();
  const texto = conteudo.trim();
  if (texto.length < 1 || texto.length > 1000) {
    throw new Error("O comentário deve ter entre 1 e 1.000 caracteres.");
  }
  const { data, error } = await supabase.from("feed_comentarios")
    .update({ conteudo: texto, atualizado_em: new Date().toISOString() })
    .eq("id", comentarioId).eq("usuario_id", usuarioId)
    .select("id, publicacao_id, usuario_id, conteudo, criado_em, atualizado_em")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Comentário não encontrado ou sem permissão para editar.");
  return data as ComentarioFeed;
}

export async function excluirComentarioFeed(comentarioId: string): Promise<void> {
  const usuarioId = await usuarioAtual();
  const { error } = await supabase.from("feed_comentarios")
    .delete().eq("id", comentarioId).eq("usuario_id", usuarioId);
  if (error) throw new Error(error.message);
}

export async function buscarInteracoesPublicacaoFeed(
  publicacaoId: string
): Promise<InteracoesPublicacaoFeed> {
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError) throw new Error(authError.message);
  const usuarioId = auth.user?.id;

  const [curtidas, comentarios] = await Promise.all([
    supabase.from("feed_curtidas").select("id", { count: "exact", head: true })
      .eq("publicacao_id", publicacaoId),
    supabase.from("feed_comentarios").select("id", { count: "exact", head: true })
      .eq("publicacao_id", publicacaoId),
  ]);
  if (curtidas.error) throw new Error(curtidas.error.message);
  if (comentarios.error) throw new Error(comentarios.error.message);

  let curtiu = false;
  let salvou = false;
  if (usuarioId) {
    const [minhaCurtida, meuSalvo] = await Promise.all([
      supabase.from("feed_curtidas").select("id").eq("publicacao_id", publicacaoId)
        .eq("usuario_id", usuarioId).maybeSingle(),
      supabase.from("feed_salvos").select("id").eq("publicacao_id", publicacaoId)
        .eq("usuario_id", usuarioId).maybeSingle(),
    ]);
    if (minhaCurtida.error) throw new Error(minhaCurtida.error.message);
    if (meuSalvo.error) throw new Error(meuSalvo.error.message);
    curtiu = Boolean(minhaCurtida.data);
    salvou = Boolean(meuSalvo.data);
  }

  return {
    totalCurtidas: curtidas.count ?? 0,
    totalComentarios: comentarios.count ?? 0,
    curtiu,
    salvou,
  };
}

export async function listarIdsPublicacoesSalvasFeed(): Promise<string[]> {
  const usuarioId = await usuarioAtual();
  const { data, error } = await supabase.from("feed_salvos")
    .select("publicacao_id").eq("usuario_id", usuarioId)
    .order("criado_em", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((item) => item.publicacao_id);
}
