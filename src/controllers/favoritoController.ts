
import { supabase } from "@/services/supabase";

export async function listarFavoritos(): Promise<string[]> {
  const { data, error } = await supabase
    .from("favoritos")
    .select("servico_id");

  if (error) throw error;

  return (data ?? []).map((favorito) => favorito.servico_id);
}

export async function adicionarFavorito(servicoId: string) {
  const { data: clienteId, error: clienteError } =
    await supabase.rpc("meu_cliente_id");

  if (clienteError) throw clienteError;
  if (!clienteId) throw new Error("Cliente não encontrado.");

  const { error } = await supabase
    .from("favoritos")
    .insert({
      cliente_id: clienteId,
      servico_id: servicoId,
    });

  if (error) throw error;
}

export async function removerFavorito(servicoId: string) {
  const { data: clienteId, error: clienteError } =
    await supabase.rpc("meu_cliente_id");

  if (clienteError) throw clienteError;
  if (!clienteId) throw new Error("Cliente não encontrado.");

  const { error } = await supabase
    .from("favoritos")
    .delete()
    .eq("cliente_id", clienteId)
    .eq("servico_id", servicoId);

  if (error) throw error;
}
