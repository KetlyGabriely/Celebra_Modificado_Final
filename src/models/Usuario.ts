export type TipoUsuario =
  | "cliente"
  | "profissional"
  | "admin";

export interface Usuario {
  id: string;
  nome: string;
  telefone?: string | null;
  avatar_url?: string | null;
  cidade?: string | null;
  estado?: string | null;
  tipo: TipoUsuario;
  criado_em?: string;
  atualizado_em?: string;
}

export interface CadastroUsuario {
  nome: string;
  email: string;
  senha: string;
  tipo: "cliente" | "profissional";
}