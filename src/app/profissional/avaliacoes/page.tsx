
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/services/supabase";

type Avaliacao = {
  id: string;
  nota: number;
  comentario: string;
  criado_em: string;
  resposta_profissional: string | null;
  respondido_em: string | null;
  orcamento_id: string;
};

const ouro = "#d6aa46";

const painel: React.CSSProperties = {
  background: "#141414",
  border: "1px solid #303030",
  borderRadius: 14,
  padding: 22,
};

export default function AvaliacoesProfissionalPage() {
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const [filtro, setFiltro] = useState<
    "todas" | "pendentes" | "respondidas"
  >("todas");

  const [editandoId, setEditandoId] = useState<string | null>(
    null
  );

  const [resposta, setResposta] = useState("");
  const [enviando, setEnviando] = useState(false);

  // ============================================
  // CARREGAR AVALIAÇÕES DO PROFISSIONAL
  // ============================================

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro("");

    try {
      const { data: auth, error: erroAuth } =
        await supabase.auth.getUser();

      if (erroAuth) throw erroAuth;

      if (!auth.user) {
        throw new Error(
          "Faça login para visualizar suas avaliações."
        );
      }

      const {
        data: profissional,
        error: erroProfissional,
      } = await supabase
        .from("profissionais")
        .select("id")
        .eq("usuario_id", auth.user.id)
        .maybeSingle();

      if (erroProfissional) {
        throw erroProfissional;
      }

      if (!profissional) {
        throw new Error(
          "Perfil profissional não encontrado."
        );
      }

      const { data, error: erroAvaliacoes } =
        await supabase
          .from("avaliacoes")
          .select(
            "id, nota, comentario, criado_em, resposta_profissional, respondido_em, orcamento_id"
          )
          .eq("profissional_id", profissional.id)
          .order("criado_em", {
            ascending: false,
          });

      if (erroAvaliacoes) {
        throw erroAvaliacoes;
      }

      setAvaliacoes((data ?? []) as Avaliacao[]);
    } catch (error) {
      console.error(error);

      setErro(
        error instanceof Error
          ? error.message
          : "Erro ao carregar avaliações."
      );
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  // ============================================
  // RESUMO DAS AVALIAÇÕES
  // ============================================

  const resumo = useMemo(() => {
    const total = avaliacoes.length;

    const media = total
      ? avaliacoes.reduce(
          (soma, avaliacao) =>
            soma + avaliacao.nota,
          0
        ) / total
      : 0;

    const pendentes = avaliacoes.filter(
      (avaliacao) =>
        !avaliacao.resposta_profissional
    ).length;

    return {
      total,
      media,
      pendentes,
    };
  }, [avaliacoes]);

  // ============================================
  // FILTROS
  // ============================================

  const visiveis = avaliacoes.filter(
    (avaliacao) =>
      filtro === "todas" ||
      (filtro === "pendentes" &&
        !avaliacao.resposta_profissional) ||
      (filtro === "respondidas" &&
        Boolean(avaliacao.resposta_profissional))
  );

  // ============================================
  // PUBLICAR RESPOSTA
  // ============================================

  async function enviarResposta(id: string) {
    const texto = resposta.trim();

    if (
      !texto ||
      texto.length > 2000 ||
      enviando
    ) {
      return;
    }

    setEnviando(true);
    setErro("");
    setSucesso("");

    try {
      const { error } = await supabase.rpc(
        "responder_avaliacao",
        {
          p_avaliacao_id: id,
          p_resposta: texto,
        }
      );

      if (error) {
        throw error;
      }

      setEditandoId(null);
      setResposta("");

      setSucesso(
        "Resposta publicada com sucesso!"
      );

      await carregar();
    } catch (error) {
      console.error(error);

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível publicar a resposta."
      );
    } finally {
      setEnviando(false);
    }
  }

  // ============================================
  // INTERFACE
  // ============================================

  return (
    <main
      style={{
        maxWidth: 1100,
        margin: "0 auto",
        padding: "36px 22px 80px",
        color: "#f5f5f5",
      }}
    >
      {/* CABEÇALHO */}

      <header style={{ marginBottom: 30 }}>
        <span
          style={{
            color: ouro,
            letterSpacing: 2,
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          REPUTAÇÃO PROFISSIONAL
        </span>

        <h1
          style={{
            fontSize:
              "clamp(28px, 4vw, 40px)",
            margin: "10px 0",
          }}
        >
          Minhas avaliações
        </h1>

        <p
          style={{
            color: "#aaa",
            lineHeight: 1.6,
          }}
        >
          Acompanhe as opiniões dos clientes
          e responda aos comentários recebidos.
        </p>
      </header>

      {/* RESUMO */}

      <section
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 14,
          marginBottom: 28,
        }}
      >
        <div style={painel}>
          <span
            style={{
              color: "#aaa",
              fontSize: 13,
            }}
          >
            Nota média
          </span>

          <div
            style={{
              fontSize: 30,
              fontWeight: 800,
              color: ouro,
              marginTop: 8,
            }}
          >
            {resumo.total
              ? resumo.media
                  .toFixed(1)
                  .replace(".", ",")
              : "—"}

            <span style={{ fontSize: 19 }}>
              {" "}★
            </span>
          </div>
        </div>

        <div style={painel}>
          <span
            style={{
              color: "#aaa",
              fontSize: 13,
            }}
          >
            Avaliações recebidas
          </span>

          <div
            style={{
              fontSize: 30,
              fontWeight: 800,
              marginTop: 8,
            }}
          >
            {resumo.total}
          </div>
        </div>

        <div style={painel}>
          <span
            style={{
              color: "#aaa",
              fontSize: 13,
            }}
          >
            Aguardando resposta
          </span>

          <div
            style={{
              fontSize: 30,
              fontWeight: 800,
              marginTop: 8,
            }}
          >
            {resumo.pendentes}
          </div>
        </div>
      </section>

      {/* MENSAGENS */}

      {sucesso && (
        <p
          role="status"
          style={{
            padding: 14,
            borderRadius: 9,
            background: "#102016",
            color: "#86efac",
          }}
        >
          {sucesso}
        </p>
      )}

      {erro && (
        <p
          role="alert"
          style={{
            padding: 14,
            borderRadius: 9,
            background: "#2b1515",
            color: "#fca5a5",
          }}
        >
          {erro}
        </p>
      )}

      {/* FILTROS */}

      <nav
        aria-label="Filtrar avaliações"
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          margin: "25px 0",
        }}
      >
        {(
          [
            ["todas", "Todas"],
            ["pendentes", "Sem resposta"],
            ["respondidas", "Respondidas"],
          ] as const
        ).map(([valor, texto]) => (
          <button
            key={valor}
            type="button"
            onClick={() => setFiltro(valor)}
            style={{
              background:
                filtro === valor
                  ? ouro
                  : "#202020",
              color:
                filtro === valor
                  ? "#090909"
                  : "#ddd",
              border:
                "1px solid #3a3a3a",
              padding: "10px 16px",
              borderRadius: 9,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {texto}
          </button>
        ))}
      </nav>

      {/* LISTA DE AVALIAÇÕES */}

      {carregando ? (
        <p style={{ color: "#aaa" }}>
          Carregando avaliações...
        </p>
      ) : visiveis.length === 0 ? (
        <div
          style={{
            ...painel,
            textAlign: "center",
            color: "#aaa",
            padding: 40,
          }}
        >
          Nenhuma avaliação encontrada neste filtro.
        </div>
      ) : (
        <section
          style={{
            display: "grid",
            gap: 16,
          }}
        >
          {visiveis.map((avaliacao) => (
            <article
              key={avaliacao.id}
              style={painel}
            >
              {/* ESTRELAS E DATA */}

              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  alignItems: "center",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <div
                  aria-label={`${avaliacao.nota} de 5 estrelas`}
                  style={{
                    color: ouro,
                    fontSize: 25,
                    letterSpacing: 3,
                  }}
                >
                  {"★".repeat(
                    avaliacao.nota
                  )}

                  <span
                    style={{
                      color: "#555",
                    }}
                  >
                    {"★".repeat(
                      5 - avaliacao.nota
                    )}
                  </span>
                </div>

                <time
                  style={{
                    color: "#999",
                    fontSize: 13,
                  }}
                  dateTime={
                    avaliacao.criado_em
                  }
                >
                  {new Date(
                    avaliacao.criado_em
                  ).toLocaleDateString(
                    "pt-BR"
                  )}
                </time>
              </div>

              {/* COMENTÁRIO */}

              <p
                style={{
                  lineHeight: 1.8,
                  whiteSpace: "pre-wrap",
                  overflowWrap: "anywhere",
                  margin: "18px 0",
                }}
              >
                {avaliacao.comentario}
              </p>

              {/* RESPOSTA PUBLICADA */}

              {avaliacao.resposta_profissional ? (
                <div
                  style={{
                    background: "#202020",
                    borderLeft:
                      `3px solid ${ouro}`,
                    padding: 16,
                    borderRadius: 8,
                  }}
                >
                  <strong
                    style={{
                      color: ouro,
                    }}
                  >
                    Sua resposta
                  </strong>

                  <p
                    style={{
                      whiteSpace:
                        "pre-wrap",
                      overflowWrap:
                        "anywhere",
                      lineHeight: 1.7,
                    }}
                  >
                    {
                      avaliacao.resposta_profissional
                    }
                  </p>

                  {avaliacao.respondido_em && (
                    <small
                      style={{
                        color: "#999",
                      }}
                    >
                      Respondida em{" "}
                      {new Date(
                        avaliacao.respondido_em
                      ).toLocaleDateString(
                        "pt-BR"
                      )}
                    </small>
                  )}
                </div>
              ) : editandoId ===
                avaliacao.id ? (
                /* FORMULÁRIO DE RESPOSTA */

                <div
                  style={{
                    marginTop: 18,
                  }}
                >
                  <label
                    htmlFor={`resposta-${avaliacao.id}`}
                    style={{
                      display: "block",
                      marginBottom: 10,
                      fontWeight: 700,
                    }}
                  >
                    Sua resposta ao cliente
                  </label>

                  <textarea
                    id={`resposta-${avaliacao.id}`}
                    value={resposta}
                    onChange={(event) =>
                      setResposta(
                        event.target.value
                      )
                    }
                    maxLength={2000}
                    rows={4}
                    placeholder="Agradeça o feedback ou esclareça a experiência..."
                    style={{
                      width: "100%",
                      boxSizing:
                        "border-box",
                      background:
                        "#0b0b0b",
                      color: "#fff",
                      border:
                        "1px solid #444",
                      borderRadius: 9,
                      padding: 14,
                      font: "inherit",
                      resize: "vertical",
                    }}
                  />

                  <p
                    style={{
                      color: "#999",
                      fontSize: 12,
                      textAlign: "right",
                    }}
                  >
                    {resposta.length}/2000
                    caracteres
                  </p>

                  <div
                    style={{
                      display: "flex",
                      gap: 10,
                      flexWrap: "wrap",
                    }}
                  >
                    <button
                      type="button"
                      disabled={
                        enviando ||
                        !resposta.trim()
                      }
                      onClick={() =>
                        void enviarResposta(
                          avaliacao.id
                        )
                      }
                      style={{
                        background: ouro,
                        color: "#090909",
                        border: 0,
                        borderRadius: 8,
                        padding:
                          "12px 18px",
                        fontWeight: 800,
                        cursor:
                          "pointer",
                        opacity:
                          enviando ||
                          !resposta.trim()
                            ? 0.5
                            : 1,
                      }}
                    >
                      {enviando
                        ? "Publicando..."
                        : "Publicar resposta"}
                    </button>

                    <button
                      type="button"
                      disabled={enviando}
                      onClick={() => {
                        setEditandoId(
                          null
                        );
                        setResposta("");
                      }}
                      style={{
                        background:
                          "#282828",
                        color: "#fff",
                        border:
                          "1px solid #444",
                        borderRadius: 8,
                        padding:
                          "12px 18px",
                        cursor:
                          "pointer",
                      }}
                    >
                      Cancelar
                    </button>
                  </div>

                  <p
                    style={{
                      color: "#999",
                      fontSize: 12,
                    }}
                  >
                    A resposta só pode ser
                    enviada uma vez.
                    Confira antes de
                    publicar.
                  </p>
                </div>
              ) : (
                /* BOTÃO RESPONDER */

                <button
                  type="button"
                  onClick={() => {
                    setEditandoId(
                      avaliacao.id
                    );
                    setResposta("");
                    setErro("");
                  }}
                  style={{
                    background: ouro,
                    color: "#090909",
                    border: 0,
                    borderRadius: 8,
                    padding: "11px 18px",
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  Responder avaliação
                </button>
              )}
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
