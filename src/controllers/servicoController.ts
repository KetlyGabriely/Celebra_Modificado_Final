import { supabase } from "@/services/supabase";
import type { Servico } from "@/models/Servico";

export interface FiltrosServico {
  categoria?: string;
  busca?: string;
}

/* =========================================================
   LISTAR SERVIÇOS DO MARKETPLACE
========================================================= */

export async function listarServicos(
  filtros: FiltrosServico = {}
): Promise<Servico[]> {
  let query = supabase
    .from("servicos")
    .select(`
      id,
      profissional_id,
      categoria_id,
      nome,
      descricao,
      preco_inicial,
      cidade,
      estado,
      ativo,

      categorias (
        id,
        nome,
        slug,
        icone
      ),

      profissionais (
        id,
        nome_empresa,
        verificado
      )
    `)
    .eq("ativo", true);

  /* =======================================================
     FILTRO POR CATEGORIA
  ======================================================= */

  if (filtros.categoria) {
    const {
      data: categoria,
      error: categoriaError,
    } = await supabase
      .from("categorias")
      .select("id")
      .eq(
        "slug",
        filtros.categoria
      )
      .eq("ativo", true)
      .maybeSingle();

    if (categoriaError) {
      throw new Error(
        categoriaError.message
      );
    }

    if (!categoria) {
      return [];
    }

    query = query.eq(
      "categoria_id",
      categoria.id
    );
  }

  /* =======================================================
     BUSCA
  ======================================================= */

  if (filtros.busca?.trim()) {
    const busca =
      filtros.busca.trim();

    query = query.or(
      `nome.ilike.%${busca}%,descricao.ilike.%${busca}%,cidade.ilike.%${busca}%`
    );
  }

  const {
    data,
    error,
  } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as unknown as
    Servico[];
}

/* =========================================================
   LISTAR CATEGORIAS
========================================================= */

export async function listarCategorias() {
  const {
    data,
    error,
  } = await supabase
    .from("categorias")
    .select(`
      id,
      nome,
      slug,
      descricao,
      icone
    `)
    .eq("ativo", true)
    .order("nome", {
      ascending: true,
    });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

/* =========================================================
   LISTAR SERVIÇOS DO PROFISSIONAL LOGADO
========================================================= */

export async function listarMeusServicos(): Promise<
  Servico[]
> {
  /* =======================================================
     1. USUÁRIO LOGADO
  ======================================================= */

  const {
    data: usuarioData,
    error: usuarioError,
  } = await supabase.auth.getUser();

  if (usuarioError) {
    throw new Error(
      usuarioError.message
    );
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
     3. SERVIÇOS
  ======================================================= */

  const {
    data,
    error,
  } = await supabase
    .from("servicos")
    .select(`
      id,
      profissional_id,
      categoria_id,
      nome,
      descricao,
      preco_inicial,
      cidade,
      estado,
      ativo,

      categorias (
        id,
        nome,
        slug,
        icone
      )
    `)
    .eq(
      "profissional_id",
      profissional.id
    )
    .order("nome", {
      ascending: true,
    });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as unknown as
    Servico[];
}

/* =========================================================
   CADASTRO DE SERVIÇO
========================================================= */

export interface CadastroServico {
  categoria_id: string;
  nome: string;
  descricao?: string;
  preco_inicial?: number | null;
  cidade?: string;
  estado?: string;
}

export async function cadastrarServico(
  dados: CadastroServico
): Promise<Servico> {
  /* =======================================================
     1. USUÁRIO LOGADO
  ======================================================= */

  const {
    data: usuarioData,
    error: usuarioError,
  } = await supabase.auth.getUser();

  if (usuarioError) {
    throw new Error(
      usuarioError.message
    );
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
     3. CONFIRMAR CATEGORIA
  ======================================================= */

  const {
    data: categoria,
    error: categoriaError,
  } = await supabase
    .from("categorias")
    .select("id")
    .eq(
      "id",
      dados.categoria_id
    )
    .eq("ativo", true)
    .maybeSingle();

  if (categoriaError) {
    throw new Error(
      categoriaError.message
    );
  }

  if (!categoria) {
    throw new Error(
      "Categoria inválida ou indisponível."
    );
  }

  /* =======================================================
     4. CADASTRAR
  ======================================================= */

  const {
    data: servico,
    error: servicoError,
  } = await supabase
    .from("servicos")
    .insert({
      profissional_id:
        profissional.id,

      categoria_id:
        categoria.id,

      nome:
        dados.nome.trim(),

      descricao:
        dados.descricao?.trim() ||
        null,

      preco_inicial:
        dados.preco_inicial != null
          ? dados.preco_inicial
          : null,

      cidade:
        dados.cidade?.trim() ||
        null,

      estado:
        dados.estado
          ?.trim()
          .toUpperCase() ||
        null,

      ativo: true,
    })
    .select(`
      id,
      profissional_id,
      categoria_id,
      nome,
      descricao,
      preco_inicial,
      cidade,
      estado,
      ativo,

      categorias (
        id,
        nome,
        slug,
        icone
      )
    `)
    .single();

  if (servicoError) {
    throw new Error(
      servicoError.message
    );
  }

  return servico as unknown as
    Servico;
}

/* =========================================================
   BUSCAR SERVIÇO PELO ID
========================================================= */

export async function buscarServicoPorId(
  id: string
): Promise<Servico | null> {
  const {
    data,
    error,
  } = await supabase
    .from("servicos")
    .select(`
      id,
      profissional_id,
      categoria_id,
      nome,
      descricao,
      preco_inicial,
      cidade,
      estado,
      ativo,

      categorias (
        id,
        nome,
        slug,
        icone
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
    .eq("id", id)
    .eq("ativo", true)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as unknown as
    Servico | null;
}