"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import {
  InteresseRecebido,
  listarInteressesRecebidos,
  marcarInteresseComoVisualizado,
} from "@/controllers/interesseController";

export default function InteressesProfissionalPage() {
  const router = useRouter();

  const [interesses, setInteresses] =
    useState<InteresseRecebido[]>([]);

  const [carregando, setCarregando] =
    useState(true);

  const [erro, setErro] = useState("");

  const [filtro, setFiltro] =
    useState("todos");

  const carregar = useCallback(async () => {
    try {
      setCarregando(true);
      setErro("");

      const data =
        await listarInteressesRecebidos();

      setInteresses(data);
    } catch (error) {
      console.error(error);

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar os interesses."
      );
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function abrirInteresse(
    interesse: InteresseRecebido
  ) {
    try {
      if (interesse.status === "pendente") {
        await marcarInteresseComoVisualizado(
          interesse.id
        );

        setInteresses((atuais) =>
          atuais.map((item) =>
            item.id === interesse.id
              ? {
                  ...item,
                  status: "visualizado",
                }
              : item
          )
        );
      }

      router.push(
        `/profissional/interesses/${interesse.id}`
      );
    } catch (error) {
      console.error(error);

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível abrir o interesse."
      );
    }
  }

  const interessesFiltrados =
    filtro === "todos"
      ? interesses
      : interesses.filter(
          (interesse) =>
            interesse.status === filtro
        );

  const pendentes =
    interesses.filter(
      (interesse) =>
        interesse.status === "pendente"
    ).length;

  const visualizados =
    interesses.filter(
      (interesse) =>
        interesse.status === "visualizado"
    ).length;

  const respondidos =
    interesses.filter(
      (interesse) =>
        interesse.status === "respondido"
    ).length;

  return (
    <div className="prof-interesses-page">
      <section className="prof-pagina-header">
        <div>
          <span className="prof-dashboard-label">
            SOLICITAÇÕES
          </span>

          <h1>Interesses recebidos</h1>

          <p>
            Veja clientes interessados nos seus
            serviços e prepare propostas para
            transformar oportunidades em eventos.
          </p>
        </div>
      </section>

      <section className="interesses-resumo">
        <Resumo
          numero={interesses.length}
          titulo="Total"
        />

        <Resumo
          numero={pendentes}
          titulo="Pendentes"
        />

        <Resumo
          numero={visualizados}
          titulo="Visualizados"
        />

        <Resumo
          numero={respondidos}
          titulo="Respondidos"
        />
      </section>

      <section className="interesses-toolbar">
        <div className="interesses-filtros">
          <button
            className={
              filtro === "todos"
                ? "ativo"
                : ""
            }
            onClick={() =>
              setFiltro("todos")
            }
          >
            Todos
          </button>

          <button
            className={
              filtro === "pendente"
                ? "ativo"
                : ""
            }
            onClick={() =>
              setFiltro("pendente")
            }
          >
            Pendentes
          </button>

          <button
            className={
              filtro === "visualizado"
                ? "ativo"
                : ""
            }
            onClick={() =>
              setFiltro("visualizado")
            }
          >
            Visualizados
          </button>

          <button
            className={
              filtro === "respondido"
                ? "ativo"
                : ""
            }
            onClick={() =>
              setFiltro("respondido")
            }
          >
            Respondidos
          </button>
        </div>

        <button
          className="interesses-atualizar"
          onClick={carregar}
        >
          ↻ Atualizar
        </button>
      </section>

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

      {carregando && (
        <div className="prof-estado">
          <span>✦</span>

          <p>
            Carregando interesses...
          </p>
        </div>
      )}

      {!carregando &&
        !erro &&
        interessesFiltrados.length ===
          0 && (
          <div className="prof-servicos-vazio">
            <span>♡</span>

            <h2>
              Nenhum interesse por aqui
            </h2>

            <p>
              Quando um cliente demonstrar
              interesse em um dos seus serviços,
              ele aparecerá aqui.
            </p>
          </div>
        )}

      {!carregando &&
        !erro &&
        interessesFiltrados.length >
          0 && (
          <div className="interesses-lista">
            {interessesFiltrados.map(
              (interesse) => (
                <InteresseCard
                  key={interesse.id}
                  interesse={interesse}
                  onAbrir={() =>
                    abrirInteresse(
                      interesse
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

function Resumo({
  numero,
  titulo,
}: {
  numero: number;
  titulo: string;
}) {
  return (
    <div className="interesses-resumo-card">
      <strong>{numero}</strong>
      <span>{titulo}</span>
    </div>
  );
}

function InteresseCard({
  interesse,
  onAbrir,
}: {
  interesse: InteresseRecebido;
  onAbrir: () => void;
}) {
  const data = new Intl.DateTimeFormat(
    "pt-BR",
    {
      dateStyle: "medium",
    }
  ).format(
    new Date(interesse.criado_em)
  );

  const nomeServico =
    interesse.servicos?.nome ||
    "Serviço";

  const categoria =
    interesse.servicos
      ?.categorias_servico?.nome ||
    "Serviço";

  const icone =
    interesse.servicos
      ?.categorias_servico?.icone ||
    "✦";

  return (
    <article
      className={`interesse-card ${
        interesse.status === "pendente"
          ? "novo"
          : ""
      }`}
    >
      <div className="interesse-card-icone">
        {icone}
      </div>

      <div className="interesse-card-conteudo">
        <div className="interesse-card-topo">
          <div>
            <span className="interesse-card-categoria">
              {categoria}
            </span>

            <h3>{nomeServico}</h3>
          </div>

          <StatusBadge
            status={interesse.status}
          />
        </div>

        {interesse.mensagem && (
          <p className="interesse-card-mensagem">
            “{interesse.mensagem}”
          </p>
        )}

        <div className="interesse-card-info">
          {interesse.data_evento && (
            <span>
              ◇{" "}
              {new Intl.DateTimeFormat(
                "pt-BR"
              ).format(
                new Date(
                  `${interesse.data_evento}T12:00:00`
                )
              )}
            </span>
          )}

          {interesse.quantidade_convidados !=
            null && (
            <span>
              ○{" "}
              {
                interesse.quantidade_convidados
              }{" "}
              convidados
            </span>
          )}

          {interesse.cidade && (
            <span>
              ⌖ {interesse.cidade}
              {interesse.estado
                ? ` - ${interesse.estado}`
                : ""}
            </span>
          )}

          <span>{data}</span>
        </div>
      </div>

      <button
        className="interesse-card-abrir"
        onClick={onAbrir}
      >
        {interesse.status ===
        "respondido"
          ? "Ver detalhes"
          : "Abrir solicitação"}{" "}
        →
      </button>
    </article>
  );
}

function StatusBadge({
  status,
}: {
  status: InteresseRecebido["status"];
}) {
  const nomes = {
    pendente: "Pendente",
    visualizado: "Visualizado",
    respondido: "Respondido",
    cancelado: "Cancelado",
  };

  return (
    <span
      className={`interesse-status status-${status}`}
    >
      {nomes[status]}
    </span>
  );
}