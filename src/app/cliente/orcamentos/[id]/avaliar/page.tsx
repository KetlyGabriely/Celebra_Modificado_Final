
"use client";

import { use, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  buscarOrcamentoClientePorId,
  type OrcamentoCliente,
} from "@/controllers/orcamentoController";

import {
  buscarAvaliacaoOrcamento,
  publicarAvaliacao,
  type Avaliacao,
} from "@/controllers/avaliacaoController";

import { supabase } from "@/services/supabase";

export default function AvaliarServicoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [orcamento, setOrcamento] =
    useState<OrcamentoCliente | null>(null);

  const [avaliacao, setAvaliacao] =
    useState<Avaliacao | null>(null);

  const [permitido, setPermitido] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [publicando, setPublicando] = useState(false);

  const [nota, setNota] = useState(0);
  const [hover, setHover] = useState(0);
  const [comentario, setComentario] = useState("");

  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const carregar = useCallback(async () => {
    try {
      setCarregando(true);
      setErro("");

      const proposta = await buscarOrcamentoClientePorId(id);

      if (!proposta) {
        setErro("Orçamento não encontrado.");
        return;
      }

      setOrcamento(proposta);

      const { data: usuarioData, error: authErro } =
        await supabase.auth.getUser();

      if (authErro) throw new Error(authErro.message);

      if (!usuarioData.user) {
        setErro("Entre na sua conta para avaliar.");
        return;
      }

      const { data: cliente, error: clienteErro } =
        await supabase
          .from("clientes")
          .select("id")
          .eq("usuario_id", usuarioData.user.id)
          .maybeSingle();

      if (clienteErro) throw new Error(clienteErro.message);

      if (!cliente || cliente.id !== proposta.cliente_id) {
        setErro("Você não pode avaliar esta contratação.");
        return;
      }

      const existente = await buscarAvaliacaoOrcamento(id);

      setAvaliacao(existente);

      if (existente) {
        setPermitido(false);
        return;
      }

      if (proposta.status !== "aceito") {
        setPermitido(false);
        return;
      }

      const { data: conclusao, error: conclusaoErro } =
        await supabase
          .from("conclusoes_servico")
          .select(
            "profissional_concluiu_em, cliente_confirmou_em"
          )
          .eq("orcamento_id", id)
          .maybeSingle();

      if (conclusaoErro) {
        throw new Error(conclusaoErro.message);
      }

      setPermitido(
        Boolean(
          conclusao?.profissional_concluiu_em &&
          conclusao?.cliente_confirmou_em
        )
      );
    } catch (error) {
      console.error(error);

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar a avaliação."
      );
    } finally {
      setCarregando(false);
    }
  }, [id]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  async function enviarAvaliacao() {
    if (publicando || !permitido) return;

    if (nota < 1 || nota > 5) {
      setErro("Selecione uma nota de 1 a 5 estrelas.");
      return;
    }

    const texto = comentario.trim();

    if (texto.length < 10 || texto.length > 2000) {
      setErro("Escreva um comentário de 10 a 2000 caracteres.");
      return;
    }

    try {
      setPublicando(true);
      setErro("");
      setSucesso("");

      await publicarAvaliacao({
        orcamento_id: id,
        nota,
        comentario: texto,
      });

      const publicada = await buscarAvaliacaoOrcamento(id);

      setAvaliacao(publicada);
      setPermitido(false);
      setSucesso("Sua avaliação foi publicada com sucesso!");
    } catch (error) {
      console.error(error);

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível publicar sua avaliação."
      );
    } finally {
      setPublicando(false);
    }
  }

  const profissional =
    orcamento?.profissionais?.nome_empresa ||
    "Profissional Celebra";

  const titulo =
    orcamento?.titulo ||
    orcamento?.servicos?.nome ||
    orcamento?.eventos?.nome ||
    "Serviço contratado";

  const podeEnviar =
    nota >= 1 &&
    comentario.trim().length >= 10 &&
    comentario.trim().length <= 2000 &&
    !publicando;

  return (
    <main
      style={{
        maxWidth: 760,
        margin: "0 auto",
        padding: "40px 20px 80px",
        color: "#f5f5f5",
      }}
    >
      <button
        type="button"
        onClick={() =>
          router.push(`/cliente/orcamentos/${id}`)
        }
        style={{
          background: "transparent",
          border: 0,
          color: "#d6aa46",
          cursor: "pointer",
          marginBottom: 28,
          fontSize: 14,
        }}
      >
        ← Voltar à proposta
      </button>

      <span
        style={{
          color: "#d6aa46",
          fontSize: 12,
          letterSpacing: 2,
          fontWeight: 700,
        }}
      >
        CELEBRA • AVALIAÇÕES
      </span>

      <h1
        style={{
          fontSize: "clamp(28px, 5vw, 40px)",
          margin: "12px 0",
        }}
      >
        Avalie sua experiência
      </h1>

      <p style={{ color: "#aaa", lineHeight: 1.7 }}>
        Sua opinião ajuda outros clientes a escolher
        profissionais para seus eventos.
      </p>

      {carregando ? (
        <p style={{ marginTop: 36, color: "#aaa" }}>
          Carregando avaliação...
        </p>
      ) : (
        <>
          {orcamento && (
            <section
              style={{
                background: "#141414",
                border: "1px solid #292929",
                borderRadius: 14,
                padding: 24,
                marginTop: 30,
              }}
            >
              <span
                style={{
                  color: "#d6aa46",
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                SERVIÇO CONTRATADO
              </span>

              <h2 style={{ margin: "10px 0", fontSize: 22 }}>
                {titulo}
              </h2>

              <p style={{ color: "#aaa" }}>
                Profissional:{" "}
                <strong style={{ color: "#fff" }}>
                  {profissional}
                </strong>
              </p>
            </section>
          )}

          {sucesso && (
            <div
              role="status"
              style={{
                marginTop: 24,
                padding: 16,
                borderRadius: 10,
                background: "#102016",
                border: "1px solid #276749",
                color: "#86efac",
              }}
            >
              ✓ {sucesso}
            </div>
          )}

          {erro && (
            <div
              role="alert"
              style={{
                marginTop: 24,
                padding: 16,
                borderRadius: 10,
                background: "#241313",
                border: "1px solid #7f1d1d",
                color: "#fca5a5",
              }}
            >
              {erro}
            </div>
          )}

          {avaliacao ? (
            <section
              style={{
                marginTop: 28,
                background: "#141414",
                border: "1px solid #333",
                borderRadius: 14,
                padding: 26,
              }}
            >
              <span style={{ color: "#86efac" }}>
                ✓ Avaliação publicada
              </span>

              <div
                aria-label={`${avaliacao.nota} de 5 estrelas`}
                style={{
                  color: "#d6aa46",
                  fontSize: 34,
                  letterSpacing: 4,
                  margin: "18px 0",
                }}
              >
                {"★".repeat(avaliacao.nota)}
                <span style={{ color: "#555" }}>
                  {"★".repeat(5 - avaliacao.nota)}
                </span>
              </div>

              <p
                style={{
                  lineHeight: 1.8,
                  whiteSpace: "pre-wrap",
                  overflowWrap: "anywhere",
                }}
              >
                {avaliacao.comentario}
              </p>

              <small style={{ color: "#888" }}>
                Publicada em{" "}
                {new Intl.DateTimeFormat("pt-BR").format(
                  new Date(avaliacao.criado_em)
                )}
              </small>

              {avaliacao.resposta_profissional && (
                <div
                  style={{
                    borderLeft: "3px solid #d6aa46",
                    marginTop: 24,
                    padding: "12px 18px",
                    background: "#1b1b1b",
                    borderRadius: 6,
                  }}
                >
                  <strong style={{ color: "#d6aa46" }}>
                    Resposta do profissional
                  </strong>

                  <p
                    style={{
                      marginTop: 10,
                      whiteSpace: "pre-wrap",
                      overflowWrap: "anywhere",
                      lineHeight: 1.7,
                    }}
                  >
                    {avaliacao.resposta_profissional}
                  </p>
                </div>
              )}
            </section>
          ) : permitido && orcamento ? (
            <section
              style={{
                marginTop: 28,
                background: "#141414",
                border: "1px solid #333",
                borderRadius: 14,
                padding: 26,
              }}
            >
              <h2 style={{ fontSize: 23, marginBottom: 8 }}>
                Como foi o serviço?
              </h2>

              <p style={{ color: "#aaa", marginBottom: 24 }}>
                Selecione uma nota e conte sua experiência.
              </p>

              <div
                role="group"
                aria-label="Nota da avaliação"
                style={{
                  display: "flex",
                  gap: 8,
                  marginBottom: 28,
                }}
              >
                {[1, 2, 3, 4, 5].map((estrela) => (
                  <button
                    key={estrela}
                    type="button"
                    aria-label={`${estrela} estrela${estrela > 1 ? "s" : ""}`}
                    aria-pressed={nota === estrela}
                    onMouseEnter={() => setHover(estrela)}
                    onMouseLeave={() => setHover(0)}
                    onFocus={() => setHover(estrela)}
                    onBlur={() => setHover(0)}
                    onClick={() => setNota(estrela)}
                    style={{
                      background: "transparent",
                      border: 0,
                      padding: 2,
                      cursor: "pointer",
                      fontSize: "clamp(32px, 7vw, 44px)",
                      color:
                        estrela <= (hover || nota)
                          ? "#d6aa46"
                          : "#555",
                    }}
                  >
                    ★
                  </button>
                ))}
              </div>

              <label
                htmlFor="comentario-avaliacao"
                style={{
                  display: "block",
                  fontWeight: 600,
                  marginBottom: 12,
                }}
              >
                Seu comentário
              </label>

              <textarea
                id="comentario-avaliacao"
                value={comentario}
                onChange={(event) =>
                  setComentario(event.target.value)
                }
                maxLength={2000}
                rows={6}
                placeholder="Conte como foi o atendimento, a qualidade do serviço e sua experiência com o profissional..."
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  background: "#0b0b0b",
                  border: "1px solid #444",
                  borderRadius: 10,
                  padding: 16,
                  color: "#fff",
                  font: "inherit",
                  resize: "vertical",
                  outlineColor: "#d6aa46",
                }}
              />

              <div
                style={{
                  textAlign: "right",
                  fontSize: 12,
                  color: "#888",
                  marginTop: 8,
                }}
              >
                {comentario.length}/2000 caracteres
              </div>

              <button
                type="button"
                onClick={() => void enviarAvaliacao()}
                disabled={!podeEnviar}
                style={{
                  width: "100%",
                  marginTop: 24,
                  padding: "15px 20px",
                  borderRadius: 10,
                  border: 0,
                  background: "#d6aa46",
                  color: "#090909",
                  fontWeight: 800,
                  fontSize: 15,
                  cursor: podeEnviar
                    ? "pointer"
                    : "not-allowed",
                  opacity: podeEnviar ? 1 : 0.5,
                }}
              >
                {publicando
                  ? "Publicando..."
                  : "★ Publicar avaliação"}
              </button>
            </section>
          ) : orcamento && !erro ? (
            <section
              style={{
                marginTop: 28,
                background: "#141414",
                border: "1px solid #333",
                borderRadius: 14,
                padding: 24,
              }}
            >
              <h2 style={{ fontSize: 20 }}>
                Avaliação ainda indisponível
              </h2>

              <p
                style={{
                  color: "#aaa",
                  marginTop: 12,
                  lineHeight: 1.7,
                }}
              >
                Você poderá avaliar quando a proposta
                estiver aceita, o profissional marcar
                o serviço como realizado e você
                confirmar a conclusão.
              </p>
            </section>
          ) : null}
        </>
      )}
    </main>
  );
}
