"use client";

import {
  use,
  useCallback,
  useEffect,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import {
  alterarVisibilidadeEvento,
  buscarEventoClientePorId,
  cancelarEvento,
} from "@/controllers/eventoController";

import type { Evento } from "@/models/Evento";

export default function EventoDetalhesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const router = useRouter();

  const [evento, setEvento] =
    useState<Evento | null>(null);

  const [carregando, setCarregando] =
    useState(true);

  const [processando, setProcessando] =
    useState(false);

  const [erro, setErro] = useState("");

  const [confirmarCancelamento, setConfirmarCancelamento] =
    useState(false);

  const carregar = useCallback(async () => {
    try {
      setCarregando(true);
      setErro("");

      const data =
        await buscarEventoClientePorId(id);

      if (!data) {
        setErro("Evento não encontrado.");
        return;
      }

      setEvento(data);
    } catch (error) {
      console.error(error);

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar o evento."
      );
    } finally {
      setCarregando(false);
    }
  }, [id]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function alterarVisibilidade() {
    if (!evento) return;

    try {
      setProcessando(true);
      setErro("");

      const atualizado =
        await alterarVisibilidadeEvento(
          evento.id,
          !evento.visivel_profissionais
        );

      setEvento(atualizado);
    } catch (error) {
      console.error(error);

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível alterar a visibilidade."
      );
    } finally {
      setProcessando(false);
    }
  }

  async function confirmarCancelar() {
    if (!evento) return;

    try {
      setProcessando(true);
      setErro("");

      const atualizado =
        await cancelarEvento(evento.id);

      setEvento(atualizado);
      setConfirmarCancelamento(false);
    } catch (error) {
      console.error(error);

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível cancelar o evento."
      );
    } finally {
      setProcessando(false);
    }
  }

  if (carregando) {
    return (
      <div className="cliente-evento-estado">
        <span>✦</span>
        <p>Carregando evento...</p>
      </div>
    );
  }

  if (!evento) {
    return (
      <div className="cliente-evento-estado">
        <span>◇</span>

        <h2>Evento não encontrado</h2>

        <p>{erro}</p>

        <button
          onClick={() =>
            router.push("/cliente/eventos")
          }
        >
          Voltar aos eventos
        </button>
      </div>
    );
  }

  const cancelado =
    evento.status === "cancelado";

  return (
    <div className="evento-detalhes-page">

      {/* VOLTAR */}

      <button
        className="cliente-proposta-voltar"
        onClick={() =>
          router.push("/cliente/eventos")
        }
      >
        ← Meus eventos
      </button>

      {/* CABEÇALHO */}

      <section className="evento-detalhes-header">
        <div>
          <div className="evento-detalhes-labels">
            <span className="dashboard-label">
              {evento.tipo_evento?.toUpperCase() ||
                "EVENTO"}
            </span>

            <StatusEvento
              status={evento.status}
            />
          </div>

          <h1>{evento.nome}</h1>

          {evento.tema && (
            <p className="evento-detalhes-tema">
              {evento.tema}
            </p>
          )}
        </div>

        {!cancelado && (
          <button
            className="evento-btn-editar"
            onClick={() =>
              router.push(
                `/cliente/eventos/${evento.id}/editar`
              )
            }
          >
            Editar evento
          </button>
        )}
      </section>

      {/* GRID */}

      <div className="evento-detalhes-grid">

        {/* CONTEÚDO PRINCIPAL */}

        <main className="evento-detalhes-principal">

          <section className="evento-detalhes-card">
            <div className="evento-card-titulo">
              <span>01</span>

              <div>
                <h2>Informações do evento</h2>
                <p>
                  Detalhes principais do seu
                  planejamento.
                </p>
              </div>
            </div>

            <div className="evento-info-grid">
              <Info
                titulo="Data"
                valor={
                  evento.data_evento
                    ? formatarData(
                        evento.data_evento
                      )
                    : "A definir"
                }
              />

              <Info
                titulo="Horário"
                valor={
                  evento.horario
                    ? evento.horario.slice(
                        0,
                        5
                      )
                    : "A definir"
                }
              />

              <Info
                titulo="Convidados"
                valor={
                  evento.quantidade_convidados !=
                  null
                    ? `${evento.quantidade_convidados} pessoas`
                    : "A definir"
                }
              />

              <Info
                titulo="Tipo"
                valor={
                  evento.tipo_evento ||
                  "Não informado"
                }
              />
            </div>
          </section>

          {/* LOCAL */}

          <section className="evento-detalhes-card">
            <div className="evento-card-titulo">
              <span>02</span>

              <div>
                <h2>Local</h2>
                <p>
                  Onde o evento acontecerá.
                </p>
              </div>
            </div>

            <div className="evento-local">
              <strong>
                {evento.cidade
                  ? `${evento.cidade}${
                      evento.estado
                        ? ` - ${evento.estado}`
                        : ""
                    }`
                  : "Local ainda não definido"}
              </strong>

              {evento.endereco && (
                <p>{evento.endereco}</p>
              )}
            </div>
          </section>

          {/* DESCRIÇÃO */}

          <section className="evento-detalhes-card">
            <div className="evento-card-titulo">
              <span>03</span>

              <div>
                <h2>Sobre o evento</h2>
                <p>
                  Informações compartilhadas com
                  os profissionais.
                </p>
              </div>
            </div>

            <div className="evento-descricao">
              {evento.descricao ||
                "Nenhuma descrição foi adicionada."}
            </div>
          </section>
        </main>

        {/* COLUNA LATERAL */}

        <aside className="evento-detalhes-lateral">

          {/* ORÇAMENTO */}

          <section className="evento-orcamento-card">
            <span>ORÇAMENTO DO EVENTO</span>

            <strong>
              {evento.orcamento_total != null
                ? formatarDinheiro(
                    evento.orcamento_total
                  )
                : "A definir"}
            </strong>

            <p>
              Valor planejado para os serviços
              do evento.
            </p>

            <button
              onClick={() =>
                router.push(
                  `/cliente/orcamentos?evento=${evento.id}`
                )
              }
            >
              Ver propostas recebidas →
            </button>
          </section>

          {/* VISIBILIDADE */}

          <section className="evento-visibilidade-card">
            <div className="evento-visibilidade-topo">
              <span className="dashboard-label">
                VISIBILIDADE
              </span>

              <span
                className={
                  evento.visivel_profissionais
                    ? "evento-online"
                    : "evento-offline"
                }
              >
                {evento.visivel_profissionais
                  ? "● Público"
                  : "○ Privado"}
              </span>
            </div>

            <h3>
              {evento.visivel_profissionais
                ? "Profissionais podem encontrar seu evento"
                : "Seu evento está privado"}
            </h3>

            <p>
              {evento.visivel_profissionais
                ? "Seu evento aparece para profissionais que procuram novas oportunidades."
                : "Enquanto estiver privado, somente você poderá visualizar este evento."}
            </p>

            {!cancelado && (
              <button
                className={
                  evento.visivel_profissionais
                    ? "evento-btn-ocultar"
                    : "evento-btn-publicar"
                }
                onClick={alterarVisibilidade}
                disabled={processando}
              >
                {processando
                  ? "Processando..."
                  : evento.visivel_profissionais
                    ? "Ocultar dos profissionais"
                    : "Publicar para profissionais"}
              </button>
            )}
          </section>

          {/* AÇÕES */}

          {!cancelado && (
            <section className="evento-acoes-card">
              <span className="dashboard-label">
                AÇÕES
              </span>

              <button
                className="evento-btn-cancelar"
                onClick={() =>
                  setConfirmarCancelamento(
                    true
                  )
                }
              >
                Cancelar evento
              </button>
            </section>
          )}

          {cancelado && (
            <section className="evento-cancelado-card">
              <span>×</span>

              <div>
                <strong>
                  Evento cancelado
                </strong>

                <p>
                  Este evento não está mais
                  disponível para profissionais.
                </p>
              </div>
            </section>
          )}
        </aside>
      </div>

      {erro && (
        <div className="cliente-proposta-erro">
          {erro}
        </div>
      )}

      {/* MODAL CANCELAR */}

      {confirmarCancelamento && (
        <div
          className="cliente-confirmacao-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
                event.currentTarget &&
              !processando
            ) {
              setConfirmarCancelamento(
                false
              );
            }
          }}
        >
          <div className="cliente-confirmacao-modal">
            <span className="dashboard-label">
              CANCELAR EVENTO
            </span>

            <h2>
              Cancelar {evento.nome}?
            </h2>

            <p>
              O evento deixará de aparecer para
              profissionais e será marcado como
              cancelado.
            </p>

            <div className="cliente-confirmacao-acoes">
              <button
                type="button"
                onClick={() =>
                  setConfirmarCancelamento(
                    false
                  )
                }
                disabled={processando}
              >
                Voltar
              </button>

              <button
                type="button"
                className="confirmar-recusa"
                onClick={confirmarCancelar}
                disabled={processando}
              >
                {processando
                  ? "Cancelando..."
                  : "Sim, cancelar evento"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   COMPONENTES
========================================================= */

function Info({
  titulo,
  valor,
}: {
  titulo: string;
  valor: string;
}) {
  return (
    <div className="evento-info-item">
      <span>{titulo}</span>
      <strong>{valor}</strong>
    </div>
  );
}

function StatusEvento({
  status,
}: {
  status: Evento["status"];
}) {
  const nomes = {
    rascunho: "Rascunho",
    publicado: "Publicado",
    em_planejamento:
      "Em planejamento",
    confirmado: "Confirmado",
    finalizado: "Finalizado",
    cancelado: "Cancelado",
  };

  return (
    <span
      className={`cliente-evento-status evento-${status}`}
    >
      {nomes[status]}
    </span>
  );
}

function formatarData(data: string) {
  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      dateStyle: "long",
    }
  ).format(
    new Date(`${data}T12:00:00`)
  );
}

function formatarDinheiro(
  valor: number
) {
  return new Intl.NumberFormat(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    }
  ).format(Number(valor));
}