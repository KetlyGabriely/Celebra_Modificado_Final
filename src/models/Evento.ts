export type StatusEvento =
  | "rascunho"
  | "publicado"
  | "em_planejamento"
  | "confirmado"
  | "finalizado"
  | "cancelado";

export interface Evento {
  id: string;
  cliente_id: string;

  nome: string;
  tipo_evento: string | null;
  tema: string | null;
  descricao: string | null;

  data_evento: string | null;
  horario: string | null;

  cidade: string | null;
  estado: string | null;
  endereco: string | null;

  quantidade_convidados: number | null;
  orcamento_total: number | null;

  status: StatusEvento;
  visivel_profissionais: boolean;

  criado_em: string;
  atualizado_em: string;
}

export interface CriarEvento {
  nome: string;
  tipo_evento?: string;
  tema?: string;
  descricao?: string;

  data_evento?: string;
  horario?: string;

  cidade?: string;
  estado?: string;
  endereco?: string;

  quantidade_convidados?: number | null;
  orcamento_total?: number | null;

  status?: StatusEvento;
  visivel_profissionais?: boolean;
}