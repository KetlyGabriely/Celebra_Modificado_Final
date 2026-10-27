import { supabase } from "@/services/supabase";
import type { PublicacaoFeed } from "@/controllers/feedController";

const BUCKET_FOTOS_PERFIL = "perfis-celebra";
const BUCKET_FOTOS_FEED = "feed-celebra";

export interface PerfilPublicoVisualizacao {
  usuario_id: string;
  nome: string;
  biografia: string | null;
  foto_url: string | null;
  profissional: boolean;
}

export interface PaginaPerfilPublico {
  perfil: PerfilPublicoVisualizacao;
  publicacoes: PublicacaoFeed[];
}

function validarUsuarioId(usuarioId: string): void {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(usuarioId)) {
    throw new Error("Identificador de perfil inválido.");
  }
}

/** Consulta somente dados públicos; nunca consulta auth.users diretamente. */
export async function buscarPerfilPublicoVisualizacao(
  usuarioId: string
): Promise<PerfilPublicoVisualizacao | null> {
  validarUsuarioId(usuarioId);

  const [perfilResult, profissionalResult, clienteResult] = await Promise.all([
    supabase
      .from("perfis_publicos")
      .select("usuario_id, nome_publico, biografia, foto_caminho")
      .eq("usuario_id", usuarioId)
      .maybeSingle(),
    supabase
      .from("profissionais")
      .select("usuario_id, nome_empresa")
      .eq("usuario_id", usuarioId)
      .maybeSingle(),
    supabase
      .from("clientes")
      .select("usuario_id")
      .eq("usuario_id", usuarioId)
      .maybeSingle(),
  ]);

  if (perfilResult.error) throw new Error(perfilResult.error.message);
  // Algumas políticas RLS podem ocultar os cadastros de outros usuários.
  // Nesse caso, o perfil público cadastrado continua acessível.
  const perfil = perfilResult.data;
  const profissional = profissionalResult.error ? null : profissionalResult.data;
  const cliente = clienteResult.error ? null : clienteResult.data;

  if (!perfil && !profissional && !cliente) return null;

  const nome = perfil?.nome_publico?.trim()
    || profissional?.nome_empresa?.trim()
    || (cliente ? "Cliente Celebra" : "Membro Celebra");

  const fotoUrl = perfil?.foto_caminho
    ? supabase.storage.from(BUCKET_FOTOS_PERFIL).getPublicUrl(perfil.foto_caminho).data.publicUrl
    : null;

  return {
    usuario_id: usuarioId,
    nome,
    biografia: perfil?.biografia ?? null,
    foto_url: fotoUrl,
    profissional: Boolean(profissional),
  };
}

/** Busca publicações do autor com as mesmas fotos e marcações usadas no Feed. */
export async function listarPublicacoesDoPerfil(
  usuarioId: string,
  limite = 30
): Promise<PublicacaoFeed[]> {
  validarUsuarioId(usuarioId);
  const quantidade = Number.isFinite(limite)
    ? Math.max(1, Math.min(50, Math.floor(limite)))
    : 30;

  const { data, error } = await supabase
    .from("feed_publicacoes")
    .select("id, usuario_id, evento_id, legenda, tipo_evento, criado_em, feed_fotos(id, publicacao_id, caminho_storage, ordem), feed_servicos_marcados(servico_id)")
    .eq("usuario_id", usuarioId)
    .order("criado_em", { ascending: false })
    .limit(quantidade);

  if (error) throw new Error(error.message);

  return (data ?? []).map((item) => ({
    id: item.id,
    usuario_id: item.usuario_id,
    evento_id: item.evento_id,
    legenda: item.legenda,
    tipo_evento: item.tipo_evento,
    criado_em: item.criado_em,
    fotos: [...(item.feed_fotos ?? [])]
      .sort((a, b) => a.ordem - b.ordem)
      .map((foto) => ({
        ...foto,
        url: supabase.storage.from(BUCKET_FOTOS_FEED)
          .getPublicUrl(foto.caminho_storage).data.publicUrl,
      })),
    servicos_marcados: item.feed_servicos_marcados ?? [],
  }));
}

/** Carrega as informações para a futura página /perfil/[id]. */
export async function carregarPaginaPerfilPublico(
  usuarioId: string,
  limite = 30
): Promise<PaginaPerfilPublico | null> {
  const [perfil, publicacoes] = await Promise.all([
    buscarPerfilPublicoVisualizacao(usuarioId),
    listarPublicacoesDoPerfil(usuarioId, limite),
  ]);

  if (!perfil && publicacoes.length === 0) return null;

  return {
    perfil: perfil ?? {
      usuario_id: usuarioId,
      nome: "Membro Celebra",
      biografia: null,
      foto_url: null,
      profissional: false,
    },
    publicacoes,
  };
}
