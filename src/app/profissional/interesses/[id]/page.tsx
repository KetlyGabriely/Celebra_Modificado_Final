"use client";

import {
  FormEvent,
  use,
  useEffect,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import {
  buscarInteresseRecebidoPorId,
  InteresseRecebido,
  marcarInteresseComoVisualizado,
} from "@/controllers/interesseController";

import {
  criarOrcamentoPorInteresse,
} from "@/controllers/orcamentoController";

export default function InteresseDetalhesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const router = useRouter();

  const [interesse, setInteresse] =
    useState<InteresseRecebido | null>(
      null
    );

  const [carregando, setCarregando] =
    useState(true);

  const [erro, setErro] = useState("");

  const [titulo, setTitulo] =
    useState("");

  const [descricao, setDescricao] =
    useState("");

  const [valor, setValor] =
    useState("");

  const [validade, setValidade] =
    useState("");

  const [enviando, setEnviando] =
    useState(false);

  const [sucesso, setSucesso] =
    useState(false);

  useEffect(() => {
    async function carregar() {
      try {
        setCarregando(true);
        setErro("");

        const data =
          await buscarInteresseRecebidoPorId(
            id
          );

        if (!data) {
          setErro(
            "Solicitação não encontrada."
          );

          return;
        }

        setInteresse(data);

        if (data.status === "pendente") {
          await marcarInteresseComoVisualizado(
            data.id
          );

          setInteresse({
            ...data,
            status: "visualizado",
          });
        }
      } catch (error) {
        console.error(error);

        setErro(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar a solicitação."
        );
      } finally {
        setCarregando(false);
      }
    }

    carregar();
  }, [id]);

  async function enviarOrcamento(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!interesse) return;

    const valorNumerico =
      Number(
        valor
          .replace(/\./g, "")
          .replace(",", ".")
      );

    if (
      !valor ||
      Number.isNaN(valorNumerico) ||
      valorNumerico <= 0
    ) {
      setErro(
        "Informe um valor válido para o orçamento."
      );

      return;
    }

    if (!descricao.trim()) {
      setErro(
        "Informe a descrição da proposta."
      );

      return;
    }

    try {
      setEnviando(true);
      setErro("");

      await criarOrcamentoPorInteresse({
        interesse_id: interesse.id,
        titulo,
        descricao,
        valor: valorNumerico,
        validade:
          validade || null,
      });

      setSucesso(true);

      setInteresse({
        ...interesse,
        status: "respondido",
      });
    } catch (error) {
      console.error(error);

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível enviar o orçamento."
      );
    } finally {
      setEnviando(false);
    }
  }

  if (carregando) {
    return (
      <div className="prof-estado">
        <span>✦</span>
        <p>Carregando solicitação...</p>
      </div>
    );
  }

  if (!interesse) {
    return (
      <div className="prof-estado">
        <h2>Solicitação indisponível</h2>

        <p>{erro}</p>

        <button
          onClick={() =>
            router.push(
              "/profissional/interesses"
            )
          }
        >
          Voltar
        </button>
      </div>
    );
  }

  return (
    <div className="orcamento-page">
      <button
        className="detalhe-interesse-voltar"
        onClick={() =>
          router.push(
            "/profissional/interesses"
          )
        }
      >
        ← Interesses recebidos
      </button>

      <div className="orcamento-grid">
        <section className="solicitacao-detalhes">
          <span className="prof-dashboard-label">
            SOLICITAÇÃO DO CLIENTE
          </span>

          <h1>
            {interesse.servicos?.nome ||
              "Solicitação"}
          </h1>

          <div className="solicitacao-status">
            {interesse.status}
          </div>

          <div className="solicitacao-divisor" />

          <h2>Mensagem</h2>

          <div className="solicitacao-mensagem">
            {interesse.mensagem ||
              "O cliente não adicionou uma mensagem."}
          </div>

          {(interesse.data_evento ||
            interesse.quantidade_convidados ||
            interesse.cidade) && (
            <>
              <div className="solicitacao-divisor" />

              <h2>
                Informações do evento
              </h2>

              <div className="solicitacao-info-grid">
                {interesse.data_evento && (
                  <Info
                    titulo="Data"
                    valor={new Intl.DateTimeFormat(
                      "pt-BR"
                    ).format(
                      new Date(
                        `${interesse.data_evento}T12:00:00`
                      )
                    )}
                  />
                )}

                {interesse.quantidade_convidados !=
                  null && (
                  <Info
                    titulo="Convidados"
                    valor={`${interesse.quantidade_convidados}`}
                  />
                )}

                {interesse.cidade && (
                  <Info
                    titulo="Local"
                    valor={`${interesse.cidade}${
                      interesse.estado
                        ? ` - ${interesse.estado}`
                        : ""
                    }`}
                  />
                )}
              </div>
            </>
          )}
        </section>

        <aside className="orcamento-form-card">
          {!sucesso ? (
            <>
              <span className="prof-dashboard-label">
                PROPOSTA
              </span>

              <h2>Enviar orçamento</h2>

              <p>
                Prepare uma proposta para este
                cliente.
              </p>

              <form
                onSubmit={enviarOrcamento}
              >
                <label htmlFor="titulo">
                  Título
                </label>

                <input
                  id="titulo"
                  value={titulo}
                  onChange={(event) =>
                    setTitulo(
                      event.target.value
                    )
                  }
                  placeholder="Ex.: Proposta para seu evento"
                  maxLength={120}
                />

                <label htmlFor="descricao">
                  Descrição *
                </label>

                <textarea
                  id="descricao"
                  value={descricao}
                  onChange={(event) =>
                    setDescricao(
                      event.target.value
                    )
                  }
                  placeholder="Descreva tudo que está incluso na proposta..."
                  rows={7}
                  required
                />

                <label htmlFor="valor">
                  Valor *
                </label>

                <div className="orcamento-valor-input">
                  <span>R$</span>

                  <input
                    id="valor"
                    type="text"
                    inputMode="decimal"
                    value={valor}
                    onChange={(event) =>
                      setValor(
                        event.target.value
                      )
                    }
                    placeholder="0,00"
                    required
                  />
                </div>

                <label htmlFor="validade">
                  Validade da proposta
                </label>

                <input
                  id="validade"
                  type="date"
                  value={validade}
                  onChange={(event) =>
                    setValidade(
                      event.target.value
                    )
                  }
                />

                {erro && (
                  <div className="orcamento-erro">
                    {erro}
                  </div>
                )}

                <button
                  className="orcamento-enviar"
                  type="submit"
                  disabled={enviando}
                >
                  {enviando
                    ? "Enviando..."
                    : "Enviar orçamento"}
                </button>
              </form>
            </>
          ) : (
            <div className="orcamento-sucesso">
              <span>✓</span>

              <h2>Orçamento enviado!</h2>

              <p>
                A proposta agora está disponível
                para o cliente.
              </p>

              <button
                onClick={() =>
                  router.push(
                    "/profissional/interesses"
                  )
                }
              >
                Voltar aos interesses
              </button>
            </div>
          )}
        </aside>
      </div>
    </div>
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
    <div className="solicitacao-info">
      <span>{titulo}</span>
      <strong>{valor}</strong>
    </div>
  );
}