import { supabase } from "@/services/supabase";

export interface CriarInteresse {
  servico_id: string;
  mensagem?: string;
}

export async function criarInteresse({
  servico_id,
  mensagem,
}: CriarInteresse) {
  // Usuário autenticado
  const {
    data: usuarioData,
    error: usuarioError,
  } = await supabase.auth.getUser();

  if (usuarioError) {
    throw new Error(usuarioError.message);
  }

  if (!usuarioData.user) {
    throw new Error("Você precisa estar autenticado.");
  }

  // Perfil do cliente
  const {
    data: cliente,
    error: clienteError,
  } = await supabase
    .from("clientes")
    .select("id")
    .eq("usuario_id", usuarioData.user.id)
    .maybeSingle();

  if (clienteError) {
    throw new Error(clienteError.message);
  }

  if (!cliente) {
    throw new Error("Perfil de cliente não encontrado.");
  }

  // Evita criar vários interesses iguais em sequência
  const {
    data: interesseExistente,
    error: verificacaoError,
  } = await supabase
    .from("interesses")
    .select("id, status")
    .eq("cliente_id", cliente.id)
    .eq("servico_id", servico_id)
    .in("status", ["pendente", "visualizado", "respondido"])
    .maybeSingle();

  if (verificacaoError) {
    throw new Error(verificacaoError.message);
  }

  if (interesseExistente) {
    throw new Error(
      "Você já demonstrou interesse neste serviço."
    );
  }

  const { data, error } = await supabase
    .from("interesses")
    .insert({
      cliente_id: cliente.id,
      servico_id,
      mensagem: mensagem?.trim() || null,
      status: "pendente",
    })
    .select("id, status")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export interface InteresseRecebido {
  id: string;
  cliente_id: string;
  servico_id: string;
  evento_id: string | null;

  mensagem: string | null;

  data_evento: string | null;
  quantidade_convidados: number | null;

  cidade: string | null;
  estado: string | null;

  status:
    | "pendente"
    | "visualizado"
    | "respondido"
    | "cancelado";

  criado_em: string;

  servicos?: {
    id: string;
    nome: string;
    preco_inicial: number | null;

    categorias_servico?: {
      id: string;
      nome: string;
      icone: string | null;
    } | null;
  } | null;
}

export async function listarInteressesRecebidos(): Promise<
  InteresseRecebido[]
> {
  const {
    data: usuarioData,
    error: usuarioError,
  } = await supabase.auth.getUser();

  if (usuarioError) {
    throw new Error(usuarioError.message);
  }

  if (!usuarioData.user) {
    throw new Error(
      "Você precisa estar autenticado."
    );
  }

  // Descobre qual profissional pertence ao usuário logado.
  const {
    data: profissional,
    error: profissionalError,
  } = await supabase
    .from("profissionais")
    .select("id")
    .eq("usuario_id", usuarioData.user.id)
    .maybeSingle();

  if (profissionalError) {
    throw new Error(
      profissionalError.message
    );
  }

  if (!profissional) {
    throw new Error(
      "Perfil profissional não encontrado."
    );
  }

  // Primeiro buscamos somente os serviços deste profissional.
  const {
    data: servicosProfissional,
    error: servicosError,
  } = await supabase
    .from("servicos")
    .select("id")
    .eq("profissional_id", profissional.id);

  if (servicosError) {
    throw new Error(servicosError.message);
  }

  const servicoIds =
    servicosProfissional?.map(
      (servico) => servico.id
    ) ?? [];

  if (servicoIds.length === 0) {
    return [];
  }

  // Depois buscamos os interesses desses serviços.
  const { data, error } = await supabase
    .from("interesses")
    .select(`
      id,
      cliente_id,
      servico_id,
      evento_id,
      mensagem,
      data_evento,
      quantidade_convidados,
      cidade,
      estado,
      status,
      criado_em,

      servicos (
        id,
        nome,
        preco_inicial,

        categorias_servico (
          id,
          nome,
          icone
        )
      )
    `)
    .in("servico_id", servicoIds)
    .order("criado_em", {
      ascending: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as unknown as InteresseRecebido[];
}

export async function marcarInteresseComoVisualizado(
  interesseId: string
) {
  const { data, error } = await supabase
    .from("interesses")
    .update({
      status: "visualizado",
    })
    .eq("id", interesseId)
    .eq("status", "pendente")
    .select("id, status")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function buscarInteresseRecebidoPorId(
  interesseId: string
): Promise<InteresseRecebido | null> {
  const {
    data: usuarioData,
    error: usuarioError,
  } = await supabase.auth.getUser();

  if (usuarioError) {
    throw new Error(usuarioError.message);
  }

  if (!usuarioData.user) {
    throw new Error(
      "Você precisa estar autenticado."
    );
  }

  const {
    data: profissional,
    error: profissionalError,
  } = await supabase
    .from("profissionais")
    .select("id")
    .eq("usuario_id", usuarioData.user.id)
    .maybeSingle();

  if (profissionalError) {
    throw new Error(profissionalError.message);
  }

  if (!profissional) {
    throw new Error(
      "Perfil profissional não encontrado."
    );
  }

  const {
    data: interesse,
    error,
  } = await supabase
    .from("interesses")
    .select(`
      id,
      cliente_id,
      servico_id,
      evento_id,
      mensagem,
      data_evento,
      quantidade_convidados,
      cidade,
      estado,
      status,
      criado_em,

      servicos!inner (
        id,
        nome,
        preco_inicial,
        profissional_id,

        categorias_servico (
          id,
          nome,
          icone
        )
      )
    `)
    .eq("id", interesseId)
    .eq(
      "servicos.profissional_id",
      profissional.id
    )
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return interesse as unknown as
    InteresseRecebido | null;
}