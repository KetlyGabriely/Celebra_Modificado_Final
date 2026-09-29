"use client";

import { supabase } from "@/services/supabase";
import type { CadastroUsuario, Usuario } from "@/models/Usuario";

export async function cadastrarUsuario(dados: CadastroUsuario) {
  const { data, error } = await supabase.auth.signUp({
    email: dados.email,
    password: dados.senha,
    options: {
      data: {
        nome: dados.nome,
        tipo: dados.tipo,
      },
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function loginUsuario(email: string, senha: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: senha,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function buscarMeuPerfil(): Promise<Usuario | null> {
  const { data: authData, error: authError } =
    await supabase.auth.getUser();

  if (authError || !authData.user) {
    return null;
  }

  const { data, error } = await supabase
    .from("perfis")
    .select("*")
    .eq("id", authData.user.id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Usuario;
}

export async function logoutUsuario() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(error.message);
  }
}