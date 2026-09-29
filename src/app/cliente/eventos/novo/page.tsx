"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import {
  CategoriaEvento,
  criarEvento,
  criarServicosEvento,
  listarCategoriasEvento,
} from "@/controllers/eventoController";

type ServicoSelecionado = {
  categoria_id: string;
  orcamento: string;
};

export default function NovoEventoPage() {
  const router = useRouter();

  /* =======================================================
     EVENTO
  ======================================================= */

  const [nome, setNome] =
    useState("");

  const [tipo, setTipo] =
    useState("");

  const [tema, setTema] =
    useState("");

  const [descricao, setDescricao] =
    useState("");

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

  const [publicar, setPublicar] =
    useState(true);

  /* =======================================================
     CATEGORIAS
  ======================================================= */

  const [categorias, setCategorias] =
    useState<CategoriaEvento[]>([]);

  const [
    servicosSelecionados,
    setServicosSelecionados,
  ] = useState<ServicoSelecionado[]>([]);

  const [
    carregandoCategorias,
    setCarregandoCategorias,
  ] = useState(true);

  /* =======================================================
     ESTADO
  ======================================================= */

  const [enviando, setEnviando] =
    useState(false);

  const [erro, setErro] =
    useState("");

  /* =======================================================
     CARREGAR CATEGORIAS
  ======================================================= */

  useEffect(() => {
    async function carregarCategorias() {
      try {
        setCarregandoCategorias(true);

        const data =
          await listarCategoriasEvento();

        setCategorias(data);
      } catch (error) {
        console.error(error);

        setErro(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar as categorias."
        );
      } finally {
        setCarregandoCategorias(false);
      }
    }

    carregarCategorias();
  }, []);

  /* =======================================================
     ORÇAMENTO TOTAL
  ======================================================= */

  const valorOrcamentoTotal =
    useMemo(() => {
      return converterDinheiro(
        orcamento
      );
    }, [orcamento]);

  /* =======================================================
     TOTAL DISTRIBUÍDO
  ======================================================= */

  const totalDistribuido =
    useMemo(() => {
      return servicosSelecionados.reduce(
        (total, servico) => {
          return (
            total +
            (converterDinheiro(
              servico.orcamento
            ) ?? 0)
          );
        },
        0
      );
    }, [servicosSelecionados]);

  const restante =
    valorOrcamentoTotal == null
      ? null
      : valorOrcamentoTotal -
        totalDistribuido;

  /* =======================================================
     SELECIONAR CATEGORIA
  ======================================================= */

  function alternarCategoria(
    categoriaId: string
  ) {
    setServicosSelecionados(
      (atual) => {
        const existe =
          atual.some(
            (item) =>
              item.categoria_id ===
              categoriaId
          );

        if (existe) {
          return atual.filter(
            (item) =>
              item.categoria_id !==
              categoriaId
          );
        }

        return [
          ...atual,
          {
            categoria_id:
              categoriaId,

            orcamento: "",
          },
        ];
      }
    );
  }

  /* =======================================================
     ALTERAR ORÇAMENTO DA CATEGORIA
  ======================================================= */

  function alterarOrcamentoCategoria(
    categoriaId: string,
    valor: string
  ) {
    setServicosSelecionados(
      (atual) =>
        atual.map((item) =>
          item.categoria_id ===
          categoriaId
            ? {
                ...item,
                orcamento: valor,
              }
            : item
        )
    );
  }

  /* =======================================================
     VERIFICA SE ESTÁ SELECIONADA
  ======================================================= */

  function categoriaSelecionada(
    categoriaId: string
  ) {
    return servicosSelecionados.some(
      (item) =>
        item.categoria_id ===
        categoriaId
    );
  }

  function buscarServicoSelecionado(
    categoriaId: string
  ) {
    return servicosSelecionados.find(
      (item) =>
        item.categoria_id ===
        categoriaId
    );
  }

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
      setEnviando(true);
      setErro("");

      /* ORÇAMENTO */

      const valorOrcamento =
        converterDinheiro(
          orcamento
        );

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

      /* CONVIDADOS */

      const quantidade =
        convidados.trim()
          ? Number(convidados)
          : null;

      if (
        quantidade != null &&
        (!Number.isInteger(
          quantidade
        ) ||
          quantidade < 0)
      ) {
        setErro(
          "Informe uma quantidade válida de convidados."
        );

        return;
      }

      /* ===============================================
         VALIDAÇÕES DOS SERVIÇOS
      =============================================== */

      if (
        publicar &&
        servicosSelecionados.length ===
          0
      ) {
        setErro(
          "Selecione pelo menos um serviço que você procura para publicar o evento."
        );

        return;
      }

      const servicosPreparados =
        servicosSelecionados.map(
          (servico) => ({
            categoria_id:
              servico.categoria_id,

            orcamento_planejado:
              converterDinheiro(
                servico.orcamento
              ),
          })
        );

      const possuiValorInvalido =
        servicosPreparados.some(
          (servico) =>
            servico.orcamento_planejado !=
              null &&
            (Number.isNaN(
              servico.orcamento_planejado
            ) ||
              servico.orcamento_planejado <
                0)
        );

      if (possuiValorInvalido) {
        setErro(
          "Existe um orçamento inválido entre os serviços selecionados."
        );

        return;
      }

      if (
        valorOrcamento != null &&
        totalDistribuido >
          valorOrcamento
      ) {
        setErro(
          "A soma dos orçamentos dos serviços não pode ultrapassar o orçamento total do evento."
        );

        return;
      }

      /* ===============================================
         CRIAR EVENTO
      =============================================== */

      const eventoCriado =
        await criarEvento({
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

          status: publicar
            ? "publicado"
            : "rascunho",

          visivel_profissionais:
            publicar,
        });

      /* ===============================================
         CRIAR SERVIÇOS DO EVENTO
      =============================================== */

      if (
        servicosPreparados.length >
        0
      ) {
        await criarServicosEvento(
          eventoCriado.id,
          servicosPreparados
        );
      }

      /* ===============================================
         ABRIR EVENTO
      =============================================== */

      router.push(
        `/cliente/eventos/${eventoCriado.id}`
      );
    } catch (error) {
      console.error(error);

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível criar o evento."
      );
    } finally {
      setEnviando(false);
    }
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
            "/cliente/eventos"
          )
        }
      >
        ← Meus eventos
      </button>

      <div className="novo-evento-header">
        <span className="dashboard-label">
          NOVO EVENTO
        </span>

        <h1>
          Vamos criar algo especial.
        </h1>

        <p>
          Conte um pouco sobre o evento
          que você está planejando.
        </p>
      </div>

      <form
        className="novo-evento-form"
        onSubmit={salvar}
      >

        {/* =================================================
            01 — SOBRE
        ================================================= */}

        <section className="novo-evento-secao">

          <TituloSecao
            numero="01"
            titulo="Sobre o evento"
            descricao="Comece pelas informações principais."
          />

          <div className="novo-evento-campos">

            <Campo label="Nome do evento *">
              <input
                value={nome}
                onChange={(e) =>
                  setNome(
                    e.target.value
                  )
                }
                placeholder="Ex.: Casamento Ana & Lucas"
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
                  placeholder="Ex.: Clássico e elegante"
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
                placeholder="Conte aos profissionais o que você está imaginando para este evento..."
                rows={5}
              />
            </Campo>

          </div>
        </section>

        {/* =================================================
            02 — DATA E LOCAL
        ================================================= */}

        <section className="novo-evento-secao">

          <TituloSecao
            numero="02"
            titulo="Quando e onde"
            descricao="Informe a data e o local planejados."
          />

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
                placeholder="Local ou endereço do evento"
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
                  placeholder="Cidade"
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
                  placeholder="SP"
                  maxLength={2}
                />
              </Campo>

            </div>

          </div>
        </section>

        {/* =================================================
            03 — PLANEJAMENTO
        ================================================= */}

        <section className="novo-evento-secao">

          <TituloSecao
            numero="03"
            titulo="Planejamento"
            descricao="Defina o orçamento geral do seu evento."
          />

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
                  placeholder="Ex.: 150"
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
                    placeholder="0,00"
                  />
                </div>
              </Campo>

            </div>

          </div>
        </section>

        {/* =================================================
            04 — SERVIÇOS
        ================================================= */}

        <section className="novo-evento-secao">

          <TituloSecao
            numero="04"
            titulo="Serviços que você precisa"
            descricao="Escolha as categorias e defina quanto pretende investir em cada uma."
          />

          {carregandoCategorias ? (
            <div className="novo-evento-servicos-carregando">
              Carregando serviços...
            </div>
          ) : categorias.length === 0 ? (
            <div className="novo-evento-servicos-vazio">
              Nenhuma categoria disponível.
            </div>
          ) : (
            <div className="novo-evento-servicos-grid">

              {categorias.map(
                (categoria) => {
                  const selecionada =
                    categoriaSelecionada(
                      categoria.id
                    );

                  const servico =
                    buscarServicoSelecionado(
                      categoria.id
                    );

                  return (
                    <div
                      key={categoria.id}
                      className={`novo-evento-servico-card ${
                        selecionada
                          ? "selecionado"
                          : ""
                      }`}
                    >

                      <label className="novo-evento-servico-check">

                        <input
                          type="checkbox"
                          checked={
                            selecionada
                          }
                          onChange={() =>
                            alternarCategoria(
                              categoria.id
                            )
                          }
                        />

                        <div className="novo-evento-servico-identidade">

                          <span className="novo-evento-servico-icone">
                            {categoria.icone ||
                              "✦"}
                          </span>

                          <strong>
                            {categoria.nome}
                          </strong>

                        </div>
                      </label>

                      {selecionada && (
                        <div className="novo-evento-servico-orcamento">

                          <span>
                            Orçamento planejado
                          </span>

                          <div className="novo-evento-dinheiro">

                            <span>
                              R$
                            </span>

                            <input
                              value={
                                servico
                                  ?.orcamento ||
                                ""
                              }
                              onChange={(e) =>
                                alterarOrcamentoCategoria(
                                  categoria.id,
                                  e.target
                                    .value
                                )
                              }
                              inputMode="decimal"
                              placeholder="0,00"
                            />

                          </div>
                        </div>
                      )}

                    </div>
                  );
                }
              )}

            </div>
          )}

          {/* RESUMO */}

          <div className="novo-evento-orcamento-resumo">

            <ResumoOrcamento
              titulo="Orçamento total"
              valor={
                valorOrcamentoTotal
              }
            />

            <ResumoOrcamento
              titulo="Distribuído"
              valor={
                totalDistribuido
              }
            />

            <ResumoOrcamento
              titulo="Ainda disponível"
              valor={restante}
              destaque={
                restante != null &&
                restante < 0
                  ? "erro"
                  : "positivo"
              }
            />

          </div>

          {restante != null &&
            restante < 0 && (
              <div className="novo-evento-orcamento-alerta">
                Você distribuiu{" "}
                {formatarDinheiro(
                  Math.abs(restante)
                )}{" "}
                acima do orçamento total.
              </div>
            )}

        </section>

        {/* =================================================
            05 — PUBLICAÇÃO
        ================================================= */}

        <section className="novo-evento-secao">

          <TituloSecao
            numero="05"
            titulo="Publicação"
            descricao="Escolha se deseja publicar o evento agora."
          />

          <label className="novo-evento-publicar">

            <input
              type="checkbox"
              checked={publicar}
              onChange={(e) =>
                setPublicar(
                  e.target.checked
                )
              }
            />

            <div>
              <strong>
                Publicar para profissionais
              </strong>

              <span>
                Profissionais poderão
                encontrar as categorias
                que você procura e enviar
                propostas.
              </span>
            </div>

          </label>

        </section>

        {/* ERRO */}

        {erro && (
          <div className="cliente-proposta-erro">
            {erro}
          </div>
        )}

        {/* AÇÕES */}

        <div className="novo-evento-acoes">

          <button
            type="button"
            className="novo-evento-cancelar"
            onClick={() =>
              router.push(
                "/cliente/eventos"
              )
            }
          >
            Cancelar
          </button>

          <button
            type="submit"
            className="novo-evento-salvar"
            disabled={enviando}
          >
            {enviando
              ? "Criando..."
              : publicar
                ? "Criar e publicar"
                : "Salvar rascunho"}
          </button>

        </div>

      </form>
    </div>
  );
}

/* =========================================================
   CAMPO
========================================================= */

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

/* =========================================================
   TÍTULO DA SEÇÃO
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
    <div className="novo-evento-secao-titulo">

      <span>{numero}</span>

      <div>
        <h2>{titulo}</h2>
        <p>{descricao}</p>
      </div>

    </div>
  );
}

/* =========================================================
   RESUMO DO ORÇAMENTO
========================================================= */

function ResumoOrcamento({
  titulo,
  valor,
  destaque,
}: {
  titulo: string;
  valor: number | null;
  destaque?:
    | "positivo"
    | "erro";
}) {
  return (
    <div
      className={`novo-evento-orcamento-item ${
        destaque
          ? `novo-evento-orcamento-${destaque}`
          : ""
      }`}
    >
      <span>{titulo}</span>

      <strong>
        {valor == null
          ? "—"
          : formatarDinheiro(
              valor
            )}
      </strong>
    </div>
  );
}

/* =========================================================
   CONVERTER DINHEIRO
========================================================= */

function converterDinheiro(
  valor: string
): number | null {
  if (!valor.trim()) {
    return null;
  }

  const numero =
    Number(
      valor
        .replace(/\./g, "")
        .replace(",", ".")
    );

  return numero;
}

/* =========================================================
   FORMATAR DINHEIRO
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
  ).format(valor);
}