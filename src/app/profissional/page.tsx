
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
  listarInteressesRecebidos,
} from "@/controllers/interesseController";

import {
  listarOrcamentosProfissional,
} from "@/controllers/orcamentoController";

import {
  listarEventosPublicos,
} from "@/controllers/eventoController";

export default function ProfissionalPage() {
  const router = useRouter();

  const [servicosAtivos, setServicosAtivos] =
    useState(0);

  const [totalInteresses, setTotalInteresses] =
    useState(0);

  const [totalOportunidades, setTotalOportunidades] =
    useState(0);

  const [totalOrcamentos, setTotalOrcamentos] =
    useState(0);

  const [carregando, setCarregando] =
    useState(true);

  const [erro, setErro] = useState("");

  const carregarResumo = useCallback(async () => {
    try {
      setCarregando(true);
      setErro("");

      const [
        servicos,
        interesses,
        orcamentos,
        eventos,
      ] = await Promise.all([
        listarMeusServicos(),
        listarInteressesRecebidos(),
        listarOrcamentosProfissional(),
        listarEventosPublicos(),
      ]);

      // Conta somente os serviços ativos.
      setServicosAtivos(
        servicos.filter(
          (servico) => servico.ativo === true
        ).length
      );

      // Total de interesses recebidos.
      setTotalInteresses(interesses.length);

      // Total de oportunidades disponíveis.
      setTotalOportunidades(eventos.length);

      // Total de orçamentos.
      setTotalOrcamentos(orcamentos.length);

    } catch (error) {
      console.error(
        "Erro ao carregar resumo profissional:",
        error
      );

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar os indicadores."
      );
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void carregarResumo();
  }, [carregarResumo]);

  return (
    <div className="prof-home">
      <section className="prof-boas-vindas">
        <div>
          <span className="prof-dashboard-label">
            SEU NEGÓCIO
          </span>

          <h1>
            Transforme oportunidades em celebrações.
          </h1>

          <p>
            Gerencie seus serviços, encontre eventos e
            acompanhe clientes interessados no seu trabalho.
          </p>
        </div>

        <button
          className="prof-btn-principal"
          onClick={() =>
            router.push("/profissional/servicos/novo")
          }
        >
          <span>+</span>
          Cadastrar serviço
        </button>
      </section>

      {erro && (
        <div className="prof-erro-box">
          <strong>
            Não foi possível atualizar os indicadores.
          </strong>

          <p>{erro}</p>

          <button
            onClick={() => void carregarResumo()}
          >
            Tentar novamente
          </button>
        </div>
      )}

      <section className="prof-resumo">
        <ResumoCard
          numero={
            carregando ? "..." : servicosAtivos
          }
          titulo="Serviços ativos"
          descricao="Serviços publicados no marketplace"
          icone="◇"
          onClick={() =>
            router.push("/profissional/servicos")
          }
        />

        <ResumoCard
          numero={
            carregando ? "..." : totalInteresses
          }
          titulo="Interesses"
          descricao="Clientes interessados em seus serviços"
          icone="♡"
          onClick={() =>
            router.push("/profissional/interesses")
          }
        />

        <ResumoCard
          numero={
            carregando ? "..." : totalOportunidades
          }
          titulo="Oportunidades"
          descricao="Eventos procurando profissionais"
          icone="✦"
          onClick={() =>
            router.push("/profissional/eventos")
          }
        />

        <ResumoCard
          numero={
            carregando ? "..." : totalOrcamentos
          }
          titulo="Orçamentos"
          descricao="Propostas enviadas aos clientes"
          icone="▤"
          onClick={() =>
            router.push("/profissional/orcamentos")
          }
        />
      </section>

      <section className="prof-dashboard-bloco">
        <div>
          <span className="prof-dashboard-label">
            MARKETPLACE
          </span>

          <h2>Seus serviços</h2>

          <p>
            Cadastre os serviços oferecidos pelo seu
            negócio. Eles ficarão disponíveis para os
            clientes explorarem por categoria.
          </p>
        </div>

        <div className="prof-dashboard-ilustracao">
          <span>◇</span>

          <h3>Publique seu primeiro serviço</h3>

          <p>
            Adicione categoria, descrição, preço inicial
            e localização.
          </p>

          <button
            onClick={() =>
              router.push("/profissional/servicos/novo")
            }
          >
            Cadastrar serviço →
          </button>
        </div>
      </section>
    </div>
  );
}

function ResumoCard({
  numero,
  titulo,
  descricao,
  icone,
  onClick,
}: {
  numero: number | string;
  titulo: string;
  descricao: string;
  icone: string;
  onClick: () => void;
}) {
  return (
    <button
      className="prof-resumo-card"
      onClick={onClick}
    >
      <div className="prof-resumo-topo">
        <span>{icone}</span>
        <span>→</span>
      </div>

      <strong>{numero}</strong>

      <h3>{titulo}</h3>

      <p>{descricao}</p>
    </button>
  );
}