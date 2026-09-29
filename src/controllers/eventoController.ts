import { supabase } from "@/services/supabase";

import type {
  CriarEvento,
  Evento,
} from "@/models/Evento";

/* =========================================================
   DESCOBRIR CLIENTE LOGADO
========================================================= */

async function buscarClienteLogado() {
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

  return cliente;
}

/* =========================================================
   LISTAR EVENTOS DO CLIENTE
========================================================= */

export async function listarEventosCliente(): Promise<
  Evento[]
> {
  const cliente =
    await buscarClienteLogado();

  const { data, error } = await supabase
    .from("eventos")
    .select("*")
    .eq("cliente_id", cliente.id)
    .order("criado_em", {
      ascending: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Evento[];
}

/* =========================================================
   CRIAR EVENTO
========================================================= */

export async function criarEvento(
  dados: CriarEvento
): Promise<Evento> {
  const cliente =
    await buscarClienteLogado();

  if (!dados.nome.trim()) {
    throw new Error(
      "Informe o nome do evento."
    );
  }

  if (
    dados.quantidade_convidados != null &&
    dados.quantidade_convidados < 0
  ) {
    throw new Error(
      "A quantidade de convidados é inválida."
    );
  }

  if (
    dados.orcamento_total != null &&
    dados.orcamento_total < 0
  ) {
    throw new Error(
      "O orçamento informado é inválido."
    );
  }

  const { data, error } = await supabase
    .from("eventos")
    .insert({
      cliente_id: cliente.id,

      nome: dados.nome.trim(),

      tipo_evento:
        dados.tipo_evento?.trim() ||
        null,

      tema:
        dados.tema?.trim() ||
        null,

      descricao:
        dados.descricao?.trim() ||
        null,

      data_evento:
        dados.data_evento ||
        null,

      horario:
        dados.horario ||
        null,

      cidade:
        dados.cidade?.trim() ||
        null,

      estado:
        dados.estado?.trim() ||
        null,

      endereco:
        dados.endereco?.trim() ||
        null,

      quantidade_convidados:
        dados.quantidade_convidados ??
        null,

      orcamento_total:
        dados.orcamento_total ??
        null,

      status:
        dados.status ||
        "rascunho",

      visivel_profissionais:
        dados.visivel_profissionais ??
        false,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Evento;
}

/* =========================================================
   BUSCAR EVENTO DO CLIENTE POR ID
========================================================= */

export async function buscarEventoClientePorId(
  eventoId: string
): Promise<Evento | null> {
  const cliente = await buscarClienteLogado();

  const { data, error } = await supabase
    .from("eventos")
    .select("*")
    .eq("id", eventoId)
    .eq("cliente_id", cliente.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as Evento | null;
}

/* =========================================================
   ALTERAR VISIBILIDADE DO EVENTO
========================================================= */

export async function alterarVisibilidadeEvento(
  eventoId: string,
  visivel: boolean
): Promise<Evento> {
  const cliente = await buscarClienteLogado();

  const { data, error } = await supabase
    .from("eventos")
    .update({
      visivel_profissionais: visivel,

      // Ao disponibilizar o evento aos profissionais,
      // ele também passa para publicado.
      ...(visivel
        ? { status: "publicado" }
        : {}),
    })
    .eq("id", eventoId)
    .eq("cliente_id", cliente.id)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Evento;
}

/* =========================================================
   CANCELAR EVENTO
========================================================= */

export async function cancelarEvento(
  eventoId: string
): Promise<Evento> {
  const cliente = await buscarClienteLogado();

  const { data, error } = await supabase
    .from("eventos")
    .update({
      status: "cancelado",
      visivel_profissionais: false,
    })
    .eq("id", eventoId)
    .eq("cliente_id", cliente.id)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Evento;
}

/* =========================================================
   ATUALIZAR EVENTO
========================================================= */

export async function atualizarEvento(
  eventoId: string,
  dados: CriarEvento
): Promise<Evento> {
  const cliente = await buscarClienteLogado();

  if (!dados.nome.trim()) {
    throw new Error("Informe o nome do evento.");
  }

  if (
    dados.quantidade_convidados != null &&
    dados.quantidade_convidados < 0
  ) {
    throw new Error(
      "A quantidade de convidados é inválida."
    );
  }

  if (
    dados.orcamento_total != null &&
    dados.orcamento_total < 0
  ) {
    throw new Error(
      "O orçamento informado é inválido."
    );
  }

  const { data, error } = await supabase
    .from("eventos")
    .update({
      nome: dados.nome.trim(),

      tipo_evento:
        dados.tipo_evento?.trim() || null,

      tema:
        dados.tema?.trim() || null,

      descricao:
        dados.descricao?.trim() || null,

      data_evento:
        dados.data_evento || null,

      horario:
        dados.horario || null,

      cidade:
        dados.cidade?.trim() || null,

      estado:
        dados.estado?.trim().toUpperCase() || null,

      endereco:
        dados.endereco?.trim() || null,

      quantidade_convidados:
        dados.quantidade_convidados ?? null,

      orcamento_total:
        dados.orcamento_total ?? null,

      visivel_profissionais:
        dados.visivel_profissionais ?? false,

      atualizado_em:
        new Date().toISOString(),
    })
    .eq("id", eventoId)
    .eq("cliente_id", cliente.id)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Evento;
}

/* =========================================================
   CATEGORIAS EM QUE O PROFISSIONAL ATUA
========================================================= */

async function buscarCategoriasProfissional(): Promise<string[]> {
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

  const {
    data: servicos,
    error: servicosError,
  } = await supabase
    .from("servicos")
    .select("categoria_id")
    .eq(
      "profissional_id",
      profissional.id
    );

  if (servicosError) {
    throw new Error(
      servicosError.message
    );
  }

  return [
    ...new Set(
      (servicos ?? [])
        .map(
          (servico) =>
            servico.categoria_id
        )
        .filter(
          (categoriaId): categoriaId is string =>
            Boolean(categoriaId)
        )
    ),
  ];
}

/* =========================================================
   LISTAR EVENTOS DISPONÍVEIS PARA PROFISSIONAIS
========================================================= */

export async function listarEventosPublicos(): Promise<
  Evento[]
> {
  const categoriasProfissional =
    await buscarCategoriasProfissional();

  /*
   * Se o profissional ainda não cadastrou nenhum
   * serviço, ele não possui categoria de atuação.
   */
  if (
    categoriasProfissional.length === 0
  ) {
    return [];
  }

  /*
   * Descobre quais eventos estão procurando
   * alguma categoria atendida pelo profissional.
   */
  const {
    data: oportunidades,
    error: oportunidadesError,
  } = await supabase
    .from("evento_servicos")
    .select("evento_id")
    .in(
      "categoria_id",
      categoriasProfissional
    )
    .eq("status", "procurando");

  if (oportunidadesError) {
    throw new Error(
      oportunidadesError.message
    );
  }

  const eventoIds = [
    ...new Set(
      (oportunidades ?? [])
        .map(
          (oportunidade) =>
            oportunidade.evento_id
        )
        .filter(
          (eventoId): eventoId is string =>
            Boolean(eventoId)
        )
    ),
  ];

  /*
   * Nenhum evento possui uma categoria
   * compatível.
   */
  if (eventoIds.length === 0) {
    return [];
  }

  const {
    data,
    error,
  } = await supabase
    .from("eventos")
    .select("*")
    .in("id", eventoIds)
    .eq(
      "visivel_profissionais",
      true
    )
    .eq("status", "publicado")
    .order("data_evento", {
      ascending: true,
      nullsFirst: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Evento[];
}

/* =========================================================
   BUSCAR EVENTO PÚBLICO POR ID
========================================================= */

export async function buscarEventoPublicoPorId(
  eventoId: string
): Promise<Evento | null> {
  const categoriasProfissional =
    await buscarCategoriasProfissional();

  if (
    categoriasProfissional.length === 0
  ) {
    return null;
  }

  /*
   * Verifica se existe pelo menos uma
   * oportunidade compatível nesse evento.
   */
  const {
    data: oportunidade,
    error: oportunidadeError,
  } = await supabase
    .from("evento_servicos")
    .select("id")
    .eq("evento_id", eventoId)
    .in(
      "categoria_id",
      categoriasProfissional
    )
    .eq("status", "procurando")
    .limit(1)
    .maybeSingle();

  if (oportunidadeError) {
    throw new Error(
      oportunidadeError.message
    );
  }

  if (!oportunidade) {
    return null;
  }

  const {
    data,
    error,
  } = await supabase
    .from("eventos")
    .select("*")
    .eq("id", eventoId)
    .eq(
      "visivel_profissionais",
      true
    )
    .eq("status", "publicado")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as Evento | null;
}

/* =========================================================
   ENVIAR PROPOSTA PARA EVENTO
========================================================= */

export type CriarPropostaEvento = {
  evento_id: string;
  titulo: string;
  descricao: string;
  valor: number;
  validade?: string | null;
};

export interface NovaPropostaEvento {
  evento_id: string;
  evento_servico_id: string;
  titulo: string;
  descricao: string;
  valor: number;
  validade?: string | null;
}

export async function enviarPropostaEvento(
  dados: NovaPropostaEvento
) {
  /* =======================================================
     1. USUÁRIO
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
     2. PROFISSIONAL
  ======================================================= */

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

  /* =======================================================
     3. EVENTO
  ======================================================= */

  const {
    data: evento,
    error: eventoError,
  } = await supabase
    .from("eventos")
    .select(`
      id,
      cliente_id,
      status,
      visivel_profissionais
    `)
    .eq("id", dados.evento_id)
    .eq(
      "visivel_profissionais",
      true
    )
    .eq("status", "publicado")
    .maybeSingle();

  if (eventoError) {
    throw new Error(
      eventoError.message
    );
  }

  if (!evento) {
    throw new Error(
      "Este evento não está mais disponível."
    );
  }

  /* =======================================================
     4. SERVIÇO/CATEGORIA PROCURADA NO EVENTO
  ======================================================= */

  const {
    data: eventoServico,
    error: eventoServicoError,
  } = await supabase
    .from("evento_servicos")
    .select(`
      id,
      evento_id,
      categoria_id,
      status
    `)
    .eq(
      "id",
      dados.evento_servico_id
    )
    .eq(
      "evento_id",
      dados.evento_id
    )
    .eq("status", "procurando")
    .maybeSingle();

  if (eventoServicoError) {
    throw new Error(
      eventoServicoError.message
    );
  }

  if (!eventoServico) {
    throw new Error(
      "Este serviço não está mais recebendo propostas."
    );
  }

  /* =======================================================
     5. CONFIRMAR QUE O PROFISSIONAL ATUA NESSA CATEGORIA
  ======================================================= */

  const {
    data: servicoProfissional,
    error: servicoError,
  } = await supabase
    .from("servicos")
    .select(`
      id,
      categoria_id
    `)
    .eq(
      "profissional_id",
      profissional.id
    )
    .eq(
      "categoria_id",
      eventoServico.categoria_id
    )
    .eq("ativo", true)
    .limit(1)
    .maybeSingle();

  if (servicoError) {
    throw new Error(
      servicoError.message
    );
  }

  if (!servicoProfissional) {
    throw new Error(
      "Você não possui um serviço ativo nesta categoria."
    );
  }

  /* =======================================================
     6. EVITAR DUAS PROPOSTAS DO MESMO PROFISSIONAL
        PARA A MESMA CATEGORIA DO EVENTO
  ======================================================= */

  const {
    data: existente,
    error: existenteError,
  } = await supabase
    .from("orcamentos")
    .select("id")
    .eq(
      "profissional_id",
      profissional.id
    )
    .eq(
      "evento_servico_id",
      eventoServico.id
    )
    .neq("status", "cancelado")
    .limit(1)
    .maybeSingle();

  if (existenteError) {
    throw new Error(
      existenteError.message
    );
  }

  if (existente) {
    throw new Error(
      "Você já enviou uma proposta para este serviço."
    );
  }

  /* =======================================================
     7. CRIAR ORÇAMENTO
  ======================================================= */

  const {
    data,
    error,
  } = await supabase
    .from("orcamentos")
    .insert({
      cliente_id:
        evento.cliente_id,

      profissional_id:
        profissional.id,

      servico_id:
        servicoProfissional.id,

      evento_id:
        evento.id,

      evento_servico_id:
        eventoServico.id,

      interesse_id: null,

      origem: "evento",

      titulo:
        dados.titulo.trim(),

      descricao:
        dados.descricao.trim(),

      valor:
        dados.valor,

      validade:
        dados.validade || null,

      status: "pendente",
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/* =========================================================
   CATEGORIAS PARA O EVENTO
========================================================= */

export type CategoriaEvento = {
  id: string;
  nome: string;
  icone: string | null;
};

export async function listarCategoriasEvento(): Promise<
  CategoriaEvento[]
> {
  const {
    data,
    error,
  } = await supabase
    .from("categorias")
    .select(`
      id,
      nome,
      icone
    `)
    .order("nome", {
      ascending: true,
    });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}


/* =========================================================
   SERVIÇOS ESCOLHIDOS PARA UM EVENTO
========================================================= */

export type NovoEventoServico = {
  categoria_id: string;
  orcamento_planejado: number | null;
  observacoes?: string | null;
};

export async function criarServicosEvento(
  eventoId: string,
  servicos: NovoEventoServico[]
) {
  if (servicos.length === 0) {
    return [];
  }

  const registros = servicos.map(
    (servico) => ({
      evento_id: eventoId,

      categoria_id:
        servico.categoria_id,

      orcamento_planejado:
        servico.orcamento_planejado,

      observacoes:
        servico.observacoes || null,

      status: "procurando",
    })
  );

  const {
    data,
    error,
  } = await supabase
    .from("evento_servicos")
    .insert(registros)
    .select("*");

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

/* =========================================================
   SERVIÇOS PROCURADOS EM UM EVENTO
========================================================= */

export type EventoServicoPublico = {
  id: string;
  evento_id: string;
  categoria_id: string;
  orcamento_planejado: number | null;
  observacoes: string | null;
  status:
    | "procurando"
    | "contratado"
    | "cancelado";

  categorias: {
    id: string;
    nome: string;
    icone: string | null;
  } | null;
};

export async function listarServicosEventoPublico(
  eventoId: string
): Promise<EventoServicoPublico[]> {
  const categoriasProfissional =
    await buscarCategoriasProfissional();

  if (
    categoriasProfissional.length === 0
  ) {
    return [];
  }

  const {
    data,
    error,
  } = await supabase
    .from("evento_servicos")
    .select(`
      id,
      evento_id,
      categoria_id,
      orcamento_planejado,
      observacoes,
      status,

      categorias (
        id,
        nome,
        icone
      )
    `)
    .eq("evento_id", eventoId)
    .in(
      "categoria_id",
      categoriasProfissional
    )
    .eq("status", "procurando")
    .order("criado_em", {
      ascending: true,
    });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as unknown as
    EventoServicoPublico[];
}