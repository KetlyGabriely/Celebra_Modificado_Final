import { supabase } from "@/services/supabase";

const BUCKET = "perfis-celebra";
const LIMITE_FOTO = 5 * 1024 * 1024;
const TIPOS_PERMITIDOS = new Set(["image/jpeg", "image/png", "image/webp"]);

export interface PerfilPublico {
  usuario_id: string;
  nome_publico: string;
  biografia: string | null;
  foto_caminho: string | null;
  criado_em: string;
  atualizado_em: string;
  foto_url: string | null;
}

export interface DadosPerfilPublico {
  nome_publico: string;
  biografia?: string | null;
}

type PerfilRegistro = Omit<PerfilPublico, "foto_url">;

function mensagem(erro: unknown): string {
  return erro instanceof Error ? erro.message : String(erro);
}

async function usuarioAtual(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw new Error(error.message);
  if (!data.user) throw new Error("Faça login para editar seu perfil.");
  return data.user.id;
}

function comUrl(perfil: PerfilRegistro): PerfilPublico {
  return {
    ...perfil,
    foto_url: perfil.foto_caminho
      ? supabase.storage.from(BUCKET).getPublicUrl(perfil.foto_caminho).data.publicUrl
      : null,
  };
}

function validarDados(dados: DadosPerfilPublico) {
  const nome_publico = dados.nome_publico.trim();
  const biografia = dados.biografia?.trim() || null;
  if (nome_publico.length < 2 || nome_publico.length > 100) {
    throw new Error("O nome público deve ter entre 2 e 100 caracteres.");
  }
  if (biografia && biografia.length > 500) {
    throw new Error("A biografia deve ter no máximo 500 caracteres.");
  }
  return { nome_publico, biografia };
}

export async function buscarMeuPerfilPublico(): Promise<PerfilPublico | null> {
  const usuarioId = await usuarioAtual();
  const { data, error } = await supabase
    .from("perfis_publicos")
    .select("usuario_id, nome_publico, biografia, foto_caminho, criado_em, atualizado_em")
    .eq("usuario_id", usuarioId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? comUrl(data as PerfilRegistro) : null;
}

export async function buscarPerfilPublico(usuarioId: string): Promise<PerfilPublico | null> {
  const { data, error } = await supabase
    .from("perfis_publicos")
    .select("usuario_id, nome_publico, biografia, foto_caminho, criado_em, atualizado_em")
    .eq("usuario_id", usuarioId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? comUrl(data as PerfilRegistro) : null;
}

export async function salvarMeuPerfilPublico(dados: DadosPerfilPublico): Promise<PerfilPublico> {
  const usuarioId = await usuarioAtual();
  const valores = validarDados(dados);
  // A política RLS verifica que o perfil pertence ao usuário autenticado.
  const { data, error } = await supabase
    .from("perfis_publicos")
    .upsert({
      usuario_id: usuarioId,
      ...valores,
      atualizado_em: new Date().toISOString(),
    }, { onConflict: "usuario_id" })
    .select("usuario_id, nome_publico, biografia, foto_caminho, criado_em, atualizado_em")
    .single();
  if (error) throw new Error(error.message);
  return comUrl(data as PerfilRegistro);
}

export async function enviarMinhaFotoPerfil(arquivo: File): Promise<PerfilPublico> {
  const usuarioId = await usuarioAtual();
  if (!TIPOS_PERMITIDOS.has(arquivo.type)) {
    throw new Error("A foto deve ser JPG, PNG ou WebP.");
  }
  if (arquivo.size <= 0 || arquivo.size > LIMITE_FOTO) {
    throw new Error("A foto deve ter até 5 MB e não pode estar vazia.");
  }

  const atual = await buscarMeuPerfilPublico();
  if (!atual) {
    throw new Error("Salve seu nome público antes de enviar uma foto.");
  }

  const extensao = arquivo.type === "image/png" ? "png" : arquivo.type === "image/webp" ? "webp" : "jpg";
  const novoCaminho = `${usuarioId}/${crypto.randomUUID()}.${extensao}`;
  const { error: uploadError } = await supabase.storage.from(BUCKET)
    .upload(novoCaminho, arquivo, { contentType: arquivo.type, upsert: false });
  if (uploadError) throw new Error(`Erro ao enviar foto: ${uploadError.message}`);

  const { data, error } = await supabase
    .from("perfis_publicos")
    .update({ foto_caminho: novoCaminho, atualizado_em: new Date().toISOString() })
    .eq("usuario_id", usuarioId)
    .select("usuario_id, nome_publico, biografia, foto_caminho, criado_em, atualizado_em")
    .maybeSingle();

  if (error || !data) {
    const { error: limpezaError } = await supabase.storage.from(BUCKET).remove([novoCaminho]);
    throw new Error(`Não foi possível vincular a foto ao perfil: ${error?.message ?? "perfil não encontrado"}${limpezaError ? `. Falha ao limpar o arquivo: ${limpezaError.message}` : ""}`);
  }

  // Limpa a foto anterior somente depois de atualizar o perfil com sucesso.
  // Uma falha nessa limpeza não desfaz a foto nova, mas é comunicada ao usuário.
  if (atual.foto_caminho && atual.foto_caminho !== novoCaminho) {
    const { error: limpezaError } = await supabase.storage.from(BUCKET).remove([atual.foto_caminho]);
    if (limpezaError) {
      throw new Error(`A nova foto foi salva, mas não foi possível remover a anterior: ${limpezaError.message}`);
    }
  }
  return comUrl(data as PerfilRegistro);
}

export async function removerMinhaFotoPerfil(): Promise<PerfilPublico> {
  const usuarioId = await usuarioAtual();
  const atual = await buscarMeuPerfilPublico();
  if (!atual) throw new Error("Salve seu perfil antes de remover a foto.");
  if (!atual.foto_caminho) return atual;

  const { data, error } = await supabase
    .from("perfis_publicos")
    .update({ foto_caminho: null, atualizado_em: new Date().toISOString() })
    .eq("usuario_id", usuarioId)
    .select("usuario_id, nome_publico, biografia, foto_caminho, criado_em, atualizado_em")
    .maybeSingle();
  if (error || !data) throw new Error(error?.message ?? "Perfil não encontrado.");

  const { error: storageError } = await supabase.storage.from(BUCKET).remove([atual.foto_caminho]);
  if (storageError) {
    throw new Error(`A foto foi desvinculada do perfil, mas não foi possível excluir o arquivo: ${mensagem(storageError)}`);
  }
  return comUrl(data as PerfilRegistro);
}
