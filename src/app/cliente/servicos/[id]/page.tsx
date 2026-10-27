
"use client";

import {
  FormEvent,
  use,
  useEffect,
  useState,
} from "react";

import { useRouter } from "next/navigation";
import { supabase } from "@/services/supabase";

type AvaliacaoPublica = {
  id: string;
  nota: number;
  comentario: string;
  criado_em: string;
  resposta_profissional: string | null;
};

import {
  buscarServicoPorId,
} from "@/controllers/servicoController";

import {
  criarInteresse,
} from "@/controllers/interesseController";

import {
  listarImagensServico,
} from "@/controllers/servicoImagemController";

import {
  listarFavoritos,
  adicionarFavorito,
  removerFavorito,
} from "@/controllers/favoritoController";

import type { Servico } from "@/models/Servico";

import type {
  ImagemServico,
} from "@/controllers/servicoImagemController";

export default function DetalhesServicoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);

  const [servico, setServico] =
    useState<Servico | null>(null);

  const [imagens, setImagens] =
    useState<ImagemServico[]>([]);

  const [imagemAtual, setImagemAtual] =
    useState(0);

  const [visualizadorAberto, setVisualizadorAberto] =
    useState(false);

  const [imagemFalhou, setImagemFalhou] =
    useState(false);

  const [carregando, setCarregando] =
    useState(true);

  const [erro, setErro] = useState("");
  const [erroGaleria, setErroGaleria] = useState("");

  const [modalAberto, setModalAberto] =
    useState(false);

  const [mensagem, setMensagem] =
    useState("");

  const [enviando, setEnviando] =
    useState(false);

  const [sucesso, setSucesso] =
    useState(false);

  const [favorito, setFavorito] =
    useState(false);

  const [favoritoPendente, setFavoritoPendente] =
    useState(false);

  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoPublica[]>([]);
  const [carregandoAvaliacoes, setCarregandoAvaliacoes] = useState(true);
  const [erroAvaliacoes, setErroAvaliacoes] = useState("");

  useEffect(() => {
    const profissionalId = servico?.profissional_id;
    if (!profissionalId) {
      setAvaliacoes([]);
      setCarregandoAvaliacoes(false);
      return;
    }

    let cancelado = false;

    async function carregarAvaliacoes() {
      setCarregandoAvaliacoes(true);
      setErroAvaliacoes("");

      const { data, error } = await supabase
        .from("avaliacoes")
        .select("id, nota, comentario, criado_em, resposta_profissional")
        .eq("profissional_id", profissionalId)
        .order("criado_em", { ascending: false });

      if (cancelado) return;

      if (error) {
        console.error("Erro ao carregar avaliações:", error);
        setErroAvaliacoes("Não foi possível carregar as avaliações.");
        setAvaliacoes([]);
      } else {
        setAvaliacoes((data ?? []) as AvaliacaoPublica[]);
      }
      setCarregandoAvaliacoes(false);
    }

    void carregarAvaliacoes();
    return () => { cancelado = true; };
  }, [servico?.profissional_id]);

  // ========================================
  // CARREGAR SERVIÇO E GALERIA
  // ========================================

  useEffect(() => {
    let cancelado = false;

    async function carregar() {
      try {
        setCarregando(true);
        setErro("");
        setErroGaleria("");
        setServico(null);
        setImagens([]);
        setImagemAtual(0);
        setVisualizadorAberto(false);

        const data = await buscarServicoPorId(id);

        if (cancelado) return;

        if (!data) {
          setErro(
            "Este serviço não está disponível."
          );
          return;
        }

        setServico(data);

        // Galeria e favoritos não impedem
        // a exibição dos detalhes do serviço.

        const [resultadoGaleria, resultadoFavoritos] =
          await Promise.allSettled([
            listarImagensServico(id),
            listarFavoritos(),
          ]);

        if (cancelado) return;

        if (resultadoGaleria.status === "fulfilled") {
          const fotos = [...resultadoGaleria.value];

          fotos.sort((a, b) => {
            if (a.capa !== b.capa) {
              return a.capa ? -1 : 1;
            }

            return a.ordem - b.ordem;
          });

          setImagens(fotos);
        } else {
          console.error(
            "Erro ao carregar galeria:",
            resultadoGaleria.reason
          );

          setErroGaleria(
            "Não foi possível carregar as fotos."
          );
        }

        if (resultadoFavoritos.status === "fulfilled") {
          setFavorito(
            resultadoFavoritos.value.includes(id)
          );
        } else {
          console.error(
            "Erro ao carregar favoritos:",
            resultadoFavoritos.reason
          );
        }
      } catch (error) {
        if (cancelado) return;

        console.error(error);

        setErro(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar o serviço."
        );
      } finally {
        if (!cancelado) {
          setCarregando(false);
        }
      }
    }

    void carregar();

    return () => {
      cancelado = true;
    };
  }, [id]);

  // ========================================
  // NAVEGAÇÃO DA GALERIA
  // ========================================

  function selecionarImagem(indice: number) {
    setImagemAtual(indice);
    setImagemFalhou(false);
  }

  function proximaImagem() {
    if (imagens.length === 0) return;

    setImagemAtual((atual) =>
      (atual + 1) % imagens.length
    );

    setImagemFalhou(false);
  }

  function imagemAnterior() {
    if (imagens.length === 0) return;

    setImagemAtual((atual) =>
      (atual - 1 + imagens.length) % imagens.length
    );

    setImagemFalhou(false);
  }

  // ========================================
  // TECLADO E ROLAGEM
  // ========================================

  useEffect(() => {
    if (!visualizadorAberto) return;

    function aoPressionarTecla(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setVisualizadorAberto(false);
      }

      if (event.key === "ArrowRight") {
        setImagemAtual((atual) =>
          imagens.length
            ? (atual + 1) % imagens.length
            : atual
        );
        setImagemFalhou(false);
      }

      if (event.key === "ArrowLeft") {
        setImagemAtual((atual) =>
          imagens.length
            ? (atual - 1 + imagens.length) %
              imagens.length
            : atual
        );
        setImagemFalhou(false);
      }
    }

    const overflowAnterior =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    window.addEventListener(
      "keydown",
      aoPressionarTecla
    );

    return () => {
      document.body.style.overflow =
        overflowAnterior;

      window.removeEventListener(
        "keydown",
        aoPressionarTecla
      );
    };
  }, [visualizadorAberto, imagens.length]);

  // ========================================
  // FAVORITOS
  // ========================================

  async function alternarFavorito() {
    if (!servico || favoritoPendente) return;

    const anterior = favorito;

    try {
      setFavoritoPendente(true);

      if (anterior) {
        await removerFavorito(servico.id);
      } else {
        await adicionarFavorito(servico.id);
      }

      setFavorito(!anterior);
    } catch (error) {
      console.error(
        "Erro ao atualizar favorito:",
        error
      );

      alert(
        "Não foi possível atualizar o favorito."
      );
    } finally {
      setFavoritoPendente(false);
    }
  }

  // ========================================
  // ENVIAR INTERESSE
  // ========================================

  async function enviarInteresse(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!servico || enviando) return;

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

  // ========================================
  // CARREGAMENTO
  // ========================================

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
          type="button"
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

  const imagemSelecionada =
    imagens[imagemAtual];

  // ========================================
  // INTERFACE
  // ========================================

  return (
    <div className="detalhe-servico-page">
      <button
        type="button"
        className="detalhe-voltar"
        onClick={() =>
          router.push("/cliente/servicos")
        }
      >
        ← Explorar serviços
      </button>

      <div className="detalhe-servico-grid">
        <section>
          {/* FOTO PRINCIPAL */}

          <div
            className="detalhe-imagem"
            style={{
              position: "relative",
              overflow: "hidden",
              cursor: imagemSelecionada
                ? "zoom-in"
                : "default",
            }}
            onClick={() => {
              if (imagemSelecionada) {
                setVisualizadorAberto(true);
              }
            }}
          >
            {imagemSelecionada &&
            !imagemFalhou ? (
              <img
                src={imagemSelecionada.url}
                alt={`Foto ${imagemAtual + 1} do serviço ${servico.nome}`}
                onError={() =>
                  setImagemFalhou(true)
                }
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            ) : (
              <span>
                {servico.categorias_servico
                  ?.icone || "✦"}
              </span>
            )}

            <div
              className="detalhe-categoria"
              style={{
                position: "absolute",
                zIndex: 2,
              }}
            >
              {servico.categorias_servico
                ?.nome || "Serviço"}
            </div>

            {imagemSelecionada && (
              <div
                style={{
                  position: "absolute",
                  bottom: 14,
                  right: 14,
                  zIndex: 2,
                  background:
                    "rgba(9,9,9,0.85)",
                  color: "#fff",
                  padding: "8px 12px",
                  borderRadius: 8,
                  fontSize: 12,
                  pointerEvents: "none",
                }}
              >
                {imagemAtual + 1} / {imagens.length}
                {" · "}
                Ampliar foto
              </div>
            )}
          </div>

          {/* MINIATURAS */}

          {imagens.length > 1 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fill, minmax(85px, 1fr))",
                gap: 12,
                marginTop: 14,
              }}
            >
              {imagens.map((imagem, indice) => (
                <button
                  key={imagem.id}
                  type="button"
                  onClick={() =>
                    selecionarImagem(indice)
                  }
                  aria-label={`Visualizar foto ${indice + 1}`}
                  aria-pressed={
                    imagemAtual === indice
                  }
                  style={{
                    border:
                      imagemAtual === indice
                        ? "2px solid #d6aa46"
                        : "1px solid #242424",
                    background: "#101010",
                    borderRadius: 9,
                    padding: 0,
                    overflow: "hidden",
                    cursor: "pointer",
                    aspectRatio: "1",
                    opacity:
                      imagemAtual === indice
                        ? 1
                        : 0.65,
                  }}
                >
                  <img
                    src={imagem.url}
                    alt={`Miniatura ${indice + 1}`}
                    loading="lazy"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                </button>
              ))}
            </div>
          )}

          {erroGaleria && (
            <p
              role="status"
              style={{
                color: "#d6aa46",
                fontSize: 13,
                marginTop: 12,
              }}
            >
              {erroGaleria}
            </p>
          )}

          {/* INFORMAÇÕES */}

          <div className="detalhe-conteudo">
            <span className="dashboard-label">
              {servico.profissionais
                ?.nome_empresa ||
                "PROFISSIONAL CELEBRA"}
            </span>

            <h1>{servico.nome}</h1>

            <div className="detalhe-local">
              {servico.cidade}

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

          {/* AVALIAÇÕES PÚBLICAS — REPUTAÇÃO DO PROFISSIONAL */}
          <section
            aria-label="Avaliações do profissional"
            style={{
              marginTop: 24,
              padding: 22,
              background: "#141414",
              border: "1px solid #303030",
              borderRadius: 14,
            }}
          >
            <span className="dashboard-label">REPUTAÇÃO DO PROFISSIONAL</span>
            <h2 style={{ margin: "12px 0" }}>Avaliações dos clientes</h2>

            {carregandoAvaliacoes ? (
              <p style={{ color: "#aaa" }}>Carregando avaliações...</p>
            ) : erroAvaliacoes ? (
              <p role="alert" style={{ color: "#d6aa46" }}>{erroAvaliacoes}</p>
            ) : avaliacoes.length === 0 ? (
              <p style={{ color: "#aaa" }}>Este profissional ainda não recebeu avaliações.</p>
            ) : (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
                  <strong style={{ color: "#d6aa46", fontSize: 30 }}>
                    {(avaliacoes.reduce((soma, avaliacao) => soma + avaliacao.nota, 0) / avaliacoes.length)
                      .toFixed(1).replace(".", ",")}
                  </strong>
                  <span style={{ color: "#d6aa46" }}>★ / 5</span>
                  <span style={{ color: "#aaa", fontSize: 13 }}>
                    {avaliacoes.length} {avaliacoes.length === 1 ? "avaliação" : "avaliações"} do profissional
                  </span>
                </div>
                <div style={{ display: "grid", gap: 14 }}>
                  {avaliacoes.map((avaliacao) => (
                    <article key={avaliacao.id} style={{ padding: 18, background: "#1e1e1e", border: "1px solid #303030", borderRadius: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                        <span style={{ color: "#d6aa46", letterSpacing: 2 }} aria-label={`${avaliacao.nota} de 5 estrelas`}>
                          {"★".repeat(avaliacao.nota)}<span style={{ color: "#555" }}>{"★".repeat(5 - avaliacao.nota)}</span>
                        </span>
                        <time dateTime={avaliacao.criado_em} style={{ color: "#999", fontSize: 12 }}>
                          {new Date(avaliacao.criado_em).toLocaleDateString("pt-BR")}
                        </time>
                      </div>
                      <p style={{ marginTop: 12, lineHeight: 1.7, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
                        {avaliacao.comentario}
                      </p>
                      {avaliacao.resposta_profissional && (
                        <div style={{ marginTop: 14, padding: "12px 15px", background: "#262626", borderLeft: "3px solid #d6aa46", borderRadius: 6 }}>
                          <strong style={{ color: "#d6aa46", fontSize: 13 }}>Resposta do profissional</strong>
                          <p style={{ marginTop: 8, lineHeight: 1.6, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
                            {avaliacao.resposta_profissional}
                          </p>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              </>
            )}
          </section>
        </section>

        {/* LATERAL */}

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
              type="button"
              className="detalhe-interesse-btn"
              onClick={() => {
                setErro("");
                setModalAberto(true);
              }}
            >
              Tenho interesse
            </button>

            <button
              type="button"
              className="detalhe-favoritar"
              disabled={favoritoPendente}
              aria-pressed={favorito}
              onClick={alternarFavorito}
              style={{
                color: favorito
                  ? "#e63946"
                  : undefined,
              }}
            >
              {favorito
                ? "★ Remover dos favoritos"
                : "☆ Adicionar aos favoritos"}
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
                {servico.profissionais.descricao}
              </p>
            )}
          </div>
        </aside>
      </div>

      {/* ===================================
          VISUALIZADOR DE FOTOS
      =================================== */}

      {visualizadorAberto &&
        imagemSelecionada && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Galeria de fotos do serviço"
            onMouseDown={(event) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                setVisualizadorAberto(false);
              }
            }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9999,
              background:
                "rgba(0,0,0,0.96)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 20,
            }}
          >
            <button
              type="button"
              aria-label="Fechar galeria"
              onClick={() =>
                setVisualizadorAberto(false)
              }
              style={{
                position: "absolute",
                top: 20,
                right: 24,
                zIndex: 3,
                border: "1px solid #444",
                background: "#101010",
                color: "#fff",
                width: 42,
                height: 42,
                borderRadius: "50%",
                fontSize: 26,
                cursor: "pointer",
              }}
            >
              ×
            </button>

            {imagens.length > 1 && (
              <button
                type="button"
                aria-label="Foto anterior"
                onClick={imagemAnterior}
                style={{
                  position: "absolute",
                  left: 16,
                  zIndex: 3,
                  border: "1px solid #444",
                  background: "#101010",
                  color: "#d6aa46",
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  fontSize: 26,
                  cursor: "pointer",
                }}
              >
                ‹
              </button>
            )}

            <img
              key={imagemSelecionada.id}
              src={imagemSelecionada.url}
              alt={`Foto ampliada ${imagemAtual + 1}`}
              style={{
                maxWidth: "calc(100vw - 120px)",
                maxHeight: "80vh",
                width: "auto",
                height: "auto",
                objectFit: "contain",
                borderRadius: 8,
              }}
            />

            {imagens.length > 1 && (
              <button
                type="button"
                aria-label="Próxima foto"
                onClick={proximaImagem}
                style={{
                  position: "absolute",
                  right: 16,
                  zIndex: 3,
                  border: "1px solid #444",
                  background: "#101010",
                  color: "#d6aa46",
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  fontSize: 26,
                  cursor: "pointer",
                }}
              >
                ›
              </button>
            )}

            <div
              style={{
                position: "absolute",
                bottom: 28,
                color: "#d6aa46",
                fontSize: 14,
              }}
            >
              {imagemAtual + 1} de {imagens.length}
            </div>
          </div>
        )}

      {/* ===================================
          MODAL DE INTERESSE
      =================================== */}

      {modalAberto && (
        <div
          className="interesse-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget &&
              !enviando
            ) {
              setModalAberto(false);
            }
          }}
        >
          <div className="interesse-modal">
            {!sucesso ? (
              <>
                <button
                  type="button"
                  className="interesse-fechar"
                  disabled={enviando}
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

                <form onSubmit={enviarInteresse}>
                  <label htmlFor="mensagem">
                    Mensagem
                  </label>

                  <textarea
                    id="mensagem"
                    value={mensagem}
                    onChange={(event) =>
                      setMensagem(event.target.value)
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
                      disabled={enviando}
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
                  type="button"
                  onClick={() =>
                    router.push("/cliente/servicos")
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
