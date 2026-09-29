export interface CategoriaServico {
  id: string;
  nome: string;
  slug: string;
  icone?: string | null;
}

export interface ProfissionalServico {
  id: string;
  nome_empresa?: string | null;
  descricao?: string | null;
  instagram?: string | null;
  site?: string | null;
  verificado?: boolean;
}

export interface Servico {
  id: string;

  profissional_id: string;
  categoria_id: string;

  nome: string;
  descricao?: string | null;

  preco_inicial?: number | null;

  cidade?: string | null;
  estado?: string | null;

  ativo: boolean;

  categorias_servico?: CategoriaServico | null;
  profissionais?: ProfissionalServico | null;
}