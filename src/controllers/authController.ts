"use client";

import { supabase } from "@/services/supabase";
import type {
  CadastroUsuario,
  Usuario,
} from "@/models/Usuario";

/* =========================================================
   TRATAMENTO DOS ERROS DE AUTENTICAÇÃO
========================================================= */

function mensagemErroAuth(error: {
  code?: string;
  message?: string;
  status?: number;
}) {
  switch (error.code) {
    case "invalid_credentials":
      return "E-mail ou senha incorretos. Verifique os dados e tente novamente.";

    case "email_not_confirmed":
      return "Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada antes de entrar.";

    case "email_address_invalid":
      return "O endereço de e-mail informado não é válido.";

    case "user_banned":
      return "Esta conta está temporariamente bloqueada. Entre em contato com o suporte.";

    case "over_request_rate_limit":
      return "Muitas tentativas de acesso foram realizadas. Aguarde alguns minutos e tente novamente.";

    case "request_timeout":
      return "A solicitação demorou mais do que o esperado. Verifique sua conexão e tente novamente.";

    case "unexpected_failure":
      return "O serviço de autenticação está temporariamente indisponível. Tente novamente em alguns instantes.";

    default:
      return "Não foi possível realizar o login. Verifique seus dados e tente novamente.";
  }
}

/* =========================================================
   CADASTRO
========================================================= */

export async function cadastrarUsuario(
  dados: CadastroUsuario
) {
  const emailNormalizado =
    dados.email.trim().toLowerCase();

  const { data, error } =
    await supabase.auth.signUp({
      email: emailNormalizado,
      password: dados.senha,

      options: {
        data: {
          nome: dados.nome,
          tipo: dados.tipo,
        },
      },
    });

  if (error) {
    console.error(
      "Erro ao cadastrar usuário:",
      {
        code: error.code,
        status: error.status,
        message: error.message,
      }
    );

    throw new Error(error.message);
  }

  return data;
}

/* =========================================================
   LOGIN
========================================================= */

export async function loginUsuario(
  email: string,
  senha: string
) {
  const emailNormalizado =
    email.trim().toLowerCase();

  if (!emailNormalizado) {
    throw new Error(
      "Informe seu e-mail para continuar."
    );
  }

  if (!senha.trim()) {
    throw new Error(
      "Informe sua senha para continuar."
    );
  }

  const { data, error } =
    await supabase.auth.signInWithPassword({
      email: emailNormalizado,
      password: senha,
    });

  if (error) {
    console.error(
      "Erro de autenticação:",
      {
        code: error.code,
        status: error.status,
        message: error.message,
      }
    );

    throw new Error(
      mensagemErroAuth(error)
    );
  }

  if (!data.user) {
    throw new Error(
      "Não foi possível identificar o usuário."
    );
  }

  return data;
}

/* =========================================================
   BUSCAR PERFIL
========================================================= */

export async function buscarMeuPerfil():
  Promise<Usuario | null> {
  const {
    data: authData,
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return null;
  }

  const { data, error } =
    await supabase
      .from("perfis")
      .select("*")
      .eq("id", authData.user.id)
      .single();

  if (error) {
    console.error(
      "Erro ao buscar perfil:",
      error
    );

    throw new Error(
      "Sua conta foi autenticada, mas não foi possível carregar seu perfil."
    );
  }

  return data as Usuario;
}

/* =========================================================
   LOGOUT
========================================================= */

export async function logoutUsuario() {
  const { error } =
    await supabase.auth.signOut();

  if (error) {
    console.error(
      "Erro ao sair:",
      error
    );

    throw new Error(
      "Não foi possível sair da conta. Tente novamente."
    );
  }
}

/* =========================================================
   ENVIAR RECUPERAÇÃO DE SENHA
========================================================= */

export async function enviarRecuperacaoSenha(
  email: string
) {
  const emailNormalizado =
    email.trim().toLowerCase();

  if (!emailNormalizado) {
    throw new Error(
      "Informe seu e-mail para continuar."
    );
  }

  const { error } =
    await supabase.auth.resetPasswordForEmail(
      emailNormalizado,
      {
        redirectTo:
          `${window.location.origin}/redefinir-senha`,
      }
    );

  if (error) {
    console.error(
      "Erro ao enviar recuperação:",
      {
        code: error.code,
        status: error.status,
        message: error.message,
      }
    );

    /* LIMITE DE ENVIO DE E-MAILS */

    if (
      error.code ===
        "over_email_send_rate_limit" ||
      error.code ===
        "over_request_rate_limit"
    ) {
      throw new Error(
        "Muitas solicitações de recuperação foram realizadas. Aguarde alguns minutos antes de tentar novamente."
      );
    }

    /* E-MAIL INVÁLIDO */

    if (
      error.code ===
      "email_address_invalid"
    ) {
      throw new Error(
        "Informe um endereço de e-mail válido."
      );
    }

    /* TIMEOUT */

    if (
      error.code ===
      "request_timeout"
    ) {
      throw new Error(
        "A solicitação demorou mais do que o esperado. Verifique sua conexão e tente novamente."
      );
    }

    /* OUTROS ERROS */

    throw new Error(
      "Não foi possível enviar a recuperação de senha. Tente novamente."
    );
  }
}

/* =========================================================
   REDEFINIR SENHA
========================================================= */

export async function redefinirSenha(
  novaSenha: string
) {
  if (!novaSenha) {
    throw new Error(
      "Informe sua nova senha."
    );
  }

  if (novaSenha.length < 6) {
    throw new Error(
      "A nova senha deve possuir pelo menos 6 caracteres."
    );
  }

  const { error } =
    await supabase.auth.updateUser({
      password: novaSenha,
    });

  if (error) {
    console.error(
      "Erro ao redefinir senha:",
      {
        code: error.code,
        status: error.status,
        message: error.message,
      }
    );

    /* MESMA SENHA */

    if (
      error.code === "same_password"
    ) {
      throw new Error(
        "A nova senha deve ser diferente da senha atual."
      );
    }

    /* SESSÃO EXPIRADA */

    if (
      error.code ===
        "session_not_found" ||
      error.code ===
        "refresh_token_not_found"
    ) {
      throw new Error(
        "O link de recuperação expirou ou não é mais válido. Solicite uma nova recuperação de senha."
      );
    }

    /* SENHA FRACA */

    if (
      error.code ===
      "weak_password"
    ) {
      throw new Error(
        "A nova senha é muito fraca. Escolha uma senha mais segura."
      );
    }

    /* OUTROS ERROS */

    throw new Error(
      "Não foi possível alterar sua senha. Solicite um novo link de recuperação e tente novamente."
    );
  }
}