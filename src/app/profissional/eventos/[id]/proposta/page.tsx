"use client";

import {
  FormEvent,
  use,
  useEffect,
  useState,
} from "react";

import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import {
  buscarEventoPublicoPorId,
  enviarPropostaEvento,
  EventoServicoPublico,
  listarServicosEventoPublico,
} from "@/controllers/eventoController";

import type {
  Evento,
} from "@/models/Evento";

export default function PropostaEventoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const router = useRouter();
  const searchParams =
    useSearchParams();

  const eventoServicoId =
    searchParams.get("servico");

  const [evento, setEvento] =
    useState<Evento | null>(null);

  const [
    eventoServico,
    setEventoServico,
  ] =
    useState<EventoServicoPublico | null>(
      null
    );

  const [titulo, setTitulo] =
    useState("");

  const [descricao, setDescricao] =
    useState("");

  const [valor, setValor] =
    useState("");

  const [validade, setValidade] =
    useState("");

  const [carregando, setCarregando] =
    useState(true);

  const [enviando, setEnviando] =
    useState(false);

  const [erro, setErro] =
    useState("");

  const [sucesso, setSucesso] =
    useState(false);

  /* =======================================================
     CARREGAR EVENTO + CATEGORIA
  ======================================================= */

  useEffect(() => {
    async function carregar() {
      try {
        setCarregando(true);
        setErro("");

        if (!eventoServicoId) {
          setErro(
            "Nenhum serviço foi selecionado para esta proposta."
          );

          return;
        }

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

        const servicoSelecionado =
          servicosData.find(
            (item) =>
              item.id ===
              eventoServicoId
          );

        if (!servicoSelecionado) {
          setErro(
            "Este serviço não está disponível para o seu perfil."
          );

          return;
        }

        setEvento(eventoData);

        setEventoServico(
          servicoSelecionado
        );

        const categoria =
          servicoSelecionado
            .categorias?.nome ||
          "serviço";

        setTitulo(
          `Proposta de ${categoria}`
        );
      } catch (error) {
        console.error(error);

        setErro(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar a oportunidade."
        );
      } finally {
        setCarregando(false);
      }
    }

    carregar();
  }, [id, eventoServicoId]);

  /* =======================================================
     ENVIAR
  ======================================================= */

  async function enviar(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      !evento ||
      !eventoServico
    ) {
      return;
    }

    if (!titulo.trim()) {
      setErro(
        "Informe o título da proposta."
      );

      return;
    }

    if (!descricao.trim()) {
      setErro(
        "Descreva sua proposta."
      );

      return;
    }

    const valorConvertido =
      Number(
        valor
          .replace(/\./g, "")
          .replace(",", ".")
      );

    if (
      !valor.trim() ||
      Number.isNaN(
        valorConvertido
      ) ||
      valorConvertido <= 0
    ) {
      setErro(
        "Informe um valor válido."
      );

      return;
    }

    try {
      setEnviando(true);
      setErro("");

      await enviarPropostaEvento({
        evento_id:
          evento.id,

        evento_servico_id:
          eventoServico.id,

        titulo,

        descricao,

        valor:
          valorConvertido,

        validade:
          validade || null,
      });

      setSucesso(true);
    } catch (error) {
      console.error(error);

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível enviar a proposta."
      );
    } finally {
      setEnviando(false);
    }
  }

  /* =======================================================
     CARREGANDO
  ======================================================= */

  if (carregando) {
    return (
      <div className="prof-estado">
        <span>✦</span>

        <p>
          Preparando proposta...
        </p>
      </div>
    );
  }

  /* =======================================================
     INDISPONÍVEL
  ======================================================= */

  if (
    !evento ||
    !eventoServico
  ) {
    return (
      <div className="prof-eventos-vazio">
        <span>◇</span>

        <h2>
          Oportunidade indisponível
        </h2>

        <p>
          {erro ||
            "Este serviço não está disponível."}
        </p>

        <button
          onClick={() =>
            router.push(
              `/profissional/eventos/${id}`
            )
          }
        >
          Voltar ao evento
        </button>
      </div>
    );
  }

  /* =======================================================
     SUCESSO
  ======================================================= */

  if (sucesso) {
    return (
      <div className="prof-proposta-sucesso">
        <span>✓</span>

        <span className="prof-dashboard-label">
          PROPOSTA ENVIADA
        </span>

        <h1>
          Sua proposta foi enviada.
        </h1>

        <p>
          Sua proposta para{" "}
          <strong>
            {eventoServico.categorias
              ?.nome ||
              "este serviço"}
          </strong>{" "}
          foi enviada ao cliente.
        </p>

        <div className="prof-proposta-sucesso-acoes">
          <button
            onClick={() =>
              router.push(
                "/profissional/orcamentos"
              )
            }
          >
            Ver meus orçamentos
          </button>

          <button
            onClick={() =>
              router.push(
                "/profissional/eventos"
              )
            }
          >
            Explorar outros eventos
          </button>
        </div>
      </div>
    );
  }

  /* =======================================================
     FORMULÁRIO
  ======================================================= */

  return (
    <div className="prof-proposta-page">
      <button
        className="detalhe-interesse-voltar"
        onClick={() =>
          router.push(
            `/profissional/eventos/${evento.id}`
          )
        }
      >
        ← Voltar ao evento
      </button>

      <div className="prof-proposta-grid">
        <main className="prof-proposta-principal">
          <header className="prof-proposta-header">
            <span className="prof-dashboard-label">
              ENVIAR PROPOSTA
            </span>

            <h1>
              Prepare seu orçamento.
            </h1>

            <p>
              Você está enviando uma
              proposta para{" "}
              <strong>
                {eventoServico.categorias
                  ?.nome ||
                  "este serviço"}
              </strong>
              .
            </p>
          </header>

          <form
            className="prof-proposta-form"
            onSubmit={enviar}
          >
            <Campo label="Título da proposta">
              <input
                value={titulo}
                onChange={(event) =>
                  setTitulo(
                    event.target.value
                  )
                }
                placeholder="Título da proposta"
                required
              />
            </Campo>

            <Campo label="Descrição da proposta">
              <textarea
                value={descricao}
                onChange={(event) =>
                  setDescricao(
                    event.target.value
                  )
                }
                placeholder="Descreva o que está incluso, diferenciais, condições e demais informações..."
                rows={8}
                required
              />
            </Campo>

            <div className="prof-proposta-duplo">
              <Campo label="Valor da proposta">
                <div className="prof-proposta-dinheiro">
                  <span>R$</span>

                  <input
                    value={valor}
                    onChange={(event) =>
                      setValor(
                        event.target.value
                      )
                    }
                    inputMode="decimal"
                    placeholder="0,00"
                    required
                  />
                </div>
              </Campo>

              <Campo label="Validade da proposta">
                <input
                  type="date"
                  value={validade}
                  onChange={(event) =>
                    setValidade(
                      event.target.value
                    )
                  }
                />
              </Campo>
            </div>

            {erro && (
              <div className="prof-erro-box">
                {erro}
              </div>
            )}

            <div className="prof-proposta-acoes">
              <button
                type="button"
                className="prof-proposta-cancelar"
                onClick={() =>
                  router.push(
                    `/profissional/eventos/${evento.id}`
                  )
                }
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="prof-proposta-enviar"
                disabled={enviando}
              >
                {enviando
                  ? "Enviando..."
                  : "Enviar proposta"}
              </button>
            </div>
          </form>
        </main>

        {/* EVENTO / CATEGORIA */}

        <aside className="prof-proposta-evento">
          <span className="prof-dashboard-label">
            OPORTUNIDADE
          </span>

          <h2>
            {evento.nome}
          </h2>

          {evento.tipo_evento && (
            <p className="prof-proposta-tipo">
              {evento.tipo_evento}
            </p>
          )}

          {/* CATEGORIA */}

          <div className="prof-proposta-categoria">
            <span>
              {eventoServico.categorias
                ?.icone ||
                "✦"}
            </span>

            <div>
              <small>
                SERVIÇO SOLICITADO
              </small>

              <strong>
                {eventoServico.categorias
                  ?.nome ||
                  "Serviço"}
              </strong>
            </div>
          </div>

          <div className="prof-proposta-resumo">
            <Resumo
              titulo="Data"
              valor={
                evento.data_evento
                  ? formatarData(
                      evento.data_evento
                    )
                  : "A definir"
              }
            />

            <Resumo
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

            <Resumo
              titulo="Convidados"
              valor={
                evento.quantidade_convidados !=
                null
                  ? `${evento.quantidade_convidados} pessoas`
                  : "A definir"
              }
            />
          </div>

          <div className="prof-proposta-orcamento">
            <span>
              ORÇAMENTO DESTA CATEGORIA
            </span>

            <strong>
              {eventoServico.orcamento_planejado !=
              null
                ? formatarDinheiro(
                    eventoServico.orcamento_planejado
                  )
                : "Não informado"}
            </strong>
          </div>

          {evento.orcamento_total != null && (
            <div className="prof-proposta-orcamento-total">
              <span>
                Orçamento total do evento
              </span>

              <strong>
                {formatarDinheiro(
                  evento.orcamento_total
                )}
              </strong>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

/* =========================================================
   COMPONENTES
========================================================= */

function Campo({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="prof-proposta-campo">
      <span>{label}</span>
      {children}
    </label>
  );
}

function Resumo({
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

function formatarData(
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