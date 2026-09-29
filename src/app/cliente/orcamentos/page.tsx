"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import {
  listarOrcamentosCliente,
  OrcamentoCliente,
} from "@/controllers/orcamentoController";

type FiltroStatus =
  | "todos"
  | "pendente"
  | "aceito"
  | "recusado";

type FiltroOrigem =
  | "todos"
  | "servicos"
  | "eventos";

export default function OrcamentosClientePage() {
  const router = useRouter();

  const [orcamentos, setOrcamentos] =
    useState<OrcamentoCliente[]>([]);

  const [carregando, setCarregando] =
    useState(true);

  const [erro, setErro] =
    useState("");

  const [filtroStatus, setFiltroStatus] =
    useState<FiltroStatus>("todos");

  const [filtroOrigem, setFiltroOrigem] =
    useState<FiltroOrigem>("todos");

  /* =======================================================
     CARREGAR
  ======================================================= */

  const carregar = useCallback(async () => {
    try {
      setCarregando(true);
      setErro("");

      const data =
        await listarOrcamentosCliente();

      setOrcamentos(data);
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
    carregar();
  }, [carregar]);

  /* =======================================================
     FILTROS
  ======================================================= */

  const filtrados = orcamentos.filter(
    (orcamento) => {
      const statusCorreto =
        filtroStatus === "todos" ||
        orcamento.status === filtroStatus;

      const origemCorreta =
        filtroOrigem === "todos" ||
        (filtroOrigem === "eventos" &&
          orcamento.origem === "evento") ||
        (filtroOrigem === "servicos" &&
          orcamento.origem !== "evento");

      return (
        statusCorreto &&
        origemCorreta
      );
    }
  );

  /* =======================================================
     CONTADORES
  ======================================================= */

  const pendentes =
    orcamentos.filter(
      (item) =>
        item.status === "pendente"
    ).length;

  const aceitos =
    orcamentos.filter(
      (item) =>
        item.status === "aceito"
    ).length;

  const propostasEventos =
    orcamentos.filter(
      (item) =>
        item.origem === "evento"
    ).length;

  /* =======================================================
     PÁGINA
  ======================================================= */

  return (
    <div className="cliente-orcamentos-page">

      {/* CABEÇALHO */}

      <section className="cliente-orcamentos-header">
        <div>
          <span className="dashboard-label">
            PROPOSTAS
          </span>

          <h1>Meus orçamentos</h1>

          <p>
            Consulte propostas de serviços
            e propostas recebidas para seus
            eventos.
          </p>
        </div>
      </section>

      {/* RESUMO */}

      <section className="cliente-orcamentos-resumo">
        <Resumo
          numero={orcamentos.length}
          titulo="Recebidos"
        />

        <Resumo
          numero={pendentes}
          titulo="Aguardando decisão"
        />

        <Resumo
          numero={aceitos}
          titulo="Aceitos"
        />

        <Resumo
          numero={propostasEventos}
          titulo="Para eventos"
        />
      </section>

      {/* ===================================================
          FILTRO POR ORIGEM
      =================================================== */}

      <div className="cliente-orcamentos-origens">
        <span>Mostrar:</span>

        <button
          className={
            filtroOrigem === "todos"
              ? "ativo"
              : ""
          }
          onClick={() =>
            setFiltroOrigem("todos")
          }
        >
          Todos
        </button>

        <button
          className={
            filtroOrigem === "servicos"
              ? "ativo"
              : ""
          }
          onClick={() =>
            setFiltroOrigem("servicos")
          }
        >
          Serviços
        </button>

        <button
          className={
            filtroOrigem === "eventos"
              ? "ativo"
              : ""
          }
          onClick={() =>
            setFiltroOrigem("eventos")
          }
        >
          Eventos
        </button>
      </div>

      {/* ===================================================
          FILTRO POR STATUS
      =================================================== */}

      <div className="cliente-orcamentos-toolbar">
        <div className="cliente-orcamentos-filtros">

          <button
            className={
              filtroStatus === "todos"
                ? "ativo"
                : ""
            }
            onClick={() =>
              setFiltroStatus("todos")
            }
          >
            Todos
          </button>

          <button
            className={
              filtroStatus === "pendente"
                ? "ativo"
                : ""
            }
            onClick={() =>
              setFiltroStatus("pendente")
            }
          >
            Pendentes
          </button>

          <button
            className={
              filtroStatus === "aceito"
                ? "ativo"
                : ""
            }
            onClick={() =>
              setFiltroStatus("aceito")
            }
          >
            Aceitos
          </button>

          <button
            className={
              filtroStatus === "recusado"
                ? "ativo"
                : ""
            }
            onClick={() =>
              setFiltroStatus("recusado")
            }
          >
            Recusados
          </button>
        </div>

        <button
          className="cliente-orcamentos-atualizar"
          onClick={carregar}
          disabled={carregando}
        >
          ↻ Atualizar
        </button>
      </div>

      {/* ERRO */}

      {erro && (
        <div className="cliente-orcamentos-erro">
          <strong>
            Não foi possível carregar.
          </strong>

          <p>{erro}</p>

          <button onClick={carregar}>
            Tentar novamente
          </button>
        </div>
      )}

      {/* CARREGANDO */}

      {carregando && (
        <div className="cliente-orcamentos-estado">
          <span>✦</span>

          <p>
            Carregando propostas...
          </p>
        </div>
      )}

      {/* VAZIO */}

      {!carregando &&
        !erro &&
        filtrados.length === 0 && (
          <div className="cliente-orcamentos-vazio">
            <span>◇</span>

            <h2>
              Nenhum orçamento encontrado
            </h2>

            <p>
              Não existem propostas que
              correspondam aos filtros
              selecionados.
            </p>
          </div>
        )}

      {/* LISTA */}

      {!carregando &&
        !erro &&
        filtrados.length > 0 && (
          <div className="cliente-orcamentos-lista">
            {filtrados.map(
              (orcamento) => (
                <OrcamentoCard
                  key={orcamento.id}
                  orcamento={orcamento}
                  onAbrir={() =>
                    router.push(
                      `/cliente/orcamentos/${orcamento.id}`
                    )
                  }
                />
              )
            )}
          </div>
        )}
    </div>
  );
}

/* =========================================================
   RESUMO
========================================================= */

function Resumo({
  numero,
  titulo,
}: {
  numero: number;
  titulo: string;
}) {
  return (
    <div className="cliente-orcamento-resumo-card">
      <strong>{numero}</strong>
      <span>{titulo}</span>
    </div>
  );
}

/* =========================================================
   CARD
========================================================= */

function OrcamentoCard({
  orcamento,
  onAbrir,
}: {
  orcamento: OrcamentoCliente;
  onAbrir: () => void;
}) {
  const ehEvento =
    orcamento.origem === "evento";

  const valor =
    new Intl.NumberFormat(
      "pt-BR",
      {
        style: "currency",
        currency: "BRL",
      }
    ).format(
      Number(orcamento.valor)
    );

  const data =
    new Intl.DateTimeFormat(
      "pt-BR"
    ).format(
      new Date(
        orcamento.criado_em
      )
    );

  return (
    <article className="cliente-orcamento-card">

      {/* ÍCONE */}

      <div className="cliente-orcamento-icone">
        {ehEvento
          ? "◇"
          : orcamento.servicos
              ?.categorias_servico
              ?.icone || "✦"}
      </div>

      {/* CONTEÚDO */}

      <div className="cliente-orcamento-conteudo">

        <div className="cliente-orcamento-topo">
          <div>

            {/* PROFISSIONAL */}

            <span>
              {orcamento.profissionais
                ?.nome_empresa ||
                "Profissional Celebra"}
            </span>

            <h3>
              {orcamento.titulo ||
                (ehEvento
                  ? orcamento.eventos
                      ?.nome
                  : orcamento.servicos
                      ?.nome) ||
                "Proposta comercial"}
            </h3>

          </div>

          <Status
            status={
              orcamento.status
            }
          />
        </div>

        {/* ORIGEM */}

        <div className="cliente-orcamento-origem">
          {ehEvento ? (
            <>
              <span className="cliente-origem-evento">
                EVENTO
              </span>

              <strong>
                {orcamento.eventos
                  ?.nome ||
                  "Evento"}
              </strong>
            </>
          ) : (
            <>
              <span className="cliente-origem-servico">
                SERVIÇO
              </span>

              <strong>
                {orcamento.servicos
                  ?.nome ||
                  "Serviço"}
              </strong>
            </>
          )}
        </div>

        {/* DESCRIÇÃO */}

        <p>
          {orcamento.descricao}
        </p>

        {/* EVENTO */}

        {ehEvento &&
          orcamento.eventos && (
            <div className="cliente-orcamento-evento-info">

              {orcamento.eventos
                .data_evento && (
                <span>
                  ◷{" "}
                  {formatarDataEvento(
                    orcamento.eventos
                      .data_evento
                  )}
                </span>
              )}

              {orcamento.eventos
                .cidade && (
                <span>
                  ◇{" "}
                  {
                    orcamento.eventos
                      .cidade
                  }

                  {orcamento.eventos
                    .estado
                    ? ` - ${orcamento.eventos.estado}`
                    : ""}
                </span>
              )}
            </div>
          )}

        {/* RODAPÉ */}

        <div className="cliente-orcamento-rodape">
          <strong>{valor}</strong>

          <span>
            Recebido em {data}
          </span>
        </div>
      </div>

      <button onClick={onAbrir}>
        Ver proposta →
      </button>
    </article>
  );
}

/* =========================================================
   STATUS
========================================================= */

function Status({
  status,
}: {
  status:
    OrcamentoCliente["status"];
}) {
  const nomes = {
    pendente: "Pendente",
    aceito: "Aceito",
    recusado: "Recusado",
    cancelado: "Cancelado",
    expirado: "Expirado",
  };

  return (
    <span
      className={`cliente-orcamento-status cliente-status-${status}`}
    >
      {nomes[status]}
    </span>
  );
}

/* =========================================================
   FORMATAR DATA DO EVENTO
========================================================= */

function formatarDataEvento(
  data: string
) {
  return new Intl.DateTimeFormat(
    "pt-BR"
  ).format(
    new Date(
      `${data}T12:00:00`
    )
  );
}