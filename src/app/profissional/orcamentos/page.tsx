"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  listarOrcamentosProfissional,
  OrcamentoProfissional,
} from "@/controllers/orcamentoController";

export default function OrcamentosProfissionalPage() {
  const [orcamentos, setOrcamentos] =
    useState<OrcamentoProfissional[]>([]);

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
        await listarOrcamentosProfissional();

      setOrcamentos(data);
    } catch (error) {
      console.error(error);

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar os orçamentos."
      );
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const filtrados =
    filtro === "todos"
      ? orcamentos
      : orcamentos.filter(
          (orcamento) =>
            orcamento.status === filtro
        );

  const pendentes = orcamentos.filter(
    (item) => item.status === "pendente"
  ).length;

  const aceitos = orcamentos.filter(
    (item) => item.status === "aceito"
  ).length;

  const recusados = orcamentos.filter(
    (item) => item.status === "recusado"
  ).length;

  const valorAceito = orcamentos
    .filter(
      (item) => item.status === "aceito"
    )
    .reduce(
      (total, item) =>
        total + Number(item.valor),
      0
    );

  return (
    <div className="prof-orcamentos-page">
      <section className="prof-pagina-header">
        <div>
          <span className="prof-dashboard-label">
            PROPOSTAS
          </span>

          <h1>Meus orçamentos</h1>

          <p>
            Acompanhe as propostas enviadas e
            veja quais clientes aceitaram ou
            recusaram seus orçamentos.
          </p>
        </div>
      </section>

      <section className="prof-orcamentos-resumo">
        <Resumo
          numero={orcamentos.length}
          titulo="Enviados"
        />

        <Resumo
          numero={pendentes}
          titulo="Aguardando resposta"
        />

        <Resumo
          numero={aceitos}
          titulo="Aceitos"
        />

        <Resumo
          numero={recusados}
          titulo="Recusados"
        />

        <div className="prof-orcamento-resumo-card destaque">
          <strong>
            {formatarDinheiro(valorAceito)}
          </strong>

          <span>
            Valor em propostas aceitas
          </span>
        </div>
      </section>

      <section className="prof-orcamentos-toolbar">
        <div className="prof-orcamentos-filtros">
          <Filtro
            ativo={filtro === "todos"}
            onClick={() =>
              setFiltro("todos")
            }
          >
            Todos
          </Filtro>

          <Filtro
            ativo={filtro === "pendente"}
            onClick={() =>
              setFiltro("pendente")
            }
          >
            Pendentes
          </Filtro>

          <Filtro
            ativo={filtro === "aceito"}
            onClick={() =>
              setFiltro("aceito")
            }
          >
            Aceitos
          </Filtro>

          <Filtro
            ativo={filtro === "recusado"}
            onClick={() =>
              setFiltro("recusado")
            }
          >
            Recusados
          </Filtro>
        </div>

        <button
          className="prof-orcamentos-atualizar"
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
            Carregando orçamentos...
          </p>
        </div>
      )}

      {!carregando &&
        !erro &&
        filtrados.length === 0 && (
          <div className="prof-servicos-vazio">
            <span>◇</span>

            <h2>
              Nenhum orçamento encontrado
            </h2>

            <p>
              As propostas enviadas aos seus
              clientes aparecerão aqui.
            </p>
          </div>
        )}

      {!carregando &&
        !erro &&
        filtrados.length > 0 && (
          <div className="prof-orcamentos-lista">
            {filtrados.map(
              (orcamento) => (
                <OrcamentoCard
                  key={orcamento.id}
                  orcamento={orcamento}
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
    <div className="prof-orcamento-resumo-card">
      <strong>{numero}</strong>
      <span>{titulo}</span>
    </div>
  );
}

function Filtro({
  ativo,
  onClick,
  children,
}: {
  ativo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      className={ativo ? "ativo" : ""}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function OrcamentoCard({
  orcamento,
}: {
  orcamento: OrcamentoProfissional;
}) {
  const nomeServico =
    orcamento.servicos?.nome ||
    (orcamento.origem === "evento"
      ? "Proposta para evento"
      : "Serviço");

  const categoria =
    orcamento.servicos
      ?.categorias_servico?.nome;

  const icone =
    orcamento.servicos
      ?.categorias_servico?.icone ||
    "✦";

  const data =
    new Intl.DateTimeFormat(
      "pt-BR"
    ).format(
      new Date(orcamento.criado_em)
    );

  return (
    <article className="prof-orcamento-card">
      <div className="prof-orcamento-icone">
        {icone}
      </div>

      <div className="prof-orcamento-conteudo">
        <div className="prof-orcamento-topo">
          <div>
            <span>
              {categoria ||
                (orcamento.origem ===
                "evento"
                  ? "Evento"
                  : "Proposta")}
            </span>

            <h3>
              {orcamento.titulo ||
                nomeServico}
            </h3>

            <small>
              {nomeServico}
            </small>
          </div>

          <Status
            status={orcamento.status}
          />
        </div>

        <p>
          {orcamento.descricao}
        </p>

        <div className="prof-orcamento-rodape">
          <strong>
            {formatarDinheiro(
              orcamento.valor
            )}
          </strong>

          <span>
            Enviado em {data}
          </span>

          {orcamento.validade && (
            <span>
              Validade:{" "}
              {formatarData(
                orcamento.validade
              )}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

function Status({
  status,
}: {
  status: OrcamentoProfissional["status"];
}) {
  const nomes = {
    pendente: "Aguardando cliente",
    aceito: "Aceito",
    recusado: "Recusado",
    cancelado: "Cancelado",
    expirado: "Expirado",
  };

  return (
    <span
      className={`prof-orcamento-status prof-orcamento-${status}`}
    >
      {nomes[status]}
    </span>
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

function formatarData(
  data: string
) {
  return new Intl.DateTimeFormat(
    "pt-BR"
  ).format(
    new Date(`${data}T12:00:00`)
  );
}