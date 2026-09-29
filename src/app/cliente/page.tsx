"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { buscarMeuPerfil } from "@/controllers/authController";

export default function ClientePage() {
  const router = useRouter();

  const [nome, setNome] = useState("Cliente");

  useEffect(() => {
    async function carregar() {
      try {
        const perfil = await buscarMeuPerfil();

        if (perfil?.nome) {
          setNome(perfil.nome.split(" ")[0]);
        }
      } catch (error) {
        console.error(error);
      }
    }

    carregar();
  }, []);

  return (
    <div className="cliente-home">
      {/* APRESENTAÇÃO */}

      <section className="cliente-boas-vindas">
        <div>
          <span className="dashboard-label">
            SEU PAINEL
          </span>

          <h1>
            Olá, {nome}.
          </h1>

          <p>
            Vamos transformar seu próximo momento
            especial em uma celebração inesquecível.
          </p>
        </div>

        <div className="boas-vindas-acoes">
          <button
            className="btn-explorar"
            onClick={() =>
              router.push("/cliente/servicos")
            }
          >
            Explorar serviços
          </button>

          <button
            className="btn-criar-evento"
            onClick={() =>
              router.push("/cliente/eventos/novo")
            }
          >
            <span>+</span>
            Criar evento
          </button>
        </div>
      </section>

      {/* RESUMO */}

      <section className="dashboard-resumo">
        <DashboardCard
          icone="♡"
          numero="0"
          titulo="Meus eventos"
          descricao="Eventos que você está organizando"
          onClick={() =>
            router.push("/cliente/eventos")
          }
        />

        <DashboardCard
          icone="✦"
          numero="0"
          titulo="Interesses"
          descricao="Serviços que chamaram sua atenção"
          onClick={() =>
            router.push("/cliente/interesses")
          }
        />

        <DashboardCard
          icone="▤"
          numero="0"
          titulo="Orçamentos"
          descricao="Propostas recebidas de profissionais"
          onClick={() =>
            router.push("/cliente/orcamentos")
          }
        />

        <DashboardCard
          icone="☆"
          numero="0"
          titulo="Favoritos"
          descricao="Serviços salvos para consultar depois"
          onClick={() =>
            router.push("/cliente/favoritos")
          }
        />
      </section>

      {/* EXPLORAR */}

      <section className="dashboard-secao">
        <div className="dashboard-secao-header">
          <div>
            <span className="dashboard-label">
              ENCONTRE O QUE PRECISA
            </span>

            <h2>Explore por categoria</h2>

            <p>
              Você não precisa criar um evento para
              começar a procurar profissionais.
            </p>
          </div>

          <button
            className="link-dourado"
            onClick={() =>
              router.push("/cliente/servicos")
            }
          >
            Ver todos →
          </button>
        </div>

        <div className="categorias-grid">
          <Categoria
            icone="⌂"
            nome="Espaços"
            descricao="Locais para sua celebração"
            onClick={() =>
              router.push(
                "/cliente/servicos?categoria=espaco"
              )
            }
          />

          <Categoria
            icone="♨"
            nome="Buffet"
            descricao="Sabores para o seu evento"
            onClick={() =>
              router.push(
                "/cliente/servicos?categoria=buffet"
              )
            }
          />

          <Categoria
            icone="✿"
            nome="Decoração"
            descricao="Ambientes únicos e especiais"
            onClick={() =>
              router.push(
                "/cliente/servicos?categoria=decoracao"
              )
            }
          />

          <Categoria
            icone="◉"
            nome="Fotografia"
            descricao="Registre cada momento"
            onClick={() =>
              router.push(
                "/cliente/servicos?categoria=fotografia"
              )
            }
          />

          <Categoria
            icone="♫"
            nome="Música"
            descricao="A trilha sonora da celebração"
            onClick={() =>
              router.push(
                "/cliente/servicos?categoria=musica"
              )
            }
          />

          <Categoria
            icone="◇"
            nome="Outros"
            descricao="Veja todos os serviços"
            onClick={() =>
              router.push("/cliente/servicos")
            }
          />
        </div>
      </section>

      {/* COMEÇAR */}

      <section className="dashboard-chamada">
        <div className="chamada-simbolo">
          ✦
        </div>

        <div>
          <span className="dashboard-label">
            COMECE DO SEU JEITO
          </span>

          <h2>
            Ainda não criou um evento?
          </h2>

          <p>
            Sem problema. Explore os serviços disponíveis,
            favorite profissionais e demonstre interesse.
            Quando quiser, você também pode criar seu evento.
          </p>
        </div>

        <button
          onClick={() =>
            router.push("/cliente/servicos")
          }
        >
          Descobrir serviços →
        </button>
      </section>
    </div>
  );
}

function DashboardCard({
  icone,
  numero,
  titulo,
  descricao,
  onClick,
}: {
  icone: string;
  numero: string;
  titulo: string;
  descricao: string;
  onClick: () => void;
}) {
  return (
    <button
      className="dashboard-card"
      onClick={onClick}
    >
      <div className="dashboard-card-topo">
        <div className="dashboard-card-icone">
          {icone}
        </div>

        <span>→</span>
      </div>

      <strong className="dashboard-numero">
        {numero}
      </strong>

      <h3>{titulo}</h3>

      <p>{descricao}</p>
    </button>
  );
}

function Categoria({
  icone,
  nome,
  descricao,
  onClick,
}: {
  icone: string;
  nome: string;
  descricao: string;
  onClick: () => void;
}) {
  return (
    <button
      className="categoria-card"
      onClick={onClick}
    >
      <div className="categoria-icone">
        {icone}
      </div>

      <div>
        <h3>{nome}</h3>
        <p>{descricao}</p>
      </div>

      <span className="categoria-seta">
        →
      </span>
    </button>
  );
}