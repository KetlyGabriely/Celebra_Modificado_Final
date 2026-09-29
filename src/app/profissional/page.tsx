"use client";

import { useRouter } from "next/navigation";

export default function ProfissionalPage() {
  const router = useRouter();

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
            router.push(
              "/profissional/servicos/novo"
            )
          }
        >
          <span>+</span>
          Cadastrar serviço
        </button>
      </section>

      <section className="prof-resumo">
        <ResumoCard
          numero="0"
          titulo="Serviços ativos"
          descricao="Serviços publicados no marketplace"
          icone="◇"
          onClick={() =>
            router.push("/profissional/servicos")
          }
        />

        <ResumoCard
          numero="0"
          titulo="Interesses"
          descricao="Clientes interessados em seus serviços"
          icone="♡"
          onClick={() =>
            router.push(
              "/profissional/interesses"
            )
          }
        />

        <ResumoCard
          numero="0"
          titulo="Oportunidades"
          descricao="Eventos procurando profissionais"
          icone="✦"
          onClick={() =>
            router.push(
              "/profissional/eventos"
            )
          }
        />

        <ResumoCard
          numero="0"
          titulo="Orçamentos"
          descricao="Propostas enviadas aos clientes"
          icone="▤"
          onClick={() =>
            router.push(
              "/profissional/orcamentos"
            )
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
              router.push(
                "/profissional/servicos/novo"
              )
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
  numero: string;
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