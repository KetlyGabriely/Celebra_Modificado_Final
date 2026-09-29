"use client";

import {
  FormEvent,
  use,
  useEffect,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import { buscarServicoPorId } from "@/controllers/servicoController";
import { criarInteresse } from "@/controllers/interesseController";

import type { Servico } from "@/models/Servico";

export default function DetalhesServicoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();

  const { id } = use(params);

  const [servico, setServico] =
    useState<Servico | null>(null);

  const [carregando, setCarregando] =
    useState(true);

  const [erro, setErro] = useState("");

  const [modalAberto, setModalAberto] =
    useState(false);

  const [mensagem, setMensagem] =
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
          await buscarServicoPorId(id);

        if (!data) {
          setErro(
            "Este serviço não está disponível."
          );

          return;
        }

        setServico(data);
      } catch (error) {
        console.error(error);

        setErro(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar o serviço."
        );
      } finally {
        setCarregando(false);
      }
    }

    carregar();
  }, [id]);

  async function enviarInteresse(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!servico) return;

    try {
      setEnviando(true);
      setErro("");

      await criarInteresse({
        servico_id: servico.id,
        mensagem,
      });

      setSucesso(true);
    } catch (error) {
      console.error(error);

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível enviar seu interesse."
      );
    } finally {
      setEnviando(false);
    }
  }

  if (carregando) {
    return (
      <div className="detalhe-estado">
        <span>✦</span>
        <p>Carregando serviço...</p>
      </div>
    );
  }

  if (!servico) {
    return (
      <div className="detalhe-estado">
        <span>◇</span>

        <h2>Serviço indisponível</h2>

        <p>{erro}</p>

        <button
          onClick={() =>
            router.push("/cliente/servicos")
          }
        >
          Voltar aos serviços
        </button>
      </div>
    );
  }

  const preco =
    servico.preco_inicial != null
      ? new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
        }).format(
          Number(servico.preco_inicial)
        )
      : "Sob consulta";

  return (
    <div className="detalhe-servico-page">
      <button
        className="detalhe-voltar"
        onClick={() =>
          router.push("/cliente/servicos")
        }
      >
        ← Explorar serviços
      </button>

      <div className="detalhe-servico-grid">
        <section>
          <div className="detalhe-imagem">
            <span>
              {servico.categorias_servico
                ?.icone || "✦"}
            </span>

            <div className="detalhe-categoria">
              {servico.categorias_servico
                ?.nome || "Serviço"}
            </div>
          </div>

          <div className="detalhe-conteudo">
            <span className="dashboard-label">
              {servico.profissionais
                ?.nome_empresa ||
                "PROFISSIONAL CELEBRA"}
            </span>

            <h1>{servico.nome}</h1>

            <div className="detalhe-local">
              {servico.cidade &&
                servico.cidade}

              {servico.cidade &&
                servico.estado &&
                " — "}

              {servico.estado}
            </div>

            <div className="detalhe-divisor" />

            <h2>Sobre o serviço</h2>

            <p className="detalhe-descricao">
              {servico.descricao ||
                "O profissional ainda não adicionou uma descrição para este serviço."}
            </p>
          </div>
        </section>

        <aside className="detalhe-lateral">
          <div className="detalhe-orcamento-card">
            <span className="detalhe-preco-label">
              A PARTIR DE
            </span>

            <strong>{preco}</strong>

            <p>
              Demonstre interesse para que o
              profissional possa preparar um
              orçamento para você.
            </p>

            <button
              className="detalhe-interesse-btn"
              onClick={() =>
                setModalAberto(true)
              }
            >
              Tenho interesse
            </button>

            <button className="detalhe-favoritar">
              ☆ Adicionar aos favoritos
            </button>
          </div>

          <div className="detalhe-profissional-card">
            <span className="dashboard-label">
              PROFISSIONAL
            </span>

            <h3>
              {servico.profissionais
                ?.nome_empresa ||
                "Profissional Celebra"}

              {servico.profissionais
                ?.verificado && (
                <span className="detalhe-check">
                  ✓
                </span>
              )}
            </h3>

            {servico.profissionais
              ?.descricao && (
              <p>
                {
                  servico.profissionais
                    .descricao
                }
              </p>
            )}
          </div>
        </aside>
      </div>

      {modalAberto && (
        <div
          className="interesse-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setModalAberto(false);
            }
          }}
        >
          <div className="interesse-modal">
            {!sucesso ? (
              <>
                <button
                  className="interesse-fechar"
                  onClick={() =>
                    setModalAberto(false)
                  }
                >
                  ×
                </button>

                <span className="dashboard-label">
                  DEMONSTRAR INTERESSE
                </span>

                <h2>
                  Fale com o profissional.
                </h2>

                <p>
                  Seu interesse será enviado para{" "}
                  <strong>
                    {servico.profissionais
                      ?.nome_empresa ||
                      "o profissional"}
                  </strong>
                  . Ele poderá preparar um
                  orçamento para você.
                </p>

                <form
                  onSubmit={enviarInteresse}
                >
                  <label htmlFor="mensagem">
                    Mensagem
                  </label>

                  <textarea
                    id="mensagem"
                    value={mensagem}
                    onChange={(event) =>
                      setMensagem(
                        event.target.value
                      )
                    }
                    placeholder="Ex.: Gostaria de saber mais sobre disponibilidade e valores..."
                    maxLength={1000}
                    rows={6}
                  />

                  {erro && (
                    <div className="interesse-erro">
                      {erro}
                    </div>
                  )}

                  <div className="interesse-acoes">
                    <button
                      type="button"
                      onClick={() =>
                        setModalAberto(false)
                      }
                    >
                      Cancelar
                    </button>

                    <button
                      type="submit"
                      disabled={enviando}
                    >
                      {enviando
                        ? "Enviando..."
                        : "Enviar interesse"}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="interesse-sucesso">
                <span>✓</span>

                <h2>Interesse enviado!</h2>

                <p>
                  O profissional poderá visualizar
                  sua solicitação e enviar um
                  orçamento.
                </p>

                <button
                  onClick={() =>
                    router.push(
                      "/cliente/servicos"
                    )
                  }
                >
                  Continuar explorando
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}