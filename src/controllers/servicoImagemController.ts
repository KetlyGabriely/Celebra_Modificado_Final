
import { supabase } from "@/services/supabase";

const BUCKET = "servicos";
const LIMITE_FOTOS = 10;
const TAMANHO_MAXIMO = 5 * 1024 * 1024;

const TIPOS_PERMITIDOS = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export interface ImagemServico {
  id: string;
  servico_id: string;
  caminho_storage: string;
  ordem: number;
  capa: boolean;
  criado_em: string;
  url: string;
}

interface RegistroImagem {
  id: string;
  servico_id: string;
  caminho_storage: string;
  ordem: number;
  capa: boolean;
  criado_em: string;
}

function obterUrl(caminho: string): string {
  const { data } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(caminho);

  return data.publicUrl;
}

function adicionarUrl(
  imagem: RegistroImagem
): ImagemServico {
  return {
    ...imagem,
    url: obterUrl(imagem.caminho_storage),
  };
}

/* ==========================================
   LISTAR IMAGENS DE UM SERVIÇO
========================================== */

export async function listarImagensServico(
  servicoId: string
): Promise<ImagemServico[]> {
  const { data, error } = await supabase
    .from("servico_imagens")
    .select(
      "id, servico_id, caminho_storage, ordem, capa, criado_em"
    )
    .eq("servico_id", servicoId)
    .order("ordem", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as RegistroImagem[]).map(
    adicionarUrl
  );
}

/* ==========================================
   VERIFICAR PROPRIEDADE DO SERVIÇO
========================================== */

async function verificarProprietario(
  servicoId: string
): Promise<string> {
  const {
    data: usuarioData,
    error: usuarioError,
  } = await supabase.auth.getUser();

  if (usuarioError) {
    throw usuarioError;
  }

  const usuario = usuarioData.user;

  if (!usuario) {
    throw new Error("Você precisa estar autenticado.");
  }

  const {
    data: profissional,
    error: profissionalError,
  } = await supabase
    .from("profissionais")
    .select("id")
    .eq("usuario_id", usuario.id)
    .maybeSingle();

  if (profissionalError) {
    throw profissionalError;
  }

  if (!profissional) {
    throw new Error(
      "Perfil profissional não encontrado."
    );
  }

  const {
    data: servico,
    error: servicoError,
  } = await supabase
    .from("servicos")
    .select("id")
    .eq("id", servicoId)
    .eq("profissional_id", profissional.id)
    .maybeSingle();

  if (servicoError) {
    throw servicoError;
  }

  if (!servico) {
    throw new Error(
      "Você não tem permissão para alterar este serviço."
    );
  }

  return usuario.id;
}

/* ==========================================
   ENVIAR FOTO
========================================== */

export async function enviarImagemServico(
  servicoId: string,
  arquivo: File
): Promise<ImagemServico> {
  if (!TIPOS_PERMITIDOS.includes(arquivo.type)) {
    throw new Error(
      "Formato inválido. Utilize JPG, PNG ou WebP."
    );
  }

  if (arquivo.size > TAMANHO_MAXIMO) {
    throw new Error(
      "A imagem deve ter no máximo 5 MB."
    );
  }

  if (arquivo.size === 0) {
    throw new Error("A imagem está vazia.");
  }

  const usuarioId = await verificarProprietario(
    servicoId
  );

  const imagensAtuais = await listarImagensServico(
    servicoId
  );

  if (imagensAtuais.length >= LIMITE_FOTOS) {
    throw new Error(
      "Este serviço já possui o limite de 10 fotos."
    );
  }

  const ordensUsadas = new Set(
    imagensAtuais.map((imagem) => imagem.ordem)
  );

  let ordem = 0;

  while (
    ordem < LIMITE_FOTOS &&
    ordensUsadas.has(ordem)
  ) {
    ordem++;
  }

  if (ordem >= LIMITE_FOTOS) {
    throw new Error(
      "Não há posições disponíveis para novas fotos."
    );
  }

  const extensoes: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };

  const extensao = extensoes[arquivo.type];

  const caminho = [
    usuarioId,
    servicoId,
    `${crypto.randomUUID()}.${extensao}`,
  ].join("/");

  const { error: uploadError } =
    await supabase.storage
      .from(BUCKET)
      .upload(caminho, arquivo, {
        contentType: arquivo.type,
        upsert: false,
      });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const primeiraFoto = imagensAtuais.length === 0;

  const {
    data: imagem,
    error: registroError,
  } = await supabase
    .from("servico_imagens")
    .insert({
      servico_id: servicoId,
      caminho_storage: caminho,
      ordem,
      capa: primeiraFoto,
    })
    .select(
      "id, servico_id, caminho_storage, ordem, capa, criado_em"
    )
    .single();

  if (registroError) {
    // Evita deixar arquivo sem registro quando
    // a inserção no banco falhar.
    const { error: limpezaError } =
      await supabase.storage
        .from(BUCKET)
        .remove([caminho]);

    if (limpezaError) {
      console.error(
        "Erro ao limpar upload:",
        limpezaError
      );
    }

    throw new Error(registroError.message);
  }

  return adicionarUrl(imagem as RegistroImagem);
}

/* ==========================================
   REMOVER FOTO
========================================== */

export async function removerImagemServico(
  servicoId: string,
  imagemId: string
): Promise<void> {
  await verificarProprietario(servicoId);

  const { data: imagem, error: buscaError } =
    await supabase
      .from("servico_imagens")
      .select("id, caminho_storage, capa")
      .eq("id", imagemId)
      .eq("servico_id", servicoId)
      .single();

  if (buscaError || !imagem) {
    throw new Error("Imagem não encontrada.");
  }

  // Remove o registro do banco primeiro.
  const { error: exclusaoError } =
    await supabase
      .from("servico_imagens")
      .delete()
      .eq("id", imagemId)
      .eq("servico_id", servicoId);

  if (exclusaoError) {
    throw new Error(exclusaoError.message);
  }

  // Remove o arquivo do Storage.
  const { error: storageError } =
    await supabase.storage
      .from(BUCKET)
      .remove([imagem.caminho_storage]);

  if (storageError) {
    console.error(
      "Não foi possível remover o arquivo:",
      storageError
    );
  }

  // Se a foto removida era a capa, escolhe
  // automaticamente a primeira foto restante.
  if (imagem.capa) {
    const restantes = await listarImagensServico(
      servicoId
    );

    if (restantes.length > 0) {
      const { error: capaError } =
        await supabase
          .from("servico_imagens")
          .update({ capa: true })
          .eq("id", restantes[0].id);

      if (capaError) {
        throw new Error(capaError.message);
      }
    }
  }
}

/* ==========================================
   DEFINIR FOTO DE CAPA
========================================== */

export async function definirCapaServico(
  servicoId: string,
  imagemId: string
): Promise<void> {
  // Confirma a propriedade antes de solicitar
  // a alteração no banco.
  await verificarProprietario(servicoId);

  const { error } = await supabase.rpc(
    "definir_capa_servico",
    {
      p_servico_id: servicoId,
      p_imagem_id: imagemId,
    }
  );

  if (error) {
    throw new Error(error.message);
  }
}
