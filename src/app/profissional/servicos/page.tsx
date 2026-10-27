"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import {
  listarMeusServicos,
} from "@/controllers/servicoController";

import {
  listarImagensServico,
} from "@/controllers/servicoImagemController";

import type {
  Servico,
} from "@/models/Servico";

interface CapaServico {
  [servicoId: string]: string;
}

export default function MeusServicosPage() {
  const router = useRouter();

  const [servicos, setServicos] =
    useState<Servico[]>([]);

  const [capas, setCapas] =
    useState<CapaServico>({});

  const [carregando, setCarregando] =
    useState(true);

  const [erro, setErro] = useState("");

  const carregar = useCallback(async () => {
    try {
      setCarregando(true);
      setErro("");

      const data = await listarMeusServicos();

      setServicos(data);

      // Busca as imagens de cada serviço.
      const resultados = await Promise.all(
        data.map(async (servico) => {
          try {
            const imagens =
              await listarImagensServico(
                servico.id
              );

            const capa =
              imagens.find(
                (imagem) => imagem.capa
              ) ?? imagens[0];

            return {
              servicoId: servico.id,
              url: capa?.url ?? null,
            };
          } catch (error) {
            console.error(
              `Erro ao carregar imagens do serviço ${servico.id}:`,
              error
            );

            return {
              servicoId: servico.id,
              url: null,
            };
          }
        })
      );

      const novasCapas: CapaServico = {};

      for (const resultado of resultados) {
        if (resultado.url) {
          novasCapas[resultado.servicoId] =
            resultado.url;
        }
      }

      setCapas(novasCapas);
    } catch (error) {
      console.error(error);

      setErro(
        error instanceof Error
          ? error.message
          : "Erro ao carregar serviços."
      );
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  return (
    <div className="prof-servicos-page">
      <section className="prof-pagina-header">
        <div>
          <span className="prof-dashboard-label">
            SEU CATÁLOGO
          </span>

          <h1>Meus serviços</h1>

          <p>
            Gerencie os serviços publicados no
            marketplace Celebra.
          </p>
        </div>

        <button
          className="prof-btn-principal"
          onClick={() =>
            router.push(
              "/profissional/servicos/novo"
            )
          }
        >
          <span>+</span>
          Novo serviço
        </button>
      </section>

      {carregando && (
        <div className="prof-estado">
          <span>✦</span>
          <p>Carregando seus serviços...</p>
        </div>
      )}

      {!carregando && erro && (
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

      {!carregando &&
        !erro &&
        servicos.length === 0 && (
          <div className="prof-servicos-vazio">
            <span>◇</span>

            <h2>
              Você ainda não publicou serviços
            </h2>

            <p>
              Cadastre seu primeiro serviço para
              começar a aparecer para os clientes.
            </p>

            <button
              onClick={() =>
                router.push(
                  "/profissional/servicos/novo"
                )
              }
            >
              + Cadastrar primeiro serviço
            </button>
          </div>
        )}

      {!carregando &&
        !erro &&
        servicos.length > 0 && (
          <div className="prof-servicos-grid">
            {servicos.map((servico) => (
              <ServicoProfissionalCard
                key={servico.id}
                servico={servico}
                fotoCapa={capas[servico.id]}
                onEditar={() =>
                  router.push(
                    `/profissional/servicos/${servico.id}/editar`
                  )
                }
              />
            ))}
          </div>
        )}
    </div>
  );
}

function ServicoProfissionalCard({
  servico,
  fotoCapa,
  onEditar,
}: {
  servico: Servico;
  fotoCapa?: string;
  onEditar: () => void;
}) {
  const [imagemFalhou, setImagemFalhou] =
    useState(false);

  const preco =
    servico.preco_inicial != null
      ? new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
        }).format(
          Number(servico.preco_inicial)
        )
      : "Sob consulta";

  const categoria = servico.categorias_servico;
  
  return (
    <article className="prof-servico-card">
      <div
        className="prof-servico-imagem"
        style={{
          position: "relative",
          overflow: "hidden",
        }}
      >
        {fotoCapa && !imagemFalhou ? (
          <img
            src={fotoCapa}
            alt={`Foto de capa de ${servico.nome}`}
            onError={() =>
              setImagemFalhou(true)
            }
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
        ) : (
          <span>
            {categoria?.icone || "✦"}
          </span>
        )}

        <div
          className={`prof-status ${
            servico.ativo
              ? "ativo"
              : "inativo"
          }`}
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            zIndex: 2,
          }}
        >
          {servico.ativo
            ? "Ativo"
            : "Inativo"}
        </div>
      </div>

      <div className="prof-servico-conteudo">
        <span className="prof-servico-categoria">
          {categoria?.nome || "Serviço"}
        </span>

        <h3>{servico.nome}</h3>

        <p>
          {servico.descricao ||
            "Sem descrição."}
        </p>

        <div className="prof-servico-footer">
          <strong>{preco}</strong>

          <button onClick={onEditar}>
            Editar →
          </button>
        </div>
      </div>
    </article>
  );
}
