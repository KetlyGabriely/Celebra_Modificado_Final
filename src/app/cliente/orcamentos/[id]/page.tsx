
"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/services/supabase";

import {
  aceitarOrcamento,
  aceitarOrcamentoEvento,
  buscarOrcamentoClientePorId,
  type OrcamentoCliente,
  recusarOrcamento,
  recusarOrcamentoEvento,
} from "@/controllers/orcamentoController";

type ConclusaoServico = {
  profissional_concluiu_em: string | null;
  cliente_confirmou_em: string | null;
};

export default function DetalhesOrcamentoClientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [orcamento, setOrcamento] =
    useState<OrcamentoCliente | null>(null);

  const [conclusao, setConclusao] =
    useState<ConclusaoServico | null>(null);

  const [carregando, setCarregando] = useState(true);
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagemSucesso, setMensagemSucesso] = useState("");

  const [confirmacao, setConfirmacao] =
    useState<"aceitar" | "recusar" | null>(null);

  const [confirmarConclusao, setConfirmarConclusao] =
    useState(false);

  // ============================================
  // CARREGAR ORÇAMENTO E CONCLUSÃO
  // ============================================

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      try {
        setCarregando(true);
        setErro("");

        const data = await buscarOrcamentoClientePorId(id);

        if (!ativo) return;

        if (!data) {
          setOrcamento(null);
          setErro("Este orçamento não foi encontrado.");
          return;
        }

        setOrcamento(data);

        if (data.status === "aceito") {
          const { data: registro, error } = await supabase
            .from("conclusoes_servico")
            .select(
              "profissional_concluiu_em, cliente_confirmou_em"
            )
            .eq("orcamento_id", id)
            .maybeSingle();

          if (error) throw new Error(error.message);

          if (ativo) setConclusao(registro);
        } else {
          setConclusao(null);
        }
      } catch (error) {
        console.error(error);

        if (ativo) {
          setErro(
            error instanceof Error
              ? error.message
              : "Não foi possível carregar o orçamento."
          );
        }
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    void carregar();

    return () => {
      ativo = false;
    };
  }, [id]);

  // ============================================
  // ACEITAR OU RECUSAR PROPOSTA
  // ============================================

  async function confirmarDecisao() {
    if (!orcamento || !confirmacao || processando) return;

    try {
      setProcessando(true);
      setErro("");
      setMensagemSucesso("");

      const ehEvento = orcamento.origem === "evento";

      if (confirmacao === "aceitar") {
        if (ehEvento) {
          await aceitarOrcamentoEvento(orcamento.id);
        } else {
          await aceitarOrcamento(orcamento.id);
        }

        setOrcamento({
          ...orcamento,
          status: "aceito",
        });

        setConclusao(null);
      } else {
        if (ehEvento) {
          await recusarOrcamentoEvento(orcamento.id);
        } else {
          await recusarOrcamento(orcamento.id);
        }

        setOrcamento({
          ...orcamento,
          status: "recusado",
        });
      }

      setConfirmacao(null);
    } catch (error) {
      console.error(error);

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar o orçamento."
      );
    } finally {
      setProcessando(false);
    }
  }

  // ============================================
  // CONFIRMAR CONCLUSÃO DO SERVIÇO
  // ============================================

  async function concluirServico() {
    if (
      !orcamento ||
      orcamento.status !== "aceito" ||
      !conclusao?.profissional_concluiu_em ||
      conclusao.cliente_confirmou_em ||
      processando
    ) {
      return;
    }

    try {
      setProcessando(true);
      setErro("");
      setMensagemSucesso("");

      const { error } = await supabase.rpc(
        "cliente_confirmar_servico_concluido",
        {
          p_orcamento_id: orcamento.id,
        }
      );

      if (error) throw new Error(error.message);

      const { data: registro, error: consultaErro } =
        await supabase
          .from("conclusoes_servico")
          .select(
            "profissional_concluiu_em, cliente_confirmou_em"
          )
          .eq("orcamento_id", orcamento.id)
          .single();

      if (consultaErro) {
        throw new Error(consultaErro.message);
      }

      setConclusao(registro);
      setConfirmarConclusao(false);

      setMensagemSucesso(
        "Conclusão confirmada! Agora esta contratação pode receber sua avaliação."
      );
    } catch (error) {
      console.error(error);

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível confirmar a conclusão."
      );
    } finally {
      setProcessando(false);
    }
  }

  // ============================================
  // ESTADOS DA PÁGINA
  // ============================================

  if (carregando) {
    return (
      <div className="cliente-orcamento-estado">
        <span>✦</span>
        <p>Carregando proposta...</p>
      </div>
    );
  }

  if (!orcamento) {
    return (
      <div className="cliente-orcamento-estado">
        <span>◇</span>
        <h2>Orçamento indisponível</h2>
        <p>{erro}</p>

        <button
          type="button"
          onClick={() => router.push("/cliente/orcamentos")}
        >
          Voltar aos orçamentos
        </button>
      </div>
    );
  }

  // ============================================
  // DADOS DA PROPOSTA
  // ============================================

  const ehEvento = orcamento.origem === "evento";

  const valor = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(orcamento.valor));

  const dataCriacao = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
  }).format(new Date(orcamento.criado_em));

  const validade = orcamento.validade
    ? new Intl.DateTimeFormat("pt-BR").format(
      new Date(`${orcamento.validade}T12:00:00`)
    )
    : "Sem data definida";

  const profissional =
    orcamento.profissionais?.nome_empresa ||
    "Profissional Celebra";

  const servico = orcamento.servicos?.nome || "Serviço";

  const evento = orcamento.eventos;

  // ============================================
  // INTERFACE
  // ============================================

  return (
    <div className="cliente-proposta-page">
      <button
        type="button"
        className="cliente-proposta-voltar"
        onClick={() => router.push("/cliente/orcamentos")}
      >
        ← Meus orçamentos
      </button>

      <div className="cliente-proposta-grid">
        {/* CONTEÚDO PRINCIPAL */}

        <section className="cliente-proposta-principal">
          <div className="cliente-proposta-cabecalho">
            <div>
              <span className="dashboard-label">
                {ehEvento
                  ? "PROPOSTA PARA EVENTO"
                  : "PROPOSTA COMERCIAL"}
              </span>

              <h1>
                {orcamento.titulo ||
                  (ehEvento ? evento?.nome : servico) ||
                  "Proposta comercial"}
              </h1>

              <p>
                Enviada por <strong>{profissional}</strong>
              </p>
            </div>

            <StatusProposta status={orcamento.status} />
          </div>

          <div className="cliente-proposta-divisor" />

          {/* EVENTO OU SERVIÇO */}

          <div className="cliente-proposta-servico">
            <span>{ehEvento ? "Evento" : "Serviço"}</span>

            {ehEvento ? (
              <>
                <strong>{evento?.nome || "Evento"}</strong>

                {evento?.tipo_evento && (
                  <small>{evento.tipo_evento}</small>
                )}

                {evento?.tema && (
                  <small>Tema: {evento.tema}</small>
                )}

                {evento && (
                  <div className="cliente-proposta-evento-detalhes">
                    <div className="cliente-proposta-evento-meta">
                      {evento.data_evento && (
                        <span>
                          Data:{" "}
                          {formatarDataEvento(evento.data_evento)}
                        </span>
                      )}

                      {evento.horario && (
                        <span>
                          Horário: {evento.horario.slice(0, 5)}
                        </span>
                      )}

                      {evento.cidade && (
                        <span>
                          Local: {evento.cidade}
                          {evento.estado
                            ? ` - ${evento.estado}`
                            : ""}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      className="cliente-proposta-ver-evento"
                      onClick={() =>
                        router.push(
                          `/cliente/eventos/${evento.id}`
                        )
                      }
                    >
                      Ver meu evento →
                    </button>
                  </div>
                )}
              </>
            ) : (
              <>
                <strong>{servico}</strong>

                {orcamento.servicos?.categorias?.nome && (
                  <small>
                    {orcamento.servicos.categorias.nome}
                  </small>
                )}
              </>
            )}
          </div>

          <div className="cliente-proposta-divisor" />

          {/* DESCRIÇÃO */}

          <h2>Sobre a proposta</h2>

          <div className="cliente-proposta-descricao">
            {orcamento.descricao ||
              "O profissional não adicionou uma descrição."}
          </div>

          <div className="cliente-proposta-divisor" />

          {/* INFORMAÇÕES */}

          <div className="cliente-proposta-infos">
            <InfoProposta
              titulo="Enviada em"
              valor={dataCriacao}
            />

            <InfoProposta
              titulo="Validade"
              valor={validade}
            />

            <InfoProposta
              titulo="Origem"
              valor={
                ehEvento
                  ? "Proposta para evento"
                  : "Interesse em serviço"
              }
            />
          </div>
        </section>

        {/* LATERAL */}

        <aside className="cliente-proposta-lateral">
          <div className="cliente-proposta-valor">
            <span>VALOR DA PROPOSTA</span>

            <strong>{valor}</strong>

            {/* PROPOSTA PENDENTE */}

            {orcamento.status === "pendente" && (
              <>
                <p>
                  Analise as informações da proposta antes
                  de tomar sua decisão.
                </p>

                <button
                  type="button"
                  className="cliente-btn-aceitar"
                  disabled={processando}
                  onClick={() => setConfirmacao("aceitar")}
                >
                  Aceitar proposta
                </button>

                <button
                  type="button"
                  className="cliente-btn-recusar"
                  disabled={processando}
                  onClick={() => setConfirmacao("recusar")}
                >
                  Recusar proposta
                </button>
              </>
            )}

            {/* PROPOSTA ACEITA */}

            {orcamento.status === "aceito" && (
              <>
                <div className="cliente-decisao cliente-decisao-aceito">
                  <span>✓</span>

                  <div>
                    <strong>Proposta aceita</strong>

                    <p>
                      {ehEvento
                        ? "Você aceitou esta proposta e o evento foi confirmado."
                        : "Você aceitou este orçamento."}
                    </p>
                  </div>
                </div>

                {/* CONCLUSÃO DO SERVIÇO */}

                <div
                  style={{
                    marginTop: 18,
                    padding: 16,
                    border: "1px solid #333",
                    borderRadius: 10,
                    background: "#141414",
                  }}
                >
                  <strong style={{ color: "#d6aa46" }}>
                    Conclusão do serviço
                  </strong>


                  {conclusao?.cliente_confirmou_em ? (
                    <div>
                      <p
                        style={{
                          color: "#86efac",
                          marginTop: 10,
                        }}
                      >
                        ✓ Serviço concluído e confirmado por você.
                      </p>

                      <p
                        style={{
                          color: "#aaa",
                          marginTop: 12,
                          fontSize: 14,
                        }}
                      >
                        Sua avaliação ajuda outros clientes a
                        escolher profissionais no Celebra.
                      </p>

                      <button
                        type="button"
                        onClick={() =>
                          router.push(
                            `/cliente/orcamentos/${orcamento.id}/avaliar`
                          )
                        }
                        style={{
                          marginTop: 14,
                          padding: "12px 20px",
                          background: "#d6aa46",
                          color: "#090909",
                          border: "none",
                          borderRadius: 9,
                          fontSize: 14,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        ★ Avaliar serviço
                      </button>
                    </div>

                  ) : conclusao?.profissional_concluiu_em ? (
                    <>
                      <p
                        style={{
                          marginTop: 10,
                          color: "#ddd",
                        }}
                      >
                        O profissional informou que realizou
                        o serviço. Confirme somente se ele
                        realmente foi concluído.
                      </p>

                      <button
                        type="button"
                        disabled={processando}
                        onClick={() =>
                          setConfirmarConclusao(true)
                        }
                        style={{
                          marginTop: 12,
                          padding: "12px 16px",
                          border: 0,
                          borderRadius: 8,
                          background: "#d6aa46",
                          color: "#090909",
                          fontWeight: 700,
                          cursor: processando
                            ? "wait"
                            : "pointer",
                        }}
                      >
                        Confirmar conclusão do serviço
                      </button>
                    </>
                  ) : (
                    <p
                      style={{
                        marginTop: 10,
                        color: "#aaa",
                      }}
                    >
                      Serviço em andamento. A confirmação
                      ficará disponível quando o profissional
                      informar a conclusão.
                    </p>
                  )}
                </div>
              </>
            )}

            {/* PROPOSTA RECUSADA */}

            {orcamento.status === "recusado" && (
              <div className="cliente-decisao">
                <span>×</span>

                <div>
                  <strong>Proposta recusada</strong>
                  <p>Você recusou este orçamento.</p>
                </div>
              </div>
            )}

            {/* PROPOSTA CANCELADA */}

            {orcamento.status === "cancelado" && (
              <div className="cliente-decisao">
                <span>×</span>

                <div>
                  <strong>Proposta cancelada</strong>
                  <p>Esta proposta foi cancelada.</p>
                </div>
              </div>
            )}

            {/* PROPOSTA EXPIRADA */}

            {orcamento.status === "expirado" && (
              <div className="cliente-decisao">
                <span>!</span>

                <div>
                  <strong>Proposta expirada</strong>
                  <p>O prazo desta proposta terminou.</p>
                </div>
              </div>
            )}
          </div>

          {/* PROFISSIONAL */}

          <div className="cliente-proposta-profissional">
            <span className="dashboard-label">
              PROFISSIONAL
            </span>

            <h3>
              {profissional}
              {orcamento.profissionais?.verificado && (
                <span> ✓</span>
              )}
            </h3>
          </div>
        </aside>
      </div>

      {/* MENSAGEM DE SUCESSO */}

      {mensagemSucesso && (
        <div
          role="status"
          style={{
            marginTop: 18,
            padding: 16,
            border: "1px solid #276749",
            borderRadius: 10,
            color: "#86efac",
            background: "#102016",
          }}
        >
          {mensagemSucesso}
        </div>
      )}

      {/* MENSAGEM DE ERRO */}

      {erro && (
        <div className="cliente-proposta-erro">
          {erro}
        </div>
      )}

      {/* MODAL DE CONCLUSÃO */}

      {confirmarConclusao && (
        <div
          className="cliente-confirmacao-overlay"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !processando
            ) {
              setConfirmarConclusao(false);
            }
          }}
        >
          <div className="cliente-confirmacao-modal">
            <span className="dashboard-label">
              CONFIRMAÇÃO
            </span>

            <h2>O serviço foi realmente concluído?</h2>

            <p>
              Ao confirmar, você declara que o profissional
              realizou o serviço contratado. Isso permitirá
              publicar uma avaliação. Se houver pendências,
              não confirme ainda.
            </p>

            <div className="cliente-confirmacao-acoes">
              <button
                type="button"
                disabled={processando}
                onClick={() =>
                  setConfirmarConclusao(false)
                }
              >
                Voltar
              </button>

              <button
                type="button"
                className="confirmar-aceite"
                disabled={processando}
                onClick={() => void concluirServico()}
              >
                {processando
                  ? "Confirmando..."
                  : "Sim, serviço concluído"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE ACEITAR / RECUSAR */}

      {confirmacao && (
        <div
          className="cliente-confirmacao-overlay"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !processando
            ) {
              setConfirmacao(null);
            }
          }}
        >
          <div className="cliente-confirmacao-modal">
            <span className="dashboard-label">
              CONFIRMAÇÃO
            </span>

            <h2>
              {confirmacao === "aceitar"
                ? "Aceitar esta proposta?"
                : "Recusar esta proposta?"}
            </h2>

            <p>
              {confirmacao === "aceitar"
                ? ehEvento
                  ? `Você está prestes a aceitar a proposta de ${valor} enviada por ${profissional} para o evento "${evento?.nome || "Evento"}". O evento será confirmado e deixará de aparecer nas oportunidades.`
                  : `Você está prestes a aceitar a proposta de ${valor} enviada por ${profissional}.`
                : "Após confirmar, esta proposta será marcada como recusada."}
            </p>

            <div className="cliente-confirmacao-acoes">
              <button
                type="button"
                disabled={processando}
                onClick={() => setConfirmacao(null)}
              >
                Voltar
              </button>

              <button
                type="button"
                className={
                  confirmacao === "aceitar"
                    ? "confirmar-aceite"
                    : "confirmar-recusa"
                }
                disabled={processando}
                onClick={() => void confirmarDecisao()}
              >
                {processando
                  ? "Processando..."
                  : confirmacao === "aceitar"
                    ? "Sim, aceitar"
                    : "Sim, recusar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// COMPONENTES AUXILIARES
// ============================================

function InfoProposta({
  titulo,
  valor,
}: {
  titulo: string;
  valor: string;
}) {
  return (
    <div className="cliente-proposta-info">
      <span>{titulo}</span>
      <strong>{valor}</strong>
    </div>
  );
}

function formatarDataEvento(data: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
  }).format(new Date(`${data}T12:00:00`));
}

function StatusProposta({
  status,
}: {
  status: OrcamentoCliente["status"];
}) {
  const nomes = {
    pendente: "Aguardando decisão",
    aceito: "Aceito",
    recusado: "Recusado",
    cancelado: "Cancelado",
    expirado: "Expirado",
  };

  return (
    <span
      className={`cliente-proposta-status cliente-status-${status}`}
    >
      {nomes[status]}
    </span>
  );
}
