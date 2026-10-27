import { supabase } from "@/services/supabase";

export interface CriarOrcamentoInteresse {
  interesse_id: string;
  titulo?: string;
  descricao: string;
  valor: number;
  validade?: string | null;
}

export async function criarOrcamentoPorInteresse(
  dados: CriarOrcamentoInteresse
) {
  /*
   * 1. Usuário autenticado
   */
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

  /*
   * 2. Descobre o profissional
   */
  const {
    data: profissional,
    error: profissionalError,
  } = await supabase
    .from("profissionais")
    .select("id")
    .eq(
      "usuario_id",
      usuarioData.user.id
    )
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

  /*
   * 3. Busca o interesse
   */
  const {
    data: interesse,
    error: interesseError,
  } = await supabase
    .from("interesses")
    .select(`
      id,
      cliente_id,
      servico_id,
      evento_id,
      status,

      servicos!inner (
        profissional_id
      )
    `)
    .eq("id", dados.interesse_id)
    .eq(
      "servicos.profissional_id",
      profissional.id
    )
    .maybeSingle();

  if (interesseError) {
    throw new Error(
      interesseError.message
    );
  }

  if (!interesse) {
    throw new Error(
      "Interesse não encontrado."
    );
  }

  if (interesse.status === "cancelado") {
    throw new Error(
      "Este interesse foi cancelado."
    );
  }

  /*
   * 4. Evita dois orçamentos ativos
   * para o mesmo interesse.
   */
  const {
    data: existente,
    error: existenteError,
  } = await supabase
    .from("orcamentos")
    .select("id, status")
    .eq(
      "interesse_id",
      dados.interesse_id
    )
    .in("status", [
      "pendente",
      "aceito",
    ])
    .maybeSingle();

  if (existenteError) {
    throw new Error(
      existenteError.message
    );
  }

  if (existente) {
    throw new Error(
      "Já existe um orçamento ativo para este interesse."
    );
  }

  /*
   * 5. Cria o orçamento
   */
  const {
    data: orcamento,
    error: orcamentoError,
  } = await supabase
    .from("orcamentos")
    .insert({
      cliente_id:
        interesse.cliente_id,

      profissional_id:
        profissional.id,

      servico_id:
        interesse.servico_id,

      evento_id:
        interesse.evento_id,

      interesse_id:
        interesse.id,

      origem: "interesse",

      titulo:
        dados.titulo?.trim() ||
        "Proposta comercial",

      descricao:
        dados.descricao.trim(),

      valor: dados.valor,

      validade:
        dados.validade || null,

      status: "pendente",
    })
    .select(`
      id,
      interesse_id,
      valor,
      validade,
      status,
      criado_em
    `)
    .single();

  if (orcamentoError) {
    throw new Error(
      orcamentoError.message
    );
  }

  /*
   * 6. Interesse vira respondido
   */
  const {
    error: atualizacaoError,
  } = await supabase
    .from("interesses")
    .update({
      status: "respondido",
    })
    .eq("id", interesse.id);

  if (atualizacaoError) {
    console.error(
      "Orçamento criado, mas não foi possível atualizar o interesse:",
      atualizacaoError
    );
  }

  return orcamento;
}

export type StatusOrcamento =
  | "pendente"
  | "aceito"
  | "recusado"
  | "cancelado"
  | "expirado";


export interface OrcamentoCliente {

  origem: "interesse" | "evento";

  evento_id: string | null;

  eventos: {
    id: string;
    nome: string;
    tipo_evento: string | null;
    tema: string | null;
    data_evento: string | null;
    horario: string | null;
    cidade: string | null;
    estado: string | null;
  } | null;

  id: string;
  cliente_id: string;
  profissional_id: string;
  servico_id: string | null;

  interesse_id: string | null;

  titulo: string | null;
  descricao: string;
  valor: number;
  validade: string | null;

  status: StatusOrcamento;

  criado_em: string;
  atualizado_em: string;

  servicos?: {
    id: string;
    nome: string;

    categorias?: {
      id: string;
      nome: string;
      icone: string | null;
    } | null;
  } | null;

  profissionais?: {
    id: string;
    nome_empresa: string | null;
    verificado: boolean;
  } | null;
}

/* =========================================================
   LISTAR ORÇAMENTOS DO CLIENTE
========================================================= */

export async function listarOrcamentosCliente(): Promise<
  OrcamentoCliente[]
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

  const {
    data: cliente,
    error: clienteError,
  } = await supabase
    .from("clientes")
    .select("id")
    .eq(
      "usuario_id",
      usuarioData.user.id
    )
    .maybeSingle();

  if (clienteError) {
    throw new Error(clienteError.message);
  }

  if (!cliente) {
    throw new Error(
      "Perfil de cliente não encontrado."
    );
  }

  const { data, error } = await supabase
    .from("orcamentos")
    .select(`
      id,
      cliente_id,
      profissional_id,
      servico_id,
      evento_id,
      interesse_id,
      origem,
      titulo,
      descricao,
      valor,
      validade,
      status,
      criado_em,
      atualizado_em,

      servicos (
        id,
        nome,

        categorias (
          id,
          nome,
          icone
        )
      ),

      profissionais (
        id,
        nome_empresa,
        verificado
      )
    `)
    .eq("cliente_id", cliente.id)
    .order("criado_em", {
      ascending: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as unknown as OrcamentoCliente[];
}

/* =========================================================
   BUSCAR ORÇAMENTO ESPECÍFICO
========================================================= */

export async function buscarOrcamentoClientePorId(
  orcamentoId: string
): Promise<OrcamentoCliente | null> {
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
    data: cliente,
    error: clienteError,
  } = await supabase
    .from("clientes")
    .select("id")
    .eq(
      "usuario_id",
      usuarioData.user.id
    )
    .maybeSingle();

  if (clienteError) {
    throw new Error(clienteError.message);
  }

  if (!cliente) {
    throw new Error(
      "Perfil de cliente não encontrado."
    );
  }

  const { data, error } = await supabase
    .from("orcamentos")
    .select(`
      id,
      cliente_id,
      profissional_id,
      servico_id,
      evento_id,
      interesse_id,
      origem,
      titulo,
      descricao,
      valor,
      validade,
      status,
      criado_em,
      atualizado_em,

      servicos (
        id,
        nome,

        categorias (
          id,
          nome,
          icone
        )
      ),

      profissionais (
        id,
        nome_empresa,
        descricao,
        instagram,
        site,
        verificado
      )
    `)
    .eq("id", orcamentoId)
    .eq("cliente_id", cliente.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as unknown as OrcamentoCliente | null;
}

/* =========================================================
   ACEITAR ORÇAMENTO
========================================================= */

export async function aceitarOrcamento(
  orcamentoId: string
) {
  const { data, error } = await supabase
    .from("orcamentos")
    .update({
      status: "aceito",
    })
    .eq("id", orcamentoId)
    .eq("status", "pendente")
    .select("id, status")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error(
      "Este orçamento não está mais disponível para aceitação."
    );
  }

  return data;
}

/* =========================================================
   RECUSAR ORÇAMENTO
========================================================= */

export async function recusarOrcamento(
  orcamentoId: string
) {
  const { data, error } = await supabase
    .from("orcamentos")
    .update({
      status: "recusado",
    })
    .eq("id", orcamentoId)
    .eq("status", "pendente")
    .select("id, status")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error(
      "Este orçamento não está mais disponível para recusa."
    );
  }

  return data;
}

export interface OrcamentoProfissional {
  id: string;
  cliente_id: string;
  profissional_id: string;
  servico_id: string | null;
  evento_id: string | null;
  interesse_id: string | null;

  origem: "interesse" | "evento";

  titulo: string | null;
  descricao: string;
  valor: number;
  validade: string | null;

  status:
  | "pendente"
  | "aceito"
  | "recusado"
  | "cancelado"
  | "expirado";

  criado_em: string;
  atualizado_em: string;

  servicos?: {
    id: string;
    nome: string;

    categorias?: {
      id: string;
      nome: string;
      icone: string | null;
    } | null;
  } | null;
}

/* =========================================================
   LISTAR ORÇAMENTOS DO PROFISSIONAL
========================================================= */

export async function listarOrcamentosProfissional(): Promise<
  OrcamentoProfissional[]
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

  const {
    data: profissional,
    error: profissionalError,
  } = await supabase
    .from("profissionais")
    .select("id")
    .eq(
      "usuario_id",
      usuarioData.user.id
    )
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

  const { data, error } = await supabase
    .from("orcamentos")
    .select(`
  *,
  profissionais (
    id,
    nome_empresa
  ),
  servicos (
    id,
    nome,
    categorias (
      id,
      nome,
      icone
    )
  ),
  eventos (
    id,
    nome,
    tipo_evento,
    tema,
    data_evento,
    cidade,
    estado
  )
`)
    .eq(
      "profissional_id",
      profissional.id
    )
    .order("criado_em", {
      ascending: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as unknown as
    OrcamentoProfissional[];
}

/* =========================================================
   ORÇAMENTOS DE EVENTOS DO CLIENTE
========================================================= */

export async function listarOrcamentosEventosCliente() {
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

  /* CLIENTE LOGADO */

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

  /* ORÇAMENTOS */

  const {
    data,
    error,
  } = await supabase
    .from("orcamentos")
    .select(`
      *,
      evento:eventos (
        id,
        nome,
        tipo_evento,
        data_evento,
        cidade,
        estado
      ),
      profissional:profissionais (
        id,
        nome_empresa
      )
    `)
    .eq("cliente_id", cliente.id)
    .eq("origem", "evento")
    .order("criado_em", {
      ascending: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}


/* =========================================================
   BUSCAR ORÇAMENTO DE EVENTO
========================================================= */

export async function buscarOrcamentoEventoCliente(
  orcamentoId: string
) {
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

  const {
    data,
    error,
  } = await supabase
    .from("orcamentos")
    .select(`
      *,
      evento:eventos (
        id,
        nome,
        tipo_evento,
        tema,
        data_evento,
        horario,
        cidade,
        estado
      ),
      profissional:profissionais (
        id,
        nome_empresa,
        descricao,
        instagram,
        site,
        verificado
      )
    `)
    .eq("id", orcamentoId)
    .eq("cliente_id", cliente.id)
    .eq("origem", "evento")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}


/* =========================================================
   ACEITAR ORÇAMENTO
========================================================= */

export async function aceitarOrcamentoEvento(
  orcamentoId: string
) {
  /* =======================================================
     USUÁRIO LOGADO
  ======================================================= */

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

  /* =======================================================
     CLIENTE
  ======================================================= */

  const {
    data: cliente,
    error: clienteError,
  } = await supabase
    .from("clientes")
    .select("id")
    .eq(
      "usuario_id",
      usuarioData.user.id
    )
    .maybeSingle();

  if (clienteError) {
    throw new Error(
      clienteError.message
    );
  }

  if (!cliente) {
    throw new Error(
      "Perfil de cliente não encontrado."
    );
  }

  /* =======================================================
     BUSCAR PROPOSTA
  ======================================================= */

  const {
    data: orcamento,
    error: buscarError,
  } = await supabase
    .from("orcamentos")
    .select(`
      id,
      evento_id,
      cliente_id,
      profissional_id,
      status,
      origem
    `)
    .eq("id", orcamentoId)
    .eq("cliente_id", cliente.id)
    .eq("origem", "evento")
    .maybeSingle();

  if (buscarError) {
    throw new Error(
      buscarError.message
    );
  }

  if (!orcamento) {
    throw new Error(
      "Proposta não encontrada."
    );
  }

  if (!orcamento.evento_id) {
    throw new Error(
      "Esta proposta não possui um evento associado."
    );
  }

  if (
    orcamento.status !== "pendente"
  ) {
    throw new Error(
      "Esta proposta já foi respondida."
    );
  }

  /* =======================================================
     VERIFICAR EVENTO
  ======================================================= */

  const {
    data: evento,
    error: eventoError,
  } = await supabase
    .from("eventos")
    .select(`
      id,
      cliente_id,
      status
    `)
    .eq(
      "id",
      orcamento.evento_id
    )
    .eq(
      "cliente_id",
      cliente.id
    )
    .maybeSingle();

  if (eventoError) {
    throw new Error(
      eventoError.message
    );
  }

  if (!evento) {
    throw new Error(
      "Evento não encontrado."
    );
  }

  /* =======================================================
     ACEITAR PROPOSTA ESCOLHIDA
  ======================================================= */

  const agora =
    new Date().toISOString();

  const {
    data: propostaAceita,
    error: aceitarError,
  } = await supabase
    .from("orcamentos")
    .update({
      status: "aceito",
      atualizado_em: agora,
    })
    .eq("id", orcamento.id)
    .eq("cliente_id", cliente.id)
    .eq("status", "pendente")
    .select("*")
    .single();

  if (aceitarError) {
    throw new Error(
      aceitarError.message
    );
  }

  /* =======================================================
     RECUSAR OUTRAS PROPOSTAS DO EVENTO
  ======================================================= */

  const {
    error: outrasError,
  } = await supabase
    .from("orcamentos")
    .update({
      status: "recusado",
      atualizado_em: agora,
    })
    .eq(
      "evento_id",
      orcamento.evento_id
    )
    .eq(
      "cliente_id",
      cliente.id
    )
    .eq(
      "origem",
      "evento"
    )
    .eq(
      "status",
      "pendente"
    )
    .neq(
      "id",
      orcamento.id
    );

  if (outrasError) {
    throw new Error(
      `A proposta foi aceita, mas não foi possível atualizar as demais propostas: ${outrasError.message}`
    );
  }

  /* =======================================================
     CONFIRMAR EVENTO
  ======================================================= */

  const {
    error: confirmarEventoError,
  } = await supabase
    .from("eventos")
    .update({
      status: "confirmado",

      visivel_profissionais:
        false,

      atualizado_em: agora,
    })
    .eq(
      "id",
      orcamento.evento_id
    )
    .eq(
      "cliente_id",
      cliente.id
    );

  if (confirmarEventoError) {
    throw new Error(
      `A proposta foi aceita, mas não foi possível confirmar o evento: ${confirmarEventoError.message}`
    );
  }

  return propostaAceita;
}

/* =========================================================
   RECUSAR ORÇAMENTO
========================================================= */

export async function recusarOrcamentoEvento(
  orcamentoId: string
) {
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

  const {
    data,
    error,
  } = await supabase
    .from("orcamentos")
    .update({
      status: "recusado",
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", orcamentoId)
    .eq("cliente_id", cliente.id)
    .eq("origem", "evento")
    .eq("status", "pendente")
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}