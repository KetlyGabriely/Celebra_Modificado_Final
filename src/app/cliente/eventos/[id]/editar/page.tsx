"use client";

import {
  FormEvent,
  use,
  useEffect,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import {
  atualizarEvento,
  buscarEventoClientePorId,
} from "@/controllers/eventoController";

export default function EditarEventoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const router = useRouter();

  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState("");
  const [tema, setTema] = useState("");
  const [descricao, setDescricao] = useState("");

  const [dataEvento, setDataEvento] =
    useState("");

  const [horario, setHorario] =
    useState("");

  const [cidade, setCidade] =
    useState("");

  const [estado, setEstado] =
    useState("");

  const [endereco, setEndereco] =
    useState("");

  const [convidados, setConvidados] =
    useState("");

  const [orcamento, setOrcamento] =
    useState("");

  const [visivel, setVisivel] =
    useState(false);

  const [carregando, setCarregando] =
    useState(true);

  const [salvando, setSalvando] =
    useState(false);

  const [erro, setErro] =
    useState("");

  /* =======================================================
     CARREGAR EVENTO
  ======================================================= */

  useEffect(() => {
    async function carregar() {
      try {
        setCarregando(true);
        setErro("");

        const evento =
          await buscarEventoClientePorId(id);

        if (!evento) {
          setErro(
            "Evento não encontrado."
          );

          return;
        }

        if (evento.status === "cancelado") {
          router.replace(
            `/cliente/eventos/${id}`
          );

          return;
        }

        setNome(evento.nome);

        setTipo(
          evento.tipo_evento || ""
        );

        setTema(
          evento.tema || ""
        );

        setDescricao(
          evento.descricao || ""
        );

        setDataEvento(
          evento.data_evento || ""
        );

        setHorario(
          evento.horario
            ? evento.horario.slice(0, 5)
            : ""
        );

        setCidade(
          evento.cidade || ""
        );

        setEstado(
          evento.estado || ""
        );

        setEndereco(
          evento.endereco || ""
        );

        setConvidados(
          evento.quantidade_convidados != null
            ? String(
                evento.quantidade_convidados
              )
            : ""
        );

        setOrcamento(
          evento.orcamento_total != null
            ? String(
                evento.orcamento_total
              ).replace(".", ",")
            : ""
        );

        setVisivel(
          evento.visivel_profissionais
        );
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
  }, [id, router]);

  /* =======================================================
     SALVAR
  ======================================================= */

  async function salvar(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!nome.trim()) {
      setErro(
        "Informe o nome do evento."
      );

      return;
    }

    try {
      setSalvando(true);
      setErro("");

      const quantidade =
        convidados.trim()
          ? Number(convidados)
          : null;

      if (
        quantidade != null &&
        (!Number.isInteger(quantidade) ||
          quantidade < 0)
      ) {
        setErro(
          "Informe uma quantidade válida de convidados."
        );

        return;
      }

      const valorOrcamento =
        orcamento.trim()
          ? Number(
              orcamento
                .replace(/\./g, "")
                .replace(",", ".")
            )
          : null;

      if (
        valorOrcamento != null &&
        (Number.isNaN(
          valorOrcamento
        ) ||
          valorOrcamento < 0)
      ) {
        setErro(
          "Informe um orçamento válido."
        );

        return;
      }

      await atualizarEvento(
        id,
        {
          nome,

          tipo_evento: tipo,
          tema,
          descricao,

          data_evento:
            dataEvento,

          horario,

          cidade,
          estado,
          endereco,

          quantidade_convidados:
            quantidade,

          orcamento_total:
            valorOrcamento,

          visivel_profissionais:
            visivel,
        }
      );

      router.push(
        `/cliente/eventos/${id}`
      );

      router.refresh();
    } catch (error) {
      console.error(error);

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar as alterações."
      );
    } finally {
      setSalvando(false);
    }
  }

  /* =======================================================
     CARREGAMENTO
  ======================================================= */

  if (carregando) {
    return (
      <div className="cliente-evento-estado">
        <span>✦</span>

        <p>
          Carregando evento...
        </p>
      </div>
    );
  }

  /* =======================================================
     PÁGINA
  ======================================================= */

  return (
    <div className="novo-evento-page">
      <button
        className="cliente-proposta-voltar"
        onClick={() =>
          router.push(
            `/cliente/eventos/${id}`
          )
        }
      >
        ← Voltar ao evento
      </button>

      <div className="novo-evento-header">
        <span className="dashboard-label">
          EDITAR EVENTO
        </span>

        <h1>
          Ajuste seu planejamento.
        </h1>

        <p>
          Atualize as informações do evento
          sempre que precisar.
        </p>
      </div>

      <form
        className="novo-evento-form"
        onSubmit={salvar}
      >
        {/* ================================================
            01 - EVENTO
        ================================================= */}

        <section className="novo-evento-secao">
          <div className="novo-evento-secao-titulo">
            <span>01</span>

            <div>
              <h2>
                Sobre o evento
              </h2>

              <p>
                Informações principais do
                seu evento.
              </p>
            </div>
          </div>

          <div className="novo-evento-campos">
            <Campo label="Nome do evento *">
              <input
                value={nome}
                onChange={(e) =>
                  setNome(
                    e.target.value
                  )
                }
                required
              />
            </Campo>

            <div className="novo-evento-duplo">
              <Campo label="Tipo de evento">
                <select
                  value={tipo}
                  onChange={(e) =>
                    setTipo(
                      e.target.value
                    )
                  }
                >
                  <option value="">
                    Selecione
                  </option>

                  <option value="Casamento">
                    Casamento
                  </option>

                  <option value="Aniversário">
                    Aniversário
                  </option>

                  <option value="Formatura">
                    Formatura
                  </option>

                  <option value="Corporativo">
                    Corporativo
                  </option>

                  <option value="Debutante">
                    Debutante
                  </option>

                  <option value="Outro">
                    Outro
                  </option>
                </select>
              </Campo>

              <Campo label="Tema">
                <input
                  value={tema}
                  onChange={(e) =>
                    setTema(
                      e.target.value
                    )
                  }
                />
              </Campo>
            </div>

            <Campo label="Descrição">
              <textarea
                value={descricao}
                onChange={(e) =>
                  setDescricao(
                    e.target.value
                  )
                }
                rows={5}
              />
            </Campo>
          </div>
        </section>

        {/* ================================================
            02 - LOCAL
        ================================================= */}

        <section className="novo-evento-secao">
          <div className="novo-evento-secao-titulo">
            <span>02</span>

            <div>
              <h2>
                Quando e onde
              </h2>

              <p>
                Atualize data, horário
                e localização.
              </p>
            </div>
          </div>

          <div className="novo-evento-campos">
            <div className="novo-evento-duplo">
              <Campo label="Data">
                <input
                  type="date"
                  value={dataEvento}
                  onChange={(e) =>
                    setDataEvento(
                      e.target.value
                    )
                  }
                />
              </Campo>

              <Campo label="Horário">
                <input
                  type="time"
                  value={horario}
                  onChange={(e) =>
                    setHorario(
                      e.target.value
                    )
                  }
                />
              </Campo>
            </div>

            <Campo label="Endereço">
              <input
                value={endereco}
                onChange={(e) =>
                  setEndereco(
                    e.target.value
                  )
                }
                placeholder="Local ou endereço"
              />
            </Campo>

            <div className="novo-evento-duplo">
              <Campo label="Cidade">
                <input
                  value={cidade}
                  onChange={(e) =>
                    setCidade(
                      e.target.value
                    )
                  }
                />
              </Campo>

              <Campo label="Estado">
                <input
                  value={estado}
                  onChange={(e) =>
                    setEstado(
                      e.target.value
                    )
                  }
                  maxLength={2}
                />
              </Campo>
            </div>
          </div>
        </section>

        {/* ================================================
            03 - PLANEJAMENTO
        ================================================= */}

        <section className="novo-evento-secao">
          <div className="novo-evento-secao-titulo">
            <span>03</span>

            <div>
              <h2>
                Planejamento
              </h2>

              <p>
                Ajuste convidados,
                orçamento e visibilidade.
              </p>
            </div>
          </div>

          <div className="novo-evento-campos">
            <div className="novo-evento-duplo">
              <Campo label="Convidados">
                <input
                  type="number"
                  min="0"
                  value={convidados}
                  onChange={(e) =>
                    setConvidados(
                      e.target.value
                    )
                  }
                />
              </Campo>

              <Campo label="Orçamento total">
                <div className="novo-evento-dinheiro">
                  <span>R$</span>

                  <input
                    value={orcamento}
                    onChange={(e) =>
                      setOrcamento(
                        e.target.value
                      )
                    }
                    inputMode="decimal"
                  />
                </div>
              </Campo>
            </div>

            <label className="novo-evento-publicar">
              <input
                type="checkbox"
                checked={visivel}
                onChange={(e) =>
                  setVisivel(
                    e.target.checked
                  )
                }
              />

              <div>
                <strong>
                  Visível para profissionais
                </strong>

                <span>
                  Permita que profissionais
                  encontrem este evento e
                  enviem propostas.
                </span>
              </div>
            </label>
          </div>
        </section>

        {/* ERRO */}

        {erro && (
          <div className="cliente-proposta-erro">
            {erro}
          </div>
        )}

        {/* BOTÕES */}

        <div className="novo-evento-acoes">
          <button
            type="button"
            className="novo-evento-cancelar"
            onClick={() =>
              router.push(
                `/cliente/eventos/${id}`
              )
            }
          >
            Cancelar
          </button>

          <button
            type="submit"
            className="novo-evento-salvar"
            disabled={salvando}
          >
            {salvando
              ? "Salvando..."
              : "Salvar alterações"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Campo({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="novo-evento-campo">
      <span>{label}</span>

      {children}
    </label>
  );
}