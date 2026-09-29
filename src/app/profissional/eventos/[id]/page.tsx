"use client";

import {
  use,
  useEffect,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import {
  buscarEventoPublicoPorId,
  EventoServicoPublico,
  listarServicosEventoPublico,
} from "@/controllers/eventoController";

import type {
  Evento,
} from "@/models/Evento";

export default function EventoProfissionalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const router = useRouter();

  const [evento, setEvento] =
    useState<Evento | null>(null);

  const [servicos, setServicos] =
    useState<EventoServicoPublico[]>([]);

  const [carregando, setCarregando] =
    useState(true);

  const [erro, setErro] =
    useState("");

  /* =========================================================
     CARREGAR EVENTO + SERVIÇOS
  ========================================================= */

  useEffect(() => {
    async function carregar() {
      try {
        setCarregando(true);
        setErro("");

        const [
          eventoData,
          servicosData,
        ] = await Promise.all([
          buscarEventoPublicoPorId(id),

          listarServicosEventoPublico(id),
        ]);

        if (!eventoData) {
          setErro(
            "Este evento não está mais disponível."
          );

          return;
        }

        setEvento(eventoData);
        setServicos(servicosData);
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
    }

    carregar();
  }, [id]);

  /* =========================================================
     CARREGANDO
  ========================================================= */

  if (carregando) {
    return (
      <div className="prof-estado">
        <span>✦</span>

        <p>
          Carregando oportunidade...
        </p>
      </div>
    );
  }

  /* =========================================================
     EVENTO INDISPONÍVEL
  ========================================================= */

  if (!evento) {
    return (
      <div className="prof-eventos-vazio">
        <span>◇</span>

        <h2>
          Evento indisponível
        </h2>

        <p>{erro}</p>

        <button
          onClick={() =>
            router.push(
              "/profissional/eventos"
            )
          }
        >
          Voltar às oportunidades
        </button>
      </div>
    );
  }

  /* =========================================================
     PÁGINA
  ========================================================= */

  return (
    <div className="prof-evento-detalhe-page">

      {/* VOLTAR */}

      <button
        className="detalhe-interesse-voltar"
        onClick={() =>
          router.push(
            "/profissional/eventos"
          )
        }
      >
        ← Explorar eventos
      </button>

      {/* =====================================================
          CABEÇALHO
      ===================================================== */}

      <section className="prof-evento-detalhe-header">

        <div>
          <div className="prof-evento-detalhe-labels">

            <span className="prof-dashboard-label">
              OPORTUNIDADE
            </span>

            <span className="prof-evento-disponivel">
              ● Disponível
            </span>

          </div>

          <h1>
            {evento.nome}
          </h1>

          <p>
            {evento.tipo_evento ||
              "Evento"}

            {evento.tema
              ? ` · ${evento.tema}`
              : ""}
          </p>
        </div>

      </section>

      <div className="prof-evento-detalhe-grid">

        {/* ===================================================
            ESQUERDA
        =================================================== */}

        <main className="prof-evento-detalhe-principal">

          {/* SOBRE */}

          <section className="prof-evento-detalhe-card">

            <TituloSecao
              numero="01"
              titulo="Sobre o evento"
              descricao="Informações fornecidas pelo cliente."
            />

            <div className="prof-evento-texto">
              {evento.descricao ||
                "O cliente não adicionou uma descrição."}
            </div>

          </section>

          {/* INFORMAÇÕES */}

          <section className="prof-evento-detalhe-card">

            <TituloSecao
              numero="02"
              titulo="Informações"
              descricao="Dados para avaliar a oportunidade."
            />

            <div className="prof-evento-detalhes-info">

              <InfoDetalhe
                titulo="Data"
                valor={
                  evento.data_evento
                    ? formatarDataLonga(
                        evento.data_evento
                      )
                    : "A definir"
                }
              />

              <InfoDetalhe
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

              <InfoDetalhe
                titulo="Convidados"
                valor={
                  evento.quantidade_convidados !=
                  null
                    ? `${evento.quantidade_convidados} pessoas`
                    : "A definir"
                }
              />

              <InfoDetalhe
                titulo="Tipo"
                valor={
                  evento.tipo_evento ||
                  "Não informado"
                }
              />

            </div>

          </section>

          {/* LOCAL */}

          <section className="prof-evento-detalhe-card">

            <TituloSecao
              numero="03"
              titulo="Local"
              descricao="Localização planejada para o evento."
            />

            <div className="prof-evento-local">

              <strong>
                {evento.cidade
                  ? `${evento.cidade}${
                      evento.estado
                        ? ` - ${evento.estado}`
                        : ""
                    }`
                  : "Local a definir"}
              </strong>

              {evento.endereco && (
                <p>
                  {evento.endereco}
                </p>
              )}

            </div>

          </section>

          {/* =================================================
              SERVIÇOS PROCURADOS
          ================================================= */}

          <section className="prof-evento-detalhe-card">

            <TituloSecao
              numero="04"
              titulo="Serviços procurados"
              descricao="Escolha uma categoria para enviar sua proposta."
            />

            {servicos.length === 0 ? (
              <div className="prof-evento-servicos-vazio">

                <span>◇</span>

                <strong>
                  Nenhum serviço disponível
                </strong>

                <p>
                  O cliente ainda não possui
                  categorias abertas para
                  receber propostas.
                </p>

              </div>
            ) : (
              <div className="prof-evento-servicos-lista">

                {servicos.map(
                  (servico) => (
                    <article
                      key={servico.id}
                      className="prof-evento-servico-card"
                    >

                      <div className="prof-evento-servico-topo">

                        <div className="prof-evento-servico-identidade">

                          <span className="prof-evento-servico-icone">
                            {servico.categorias
                              ?.icone ||
                              "✦"}
                          </span>

                          <div>
                            <span>
                              SERVIÇO PROCURADO
                            </span>

                            <h3>
                              {servico.categorias
                                ?.nome ||
                                "Serviço"}
                            </h3>
                          </div>

                        </div>

                        <span className="prof-evento-servico-status">
                          ● Recebendo propostas
                        </span>

                      </div>

                      {servico.observacoes && (
                        <p className="prof-evento-servico-observacoes">
                          {servico.observacoes}
                        </p>
                      )}

                      <div className="prof-evento-servico-rodape">

                        <div>
                          <span>
                            ORÇAMENTO PLANEJADO
                          </span>

                          <strong>
                            {servico.orcamento_planejado !=
                            null
                              ? formatarDinheiro(
                                  servico.orcamento_planejado
                                )
                              : "Não informado"}
                          </strong>
                        </div>

                        <button
                          onClick={() =>
                            router.push(
                              `/profissional/eventos/${evento.id}/proposta?servico=${servico.id}`
                            )
                          }
                        >
                          Enviar proposta →
                        </button>

                      </div>

                    </article>
                  )
                )}

              </div>
            )}

          </section>

        </main>

        {/* ===================================================
            DIREITA
        =================================================== */}

        <aside className="prof-evento-detalhe-lateral">

          {/* ORÇAMENTO GERAL */}

          <section className="prof-evento-oportunidade-card">

            <span>
              ORÇAMENTO TOTAL DO EVENTO
            </span>

            <strong>
              {evento.orcamento_total != null
                ? formatarDinheiro(
                    evento.orcamento_total
                  )
                : "Não informado"}
            </strong>

            <p>
              O orçamento total representa o
              planejamento geral do cliente.
              Consulte cada serviço para ver o
              valor reservado para a categoria.
            </p>

          </section>

          {/* QUANTIDADE DE CATEGORIAS */}

          <section className="prof-evento-aviso">

            <span>✦</span>

            <div>
              <strong>
                {servicos.length}{" "}
                {servicos.length === 1
                  ? "serviço disponível"
                  : "serviços disponíveis"}
              </strong>

              <p>
                Envie sua proposta para a
                categoria em que você deseja
                participar.
              </p>
            </div>

          </section>

        </aside>

      </div>
    </div>
  );
}

/* =========================================================
   TÍTULO
========================================================= */

function TituloSecao({
  numero,
  titulo,
  descricao,
}: {
  numero: string;
  titulo: string;
  descricao: string;
}) {
  return (
    <div className="prof-evento-secao-titulo">

      <span>{numero}</span>

      <div>
        <h2>{titulo}</h2>

        <p>{descricao}</p>
      </div>

    </div>
  );
}

/* =========================================================
   INFORMAÇÃO
========================================================= */

function InfoDetalhe({
  titulo,
  valor,
}: {
  titulo: string;
  valor: string;
}) {
  return (
    <div className="prof-evento-detalhe-info">
      <span>{titulo}</span>
      <strong>{valor}</strong>
    </div>
  );
}

/* =========================================================
   DATA
========================================================= */

function formatarDataLonga(
  data: string
) {
  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      dateStyle: "long",
    }
  ).format(
    new Date(
      `${data}T12:00:00`
    )
  );
}

/* =========================================================
   DINHEIRO
========================================================= */

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