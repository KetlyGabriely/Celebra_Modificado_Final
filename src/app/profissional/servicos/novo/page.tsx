"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import {
  cadastrarServico,
  listarCategorias,
} from "@/controllers/servicoController";

import type {
  CategoriaServico,
} from "@/models/Servico";


export default function NovoServicoPage() {
  const router = useRouter();

  const [categorias, setCategorias] = useState<
    CategoriaServico[]
  >([]);

  const [categoriaId, setCategoriaId] = useState("");
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [preco, setPreco] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");

  const [carregandoCategorias, setCarregandoCategorias] =
    useState(true);

  const [salvando, setSalvando] = useState(false);

  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregarCategorias() {
      try {
        setCarregandoCategorias(true);

        const data = await listarCategorias();

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

  async function cadastrar(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!categoriaId) {
      setErro("Selecione uma categoria.");
      return;
    }

    if (!nome.trim()) {
      setErro("Informe o nome do serviço.");
      return;
    }

    if (preco && Number(preco) < 0) {
      setErro("O preço não pode ser negativo.");
      return;
    }

    try {
      setSalvando(true);
      setErro("");

      await cadastrarServico({
        categoria_id: categoriaId,
        nome,
        descricao,

        preco_inicial: preco
          ? Number(preco.replace(",", "."))
          : null,

        cidade,
        estado,
      });

      router.push("/profissional/servicos");
      router.refresh();
    } catch (error) {
      console.error(error);

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível cadastrar o serviço."
      );
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="novo-servico-page">
      <div className="novo-servico-voltar">
        <button
          type="button"
          onClick={() =>
            router.push("/profissional/servicos")
          }
        >
          ← Voltar para meus serviços
        </button>
      </div>

      <section className="novo-servico-header">
        <span className="prof-dashboard-label">
          NOVO SERVIÇO
        </span>

        <h1>Publique seu serviço.</h1>

        <p>
          As informações cadastradas aqui serão exibidas
          para clientes no marketplace Celebra.
        </p>
      </section>

      <form
        className="novo-servico-form"
        onSubmit={cadastrar}
      >
        <section className="novo-servico-bloco">
          <div className="novo-bloco-header">
            <span>01</span>

            <div>
              <h2>Informações principais</h2>

              <p>
                Conte aos clientes o que você oferece.
              </p>
            </div>
          </div>

          <div className="novo-form-grid">
            <div className="novo-form-campo campo-completo">
              <label htmlFor="categoria">
                Categoria *
              </label>

              <select
                id="categoria"
                value={categoriaId}
                onChange={(event) =>
                  setCategoriaId(event.target.value)
                }
                disabled={carregandoCategorias}
                required
              >
                <option value="">
                  {carregandoCategorias
                    ? "Carregando categorias..."
                    : "Selecione uma categoria"}
                </option>

                {categorias.map((categoria) => (
                  <option
                    key={categoria.id}
                    value={categoria.id}
                  >
                    {categoria.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="novo-form-campo campo-completo">
              <label htmlFor="nome">
                Nome do serviço *
              </label>

              <input
                id="nome"
                type="text"
                value={nome}
                onChange={(event) =>
                  setNome(event.target.value)
                }
                placeholder="Ex.: Buffet completo para casamentos"
                maxLength={120}
                required
              />

              <span className="novo-campo-ajuda">
                Escolha um nome claro e fácil de entender.
              </span>
            </div>

            <div className="novo-form-campo campo-completo">
              <label htmlFor="descricao">
                Descrição
              </label>

              <textarea
                id="descricao"
                value={descricao}
                onChange={(event) =>
                  setDescricao(event.target.value)
                }
                placeholder="Descreva o que está incluso, diferenciais e informações importantes..."
                rows={7}
                maxLength={1500}
              />

              <span className="novo-contador">
                {descricao.length}/1500
              </span>
            </div>
          </div>
        </section>

        <section className="novo-servico-bloco">
          <div className="novo-bloco-header">
            <span>02</span>

            <div>
              <h2>Preço</h2>

              <p>
                Informe um valor inicial ou deixe em branco
                para trabalhar sob consulta.
              </p>
            </div>
          </div>

          <div className="novo-form-grid">
            <div className="novo-form-campo">
              <label htmlFor="preco">
                Preço inicial
              </label>

              <div className="novo-input-preco">
                <span>R$</span>

                <input
                  id="preco"
                  type="number"
                  min="0"
                  step="0.01"
                  value={preco}
                  onChange={(event) =>
                    setPreco(event.target.value)
                  }
                  placeholder="0,00"
                />
              </div>

              <span className="novo-campo-ajuda">
                Opcional. Sem valor, aparecerá "Sob consulta".
              </span>
            </div>
          </div>
        </section>

        <section className="novo-servico-bloco">
          <div className="novo-bloco-header">
            <span>03</span>

            <div>
              <h2>Localização</h2>

              <p>
                Informe onde o serviço está disponível.
              </p>
            </div>
          </div>

          <div className="novo-form-grid localizacao-grid">
            <div className="novo-form-campo">
              <label htmlFor="cidade">
                Cidade
              </label>

              <input
                id="cidade"
                type="text"
                value={cidade}
                onChange={(event) =>
                  setCidade(event.target.value)
                }
                placeholder="Ex.: Itapetininga"
                maxLength={100}
              />
            </div>

            <div className="novo-form-campo estado-campo">
              <label htmlFor="estado">
                Estado
              </label>

              <input
                id="estado"
                type="text"
                value={estado}
                onChange={(event) =>
                  setEstado(
                    event.target.value
                      .toUpperCase()
                      .slice(0, 2)
                  )
                }
                placeholder="SP"
                maxLength={2}
              />
            </div>
          </div>
        </section>

        {erro && (
          <div className="novo-servico-erro">
            <span>!</span>

            <p>{erro}</p>
          </div>
        )}

        <div className="novo-servico-acoes">
          <button
            type="button"
            className="novo-btn-cancelar"
            onClick={() =>
              router.push("/profissional/servicos")
            }
            disabled={salvando}
          >
            Cancelar
          </button>

          <button
            type="submit"
            className="prof-btn-principal"
            disabled={
              salvando ||
              carregandoCategorias
            }
          >
            {salvando
              ? "Publicando..."
              : "Publicar serviço"}
          </button>
        </div>
      </form>
    </div>
  );
}