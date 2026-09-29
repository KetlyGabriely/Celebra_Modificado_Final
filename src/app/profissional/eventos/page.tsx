"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import {
  listarEventosPublicos,
} from "@/controllers/eventoController";

import type {
  Evento,
} from "@/models/Evento";

export default function ExplorarEventosPage() {
  const router = useRouter();

  const [eventos, setEventos] =
    useState<Evento[]>([]);

  const [carregando, setCarregando] =
    useState(true);

  const [erro, setErro] =
    useState("");

  const [busca, setBusca] =
    useState("");

  const carregar = useCallback(async () => {
    try {
      setCarregando(true);
      setErro("");

      const data =
        await listarEventosPublicos();

      setEventos(data);
    } catch (error) {
      console.error(error);

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar os eventos."
      );
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const eventosFiltrados = useMemo(() => {
    const termo = busca
      .trim()
      .toLowerCase();

    if (!termo) {
      return eventos;
    }

    return eventos.filter((evento) => {
      const campos = [
        evento.nome,
        evento.tipo_evento,
        evento.tema,
        evento.cidade,
        evento.estado,
      ];

      return campos.some((campo) =>
        campo
          ?.toLowerCase()
          .includes(termo)
      );
    });
  }, [eventos, busca]);

  return (
    <div className="prof-eventos-page">

      {/* CABEÇALHO */}

      <section className="prof-eventos-header">
        <div>
          <span className="prof-dashboard-label">
            OPORTUNIDADES
          </span>

          <h1>Explorar eventos</h1>

          <p>
            Encontre clientes planejando
            eventos e envie propostas para
            novas oportunidades.
          </p>
        </div>

        <div className="prof-eventos-contador">
          <strong>{eventos.length}</strong>

          <span>
            eventos disponíveis
          </span>
        </div>
      </section>

      {/* BUSCA */}

      <section className="prof-eventos-toolbar">
        <div className="prof-eventos-busca">
          <span>⌕</span>

          <input
            value={busca}
            onChange={(event) =>
              setBusca(
                event.target.value
              )
            }
            placeholder="Buscar por evento, tipo ou cidade..."
          />
        </div>

        <button
          onClick={carregar}
          disabled={carregando}
        >
          ↻ Atualizar
        </button>
      </section>

      {/* ERRO */}

      {erro && (
        <div className="prof-erro-box">
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
        <div className="prof-estado">
          <span>✦</span>

          <p>
            Procurando oportunidades...
          </p>
        </div>
      )}

      {/* VAZIO */}

      {!carregando &&
        !erro &&
        eventosFiltrados.length === 0 && (
          <div className="prof-eventos-vazio">
            <span>◇</span>

            <h2>
              {busca
                ? "Nenhum evento encontrado"
                : "Nenhuma oportunidade no momento"}
            </h2>

            <p>
              {busca
                ? "Tente pesquisar usando outro termo."
                : "Novos eventos publicados pelos clientes aparecerão aqui."}
            </p>
          </div>
        )}

      {/* EVENTOS */}

      {!carregando &&
        !erro &&
        eventosFiltrados.length > 0 && (
          <div className="prof-eventos-grid">
            {eventosFiltrados.map(
              (evento) => (
                <EventoCard
                  key={evento.id}
                  evento={evento}
                  onAbrir={() =>
                    router.push(
                      `/profissional/eventos/${evento.id}`
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
   CARD
========================================================= */

function EventoCard({
  evento,
  onAbrir,
}: {
  evento: Evento;
  onAbrir: () => void;
}) {
  return (
    <article className="prof-evento-card">
      <div className="prof-evento-card-topo">
        <span>
          {evento.tipo_evento ||
            "Evento"}
        </span>

        <span className="prof-evento-disponivel">
          ● Oportunidade
        </span>
      </div>

      <h2>{evento.nome}</h2>

      {evento.tema && (
        <p className="prof-evento-tema">
          {evento.tema}
        </p>
      )}

      {evento.descricao && (
        <p className="prof-evento-descricao">
          {evento.descricao}
        </p>
      )}

      <div className="prof-evento-info-grid">
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

        <Info
          titulo="Convidados"
          valor={
            evento.quantidade_convidados !=
            null
              ? `${evento.quantidade_convidados}`
              : "A definir"
          }
        />
      </div>

      <div className="prof-evento-card-rodape">
        <div>
          <span>
            ORÇAMENTO DO EVENTO
          </span>

          <strong>
            {evento.orcamento_total != null
              ? formatarDinheiro(
                  evento.orcamento_total
                )
              : "Não informado"}
          </strong>
        </div>

        <button onClick={onAbrir}>
          Ver oportunidade →
        </button>
      </div>
    </article>
  );
}

function Info({
  titulo,
  valor,
}: {
  titulo: string;
  valor: string;
}) {
  return (
    <div className="prof-evento-info">
      <span>{titulo}</span>
      <strong>{valor}</strong>
    </div>
  );
}

function formatarData(
  data: string
) {
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