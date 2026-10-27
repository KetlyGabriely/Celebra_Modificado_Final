
import { supabase } from "@/services/supabase";

// ============================================
// TIPOS
// ============================================

export interface Avaliacao {
  id: string;
  orcamento_id: string;
  cliente_id: string;
  profissional_id: string;
  servico_id: string | null;
  nota: number;
  comentario: string;
  resposta_profissional: string | null;
  respondido_em: string | null;
  criado_em: string;
  atualizado_em: string;
}

export interface ResumoAvaliacoes {
  media: number;
  total: number;
  distribuicao: Record<number, number>;
}

export interface CriarAvaliacao {
  orcamento_id: string;
  nota: number;
  comentario: string;
}

// ============================================
// LISTAR AVALIAÇÕES DO PROFISSIONAL
// ============================================

export async function listarAvaliacoesProfissional(
  profissionalId: string
): Promise<Avaliacao[]> {
  const { data, error } = await supabase
    .from("avaliacoes")
    .select("*")
    .eq("profissional_id", profissionalId)
    .order("criado_em", {
      ascending: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Avaliacao[];
}

// ============================================
// LISTAR AVALIAÇÕES DO SERVIÇO
// ============================================

export async function listarAvaliacoesServico(
  servicoId: string
): Promise<Avaliacao[]> {
  const { data, error } = await supabase
    .from("avaliacoes")
    .select("*")
    .eq("servico_id", servicoId)
    .order("criado_em", {
      ascending: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Avaliacao[];
}

// ============================================
// BUSCAR AVALIAÇÃO DE UM ORÇAMENTO
// ============================================

export async function buscarAvaliacaoOrcamento(
  orcamentoId: string
): Promise<Avaliacao | null> {
  const { data, error } = await supabase
    .from("avaliacoes")
    .select("*")
    .eq("orcamento_id", orcamentoId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as Avaliacao | null;
}

// ============================================
// VERIFICAR SE PODE AVALIAR
// ============================================

export async function podeAvaliarOrcamento(
  orcamentoId: string
): Promise<boolean> {
  const { data: usuarioData, error: usuarioError } =
    await supabase.auth.getUser();

  if (usuarioError) {
    throw new Error(usuarioError.message);
  }

  if (!usuarioData.user) {
    return false;
  }

  const { data: cliente, error: clienteError } =
    await supabase
      .from("clientes")
      .select("id")
      .eq("usuario_id", usuarioData.user.id)
      .maybeSingle();

  if (clienteError) {
    throw new Error(clienteError.message);
  }

  if (!cliente) {
    return false;
  }

  const { data: orcamento, error: orcamentoError } =
    await supabase
      .from("orcamentos")
      .select("id, status")
      .eq("id", orcamentoId)
      .eq("cliente_id", cliente.id)
      .maybeSingle();

  if (orcamentoError) {
    throw new Error(orcamentoError.message);
  }

  if (!orcamento || orcamento.status !== "aceito") {
    return false;
  }

  const { data: conclusao, error: conclusaoError } =
    await supabase
      .from("conclusoes_servico")
      .select(
        "profissional_concluiu_em, cliente_confirmou_em"
      )
      .eq("orcamento_id", orcamentoId)
      .maybeSingle();

  if (conclusaoError) {
    throw new Error(conclusaoError.message);
  }

  if (
    !conclusao?.profissional_concluiu_em ||
    !conclusao?.cliente_confirmou_em
  ) {
    return false;
  }

  const avaliacao = await buscarAvaliacaoOrcamento(
    orcamentoId
  );

  return avaliacao === null;
}

// ============================================
// PUBLICAR AVALIAÇÃO
// ============================================

export async function publicarAvaliacao(
  dados: CriarAvaliacao
): Promise<string> {
  if (
    !Number.isInteger(dados.nota) ||
    dados.nota < 1 ||
    dados.nota > 5
  ) {
    throw new Error(
      "A nota deve ser de 1 a 5 estrelas."
    );
  }

  const comentario = dados.comentario.trim();

  if (
    comentario.length < 10 ||
    comentario.length > 2000
  ) {
    throw new Error(
      "O comentário deve ter entre 10 e 2000 caracteres."
    );
  }

  const { data, error } = await supabase.rpc(
    "publicar_avaliacao",
    {
      p_orcamento_id: dados.orcamento_id,
      p_nota: dados.nota,
      p_comentario: comentario,
    }
  );

  if (error) {
    throw new Error(error.message);
  }

  return data as string;
}

// ============================================
// RESPONDER AVALIAÇÃO
// ============================================

export async function responderAvaliacao(
  avaliacaoId: string,
  resposta: string
): Promise<void> {
  const texto = resposta.trim();

  if (texto.length < 1 || texto.length > 2000) {
    throw new Error(
      "A resposta deve ter entre 1 e 2000 caracteres."
    );
  }

  const { error } = await supabase.rpc(
    "responder_avaliacao",
    {
      p_avaliacao_id: avaliacaoId,
      p_resposta: texto,
    }
  );

  if (error) {
    throw new Error(error.message);
  }
}

// ============================================
// CALCULAR MÉDIA E DISTRIBUIÇÃO
// ============================================

export function calcularResumoAvaliacoes(
  avaliacoes: Avaliacao[]
): ResumoAvaliacoes {
  const distribuicao: Record<number, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };

  if (avaliacoes.length === 0) {
    return {
      media: 0,
      total: 0,
      distribuicao,
    };
  }

  let soma = 0;

  for (const avaliacao of avaliacoes) {
    soma += avaliacao.nota;

    if (distribuicao[avaliacao.nota] !== undefined) {
      distribuicao[avaliacao.nota]++;
    }
  }

  return {
    media: Number(
      (soma / avaliacoes.length).toFixed(1)
    ),
    total: avaliacoes.length,
    distribuicao,
  };
}
