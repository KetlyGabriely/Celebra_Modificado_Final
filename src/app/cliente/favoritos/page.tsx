"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  listarFavoritos,
  removerFavorito,
} from "@/controllers/favoritoController";

import { listarServicos } from "@/controllers/servicoController";
import type { Servico } from "@/models/Servico";

export default function FavoritosPage() {
  const router = useRouter();

  const [servicos, setServicos] = useState<Servico[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [removendo, setRemovendo] = useState<string[]>([]);

  useEffect(() => {
    async function carregarFavoritos() {
      try {
        setCarregando(true);
        setErro("");

        const [idsFavoritos, todosServicos] =
          await Promise.all([
            listarFavoritos(),
            listarServicos(),
          ]);

        const favoritos = todosServicos.filter(
          (servico) => idsFavoritos.includes(servico.id)
        );

        setServicos(favoritos);
      } catch (error) {
        console.error(error);
        setErro("Não foi possível carregar seus favoritos.");
      } finally {
        setCarregando(false);
      }
    }

    carregarFavoritos();
  }, []);

  async function excluirFavorito(id: string) {
    if (removendo.includes(id)) return;

    setRemovendo((anterior) => [...anterior, id]);

    try {
      await removerFavorito(id);

      setServicos((anterior) =>
        anterior.filter((servico) => servico.id !== id)
      );
    } catch (error) {
      console.error(error);
      alert("Não foi possível remover o favorito.");
    } finally {
      setRemovendo((anterior) =>
        anterior.filter((item) => item !== id)
      );
    }
  }

  return (
    <div className="servicos-page">
      <section className="servicos-cabecalho">
        <div>
          <span className="dashboard-label">
            MEUS FAVORITOS
          </span>

          <h1>Serviços favoritos</h1>

          <p>
            Encontre rapidamente os serviços que você salvou.
          </p>
        </div>
      </section>

      <section>
        {carregando && (
          <p>Carregando seus favoritos...</p>
        )}

        {erro && (
          <p role="alert">{erro}</p>
        )}

        {!carregando && !erro && servicos.length === 0 && (
          <div className="servicos-vazio">
            <h2>Você ainda não tem favoritos</h2>
            <p>
              Explore os serviços disponíveis e salve
              aqueles de que mais gostar.
            </p>

            <button
              type="button"
              onClick={() => router.push("/cliente/servicos")}
            >
              Explorar serviços
            </button>
          </div>
        )}

        {!carregando && !erro && servicos.length > 0 && (
          <div className="servicos-grid">
            {servicos.map((servico) => {
              const preco =
                servico.preco_inicial != null
                  ? Number(servico.preco_inicial).toLocaleString(
                      "pt-BR",
                      {
                        style: "currency",
                        currency: "BRL",
                      }
                    )
                  : null;

              return (
                <article
                  key={servico.id}
                  className="servico-card"
                  onClick={() =>
                    router.push(
                      `/cliente/servicos/${servico.id}`
                    )
                  }
                >
                  <div className="servico-card-imagem">
                    <div className="servico-card-placeholder">
                      <span>
                        {servico.categorias_servico?.icone || "✦"}
                      </span>
                    </div>

                    {servico.categorias_servico && (
                      <span className="servico-categoria-tag">
                        {servico.categorias_servico.nome}
                      </span>
                    )}

                    <button
                      type="button"
                      className="servico-favorito-preview"
                      title="Remover dos favoritos"
                      aria-label="Remover dos favoritos"
                      disabled={removendo.includes(servico.id)}
                      onClick={(event) => {
                        event.stopPropagation();
                        excluirFavorito(servico.id);
                      }}
                      style={{
                        color: "#e63946",
                        opacity: removendo.includes(servico.id)
                          ? 0.5
                          : 1,
                      }}
                    >
                      ★
                    </button>
                  </div>

                  <div className="servico-card-conteudo">
                    <div className="servico-profissional">
                      <span>
                        {servico.profissionais?.nome_empresa ||
                          "Profissional Celebra"}
                      </span>
                    </div>

                    <h3>{servico.nome}</h3>

                    <p className="servico-descricao">
                      {servico.descricao ||
                        "Conheça este serviço e saiba mais."}
                    </p>

                    <div className="servico-card-rodape">
                      <div>
                        {preco ? (
                          <>
                            <span className="preco-label">
                              A partir de
                            </span>
                            <strong>{preco}</strong>
                          </>
                        ) : (
                          <strong>Sob consulta</strong>
                        )}
                      </div>

                      {(servico.cidade || servico.estado) && (
                        <span className="servico-localizacao">
                          {[servico.cidade, servico.estado]
                            .filter(Boolean)
                            .join(" - ")}
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
