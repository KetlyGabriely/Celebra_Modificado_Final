
"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  listarOrcamentosProfissional,
  type OrcamentoProfissional,
} from "@/controllers/orcamentoController";

import { supabase } from "@/services/supabase";

// ============================================
// TIPOS
// ============================================

type ConclusaoServico = {
  orcamento_id: string;
  profissional_concluiu_em: string | null;
  cliente_confirmou_em: string | null;
};

// ============================================
// PÁGINA
// ============================================

export default function OrcamentosProfissionalPage() {
  const [orcamentos, setOrcamentos] =
    useState<OrcamentoProfissional[]>([]);

  const [conclusoes, setConclusoes] =
    useState<Record<string, ConclusaoServico>>({});

  const [carregando, setCarregando] =
    useState(true);

  const [erro, setErro] = useState("");

  const [filtro, setFiltro] =
    useState("todos");

  const [processandoId, setProcessandoId] =
    useState<string | null>(null);

  const [mensagemSucesso, setMensagemSucesso] =
    useState("");

  // ============================================
  // CARREGAR ORÇAMENTOS E CONCLUSÕES
  // ============================================

  const carregar = useCallback(async () => {
    try {
      setCarregando(true);
      setErro("");

      const data =
        await listarOrcamentosProfissional();

      setOrcamentos(data);

      const aceitos = data.filter(
        (item) => item.status === "aceito"
      );

      if (aceitos.length === 0) {
        setConclusoes({});
        return;
      }

      const ids = aceitos.map(
        (item) => item.id
      );

      const { data: registros, error: conclusaoErro } =
        await supabase
          .from("conclusoes_servico")
          .select(
            "orcamento_id, profissional_concluiu_em, cliente_confirmou_em"
          )
          .in("orcamento_id", ids);

      if (conclusaoErro) {
        throw new Error(conclusaoErro.message);
      }

      const mapa: Record<string, ConclusaoServico> = {};

      for (const registro of registros ?? []) {
        mapa[registro.orcamento_id] = registro;
      }

      setConclusoes(mapa);
    } catch (error) {
      console.error(error);

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar os orçamentos."
      );
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  // ============================================
  // MARCAR SERVIÇO COMO CONCLUÍDO
  // ============================================

  async function marcarConcluido(
    orcamentoId: string
  ) {
    if (processandoId) return;

    const confirmar = window.confirm(
      "Você confirma que este serviço foi realizado? O cliente será responsável por confirmar a conclusão."
    );

    if (!confirmar) return;

    try {
      setProcessandoId(orcamentoId);
      setErro("");
      setMensagemSucesso("");

      const { error: rpcErro } =
        await supabase.rpc(
          "profissional_marcar_servico_concluido",
          {
            p_orcamento_id: orcamentoId,
          }
        );

      if (rpcErro) {
        throw new Error(rpcErro.message);
      }

      // Atualização imediata da interface.
      setConclusoes((anterior) => ({
        ...anterior,
        [orcamentoId]: {
          orcamento_id: orcamentoId,
          profissional_concluiu_em:
            new Date().toISOString(),
          cliente_confirmou_em:
            anterior[orcamentoId]
              ?.cliente_confirmou_em ?? null,
        },
      }));

      setMensagemSucesso(
        "Serviço marcado como realizado! Agora aguardamos a confirmação do cliente."
      );
    } catch (error) {
      console.error(error);

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível concluir o serviço."
      );
    } finally {
      setProcessandoId(null);
    }
  }

  // ============================================
  // FILTROS E RESUMOS
  // ============================================

  const filtrados =
    filtro === "todos"
      ? orcamentos
      : orcamentos.filter(
          (orcamento) =>
            orcamento.status === filtro
        );

  const pendentes = orcamentos.filter(
    (item) => item.status === "pendente"
  ).length;

  const aceitos = orcamentos.filter(
    (item) => item.status === "aceito"
  ).length;

  const recusados = orcamentos.filter(
    (item) => item.status === "recusado"
  ).length;

  const valorAceito = orcamentos
    .filter(
      (item) => item.status === "aceito"
    )
    .reduce(
      (total, item) =>
        total + Number(item.valor),
      0
    );

  // ============================================
  // INTERFACE
  // ============================================

  return (
    <div className="prof-orcamentos-page">
      <section className="prof-pagina-header">
        <div>
          <span className="prof-dashboard-label">
            PROPOSTAS
          </span>

          <h1>Meus orçamentos</h1>

          <p>
            Acompanhe as propostas enviadas,
            veja quais clientes aceitaram ou
            recusaram seus orçamentos e confirme
            os serviços realizados.
          </p>
        </div>
      </section>

      <section className="prof-orcamentos-resumo">
        <Resumo
          numero={orcamentos.length}
          titulo="Enviados"
        />

        <Resumo
          numero={pendentes}
          titulo="Aguardando resposta"
        />

        <Resumo
          numero={aceitos}
          titulo="Aceitos"
        />

        <Resumo
          numero={recusados}
          titulo="Recusados"
        />

        <div className="prof-orcamento-resumo-card destaque">
          <strong>
            {formatarDinheiro(valorAceito)}
          </strong>

          <span>
            Valor em propostas aceitas
          </span>
        </div>
      </section>

      <section className="prof-orcamentos-toolbar">
        <div className="prof-orcamentos-filtros">
          <Filtro
            ativo={filtro === "todos"}
            onClick={() =>
              setFiltro("todos")
            }
          >
            Todos
          </Filtro>

          <Filtro
            ativo={filtro === "pendente"}
            onClick={() =>
              setFiltro("pendente")
            }
          >
            Pendentes
          </Filtro>

          <Filtro
            ativo={filtro === "aceito"}
            onClick={() =>
              setFiltro("aceito")
            }
          >
            Aceitos
          </Filtro>

          <Filtro
            ativo={filtro === "recusado"}
            onClick={() =>
              setFiltro("recusado")
            }
          >
            Recusados
          </Filtro>
        </div>

        <button
          type="button"
          className="prof-orcamentos-atualizar"
          onClick={() => void carregar()}
          disabled={carregando}
        >
          ↻ Atualizar
        </button>
      </section>

      {mensagemSucesso && (
        <div
          role="status"
          style={{
            padding: "14px 18px",
            marginBottom: 18,
            background: "#102016",
            border: "1px solid #276749",
            borderRadius: 10,
            color: "#a7f3d0",
          }}
        >
          ✓ {mensagemSucesso}
        </div>
      )}

      {erro && (
        <div className="prof-erro-box">
          <strong>
            Não foi possível concluir a operação.
          </strong>

          <p>{erro}</p>

          <button
            type="button"
            onClick={() => void carregar()}
          >
            Tentar novamente
          </button>
        </div>
      )}

      {carregando && (
        <div className="prof-estado">
          <span>✦</span>

          <p>
            Carregando orçamentos...
          </p>
        </div>
      )}

      {!carregando &&
        !erro &&
        filtrados.length === 0 && (
          <div className="prof-servicos-vazio">
            <span>◇</span>

            <h2>
              Nenhum orçamento encontrado
            </h2>

            <p>
              As propostas enviadas aos seus
              clientes aparecerão aqui.
            </p>
          </div>
        )}

      {!carregando &&
        !erro &&
        filtrados.length > 0 && (
          <div className="prof-orcamentos-lista">
            {filtrados.map((orcamento) => (
              <OrcamentoCard
                key={orcamento.id}
                orcamento={orcamento}
                conclusao={
                  conclusoes[orcamento.id]
                }
                processando={
                  processandoId === orcamento.id
                }
                onMarcarConcluido={() =>
                  marcarConcluido(orcamento.id)
                }
              />
            ))}
          </div>
        )}
    </div>
  );
}

// ============================================
// RESUMO
// ============================================

function Resumo({
  numero,
  titulo,
}: {
  numero: number;
  titulo: string;
}) {
  return (
    <div className="prof-orcamento-resumo-card">
      <strong>{numero}</strong>
      <span>{titulo}</span>
    </div>
  );
}

// ============================================
// FILTRO
// ============================================

function Filtro({
  ativo,
  onClick,
  children,
}: {
  ativo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className={ativo ? "ativo" : ""}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

// ============================================
// CARD DO ORÇAMENTO
// ============================================

function OrcamentoCard({
  orcamento,
  conclusao,
  processando,
  onMarcarConcluido,
}: {
  orcamento: OrcamentoProfissional;
  conclusao?: ConclusaoServico;
  processando: boolean;
  onMarcarConcluido: () => void;
}) {
  const nomeServico =
    orcamento.servicos?.nome ||
    (orcamento.origem === "evento"
      ? "Proposta para evento"
      : "Serviço");

  const categoria =
    orcamento.servicos?.categorias?.nome;

  const icone =
    orcamento.servicos?.categorias?.icone ||
    "✦";

  const data =
    new Intl.DateTimeFormat("pt-BR").format(
      new Date(orcamento.criado_em)
    );

  const foiMarcado =
    Boolean(
      conclusao?.profissional_concluiu_em
    );

  const foiConfirmado =
    Boolean(
      conclusao?.cliente_confirmou_em
    );

  return (
    <article className="prof-orcamento-card">
      <div className="prof-orcamento-icone">
        {icone}
      </div>

      <div className="prof-orcamento-conteudo">
        <div className="prof-orcamento-topo">
          <div>
            <span>
              {categoria ||
                (orcamento.origem === "evento"
                  ? "Evento"
                  : "Proposta")}
            </span>

            <h3>
              {orcamento.titulo ||
                nomeServico}
            </h3>

            <small>{nomeServico}</small>
          </div>

          <Status
            status={orcamento.status}
          />
        </div>

        <p>{orcamento.descricao}</p>

        <div className="prof-orcamento-rodape">
          <strong>
            {formatarDinheiro(
              orcamento.valor
            )}
          </strong>

          <span>
            Enviado em {data}
          </span>

          {orcamento.validade && (
            <span>
              Validade:{" "}
              {formatarData(
                orcamento.validade
              )}
            </span>
          )}
        </div>

        {/* CONTROLE DE CONCLUSÃO */}

        {orcamento.status === "aceito" && (
          <div
            style={{
              marginTop: 18,
              paddingTop: 16,
              borderTop: "1px solid #242424",
            }}
          >
            {foiConfirmado ? (
              <div
                style={{
                  color: "#86efac",
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                ✓ Serviço concluído e confirmado
                pelo cliente
              </div>
            ) : foiMarcado ? (
              <div
                style={{
                  color: "#d6aa46",
                  fontSize: 14,
                }}
              >
                ◷ Serviço realizado — aguardando
                confirmação do cliente
              </div>
            ) : (
              <div>
                <p
                  style={{
                    color: "#a3a3a3",
                    fontSize: 13,
                    marginBottom: 12,
                  }}
                >
                  Quando finalizar o serviço,
                  informe a conclusão para que
                  o cliente possa confirmar.
                </p>

                <button
                  type="button"
                  onClick={onMarcarConcluido}
                  disabled={processando}
                  style={{
                    padding: "11px 18px",
                    borderRadius: 9,
                    border: "1px solid #d6aa46",
                    background: "#d6aa46",
                    color: "#090909",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: processando
                      ? "wait"
                      : "pointer",
                    opacity: processando
                      ? 0.6
                      : 1,
                  }}
                >
                  {processando
                    ? "Processando..."
                    : "✓ Marcar serviço como concluído"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

// ============================================
// STATUS
// ============================================

function Status({
  status,
}: {
  status: OrcamentoProfissional["status"];
}) {
  const nomes = {
    pendente: "Aguardando cliente",
    aceito: "Aceito",
    recusado: "Recusado",
    cancelado: "Cancelado",
    expirado: "Expirado",
  };

  return (
    <span
      className={`prof-orcamento-status prof-orcamento-${status}`}
    >
      {nomes[status]}
    </span>
  );
}

// ============================================
// FORMATAÇÕES
// ============================================

function formatarDinheiro(
  valor: number
) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(valor));
}

function formatarData(
  data: string
) {
  return new Intl.DateTimeFormat("pt-BR").format(
    new Date(`${data}T12:00:00`)
  );
}
