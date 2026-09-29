"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import {
  listarEventosCliente,
} from "@/controllers/eventoController";

import type {
  Evento,
} from "@/models/Evento";

export default function EventosClientePage() {
  const router = useRouter();

  const [eventos, setEventos] =
    useState<Evento[]>([]);

  const [carregando, setCarregando] =
    useState(true);

  const [erro, setErro] =
    useState("");

  const carregar = useCallback(
    async () => {
      try {
        setCarregando(true);
        setErro("");

        const data =
          await listarEventosCliente();

        setEventos(data);
      } catch (error) {
        console.error(error);

        setErro(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar seus eventos."
        );
      } finally {
        setCarregando(false);
      }
    },
    []
  );

  useEffect(() => {
    carregar();
  }, [carregar]);

  return (
    <div className="cliente-eventos-page">
      <section className="cliente-eventos-header">
        <div>
          <span className="dashboard-label">
            SEUS MOMENTOS
          </span>

          <h1>Meus eventos</h1>

          <p>
            Organize seus eventos e receba
            propostas de profissionais.
          </p>
        </div>

        <button
          onClick={() =>
            router.push(
              "/cliente/eventos/novo"
            )
          }
        >
          + Criar evento
        </button>
      </section>

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

      {carregando && (
        <div className="cliente-orcamentos-estado">
          <span>✦</span>
          <p>Carregando eventos...</p>
        </div>
      )}

      {!carregando &&
        !erro &&
        eventos.length === 0 && (
          <div className="cliente-eventos-vazio">
            <span>◇</span>

            <h2>
              Seu próximo momento começa aqui.
            </h2>

            <p>
              Crie seu primeiro evento para
              começar a organizar tudo em um
              só lugar.
            </p>

            <button
              onClick={() =>
                router.push(
                  "/cliente/eventos/novo"
                )
              }
            >
              Criar meu primeiro evento
            </button>
          </div>
        )}

      {!carregando &&
        !erro &&
        eventos.length > 0 && (
          <div className="cliente-eventos-grid">
            {eventos.map((evento) => (
              <EventoCard
                key={evento.id}
                evento={evento}
                onAbrir={() =>
                  router.push(
                    `/cliente/eventos/${evento.id}`
                  )
                }
              />
            ))}
          </div>
        )}
    </div>
  );
}

function EventoCard({
  evento,
  onAbrir,
}: {
  evento: Evento;
  onAbrir: () => void;
}) {
  return (
    <article className="cliente-evento-card">
      <div className="cliente-evento-card-topo">
        <span>
          {evento.tipo_evento ||
            "Evento"}
        </span>

        <StatusEvento
          status={evento.status}
        />
      </div>

      <h2>{evento.nome}</h2>

      {evento.tema && (
        <p className="cliente-evento-tema">
          {evento.tema}
        </p>
      )}

      <div className="cliente-evento-dados">
        <EventoInfo
          titulo="Data"
          valor={
            evento.data_evento
              ? formatarData(
                  evento.data_evento
                )
              : "A definir"
          }
        />

        <EventoInfo
          titulo="Local"
          valor={
            evento.cidade
              ? `${evento.cidade}${
                  evento.estado
                    ? ` - ${evento.estado}`
                    : ""
                }`
              : "A definir"
          }
        />

        <EventoInfo
          titulo="Convidados"
          valor={
            evento.quantidade_convidados !=
            null
              ? String(
                  evento.quantidade_convidados
                )
              : "A definir"
          }
        />
      </div>

      {evento.orcamento_total != null && (
        <div className="cliente-evento-orcamento">
          <span>
            Orçamento disponível
          </span>

          <strong>
            {formatarDinheiro(
              evento.orcamento_total
            )}
          </strong>
        </div>
      )}

      <div className="cliente-evento-card-rodape">
        <span>
          {evento.visivel_profissionais
            ? "Visível para profissionais"
            : "Evento privado"}
        </span>

        <button onClick={onAbrir}>
          Gerenciar →
        </button>
      </div>
    </article>
  );
}

function EventoInfo({
  titulo,
  valor,
}: {
  titulo: string;
  valor: string;
}) {
  return (
    <div>
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
    "pt-BR"
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