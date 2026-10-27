
import { supabase } from "@/services/supabase";

export interface DadosPerfil {
  id: string;
  nome: string;
  telefone: string | null;
  avatar_url: string | null;
  cidade: string | null;
  estado: string | null;
  tipo: string;
}

export interface AtualizacaoPerfil {
  nome: string;
  telefone: string | null;
  cidade: string | null;
  estado: string | null;
}

export async function buscarPerfil(): Promise<DadosPerfil> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) throw authError;
  if (!user) throw new Error("Usuário não autenticado.");

  const { data, error } = await supabase
    .from("perfis")
    .select("id, nome, telefone, avatar_url, cidade, estado, tipo")
    .eq("id", user.id)
    .single();

  if (error) throw error;
  if (!data) throw new Error("Perfil não encontrado.");

  return data as DadosPerfil;
}

export async function atualizarPerfil(
  dados: AtualizacaoPerfil
): Promise<DadosPerfil> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) throw authError;
  if (!user) throw new Error("Usuário não autenticado.");

  const nome = dados.nome.trim();

  if (!nome) {
    throw new Error("O nome não pode ficar vazio.");
  }

  const { data, error } = await supabase
    .from("perfis")
    .update({
      nome,
      telefone: dados.telefone?.trim() || null,
      cidade: dados.cidade?.trim() || null,
      estado: dados.estado?.trim() || null,
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", user.id)
    .select("id, nome, telefone, avatar_url, cidade, estado, tipo")
    .single();

  if (error) throw error;
  if (!data) throw new Error("Não foi possível atualizar o perfil.");

  return data as DadosPerfil;
}


export async function atualizarFotoPerfil(arquivo: File): Promise<string> {
  const tiposPermitidos = [
    "image/jpeg",
    "image/png",
    "image/webp",
  ];

  if (!tiposPermitidos.includes(arquivo.type)) {
    throw new Error("Escolha uma imagem JPG, PNG ou WebP.");
  }

  if (arquivo.size > 2 * 1024 * 1024) {
    throw new Error("A imagem deve ter no máximo 2 MB.");
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) throw authError;
  if (!user) throw new Error("Usuário não autenticado.");

  const extensoes: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };

  const extensao = extensoes[arquivo.type];

  // Cada usuário possui sua própria pasta.
  // Um nome único evita problemas com cache.
  const caminho = `${user.id}/${crypto.randomUUID()}.${extensao}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(caminho, arquivo, {
      contentType: arquivo.type,
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage
    .from("avatars")
    .getPublicUrl(caminho);

  const url = urlData.publicUrl;

  const { data: perfilAtualizado, error: updateError } = await supabase
    .from("perfis")
    .update({
      avatar_url: url,
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", user.id)
    .select("id")
    .single();

  if (updateError || !perfilAtualizado) {
    // Remove o arquivo recém-enviado caso o perfil não seja atualizado.
    await supabase.storage.from("avatars").remove([caminho]);
    throw updateError || new Error("Não foi possível salvar a foto.");
  }

  return url;
}

