
"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import {
  cadastrarServico,
  listarCategorias,
} from "@/controllers/servicoController";

import {
  enviarImagemServico,
} from "@/controllers/servicoImagemController";

import type {
  CategoriaServico,
} from "@/models/Servico";

interface FotoSelecionada {
  id: string;
  arquivo: File;
  preview: string;
}

const LIMITE_FOTOS = 10;
const TAMANHO_MAXIMO = 5 * 1024 * 1024;

const TIPOS_PERMITIDOS = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

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

  const [fotos, setFotos] = useState<
    FotoSelecionada[]
  >([]);

  const [carregandoCategorias, setCarregandoCategorias] =
    useState(true);

  const [salvando, setSalvando] = useState(false);
  const [progresso, setProgresso] = useState("");
  const [erro, setErro] = useState("");

  const [servicoCriadoId, setServicoCriadoId] =
    useState<string | null>(null);

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

  // Libera as URLs temporárias ao desmontar.
  useEffect(() => {
    return () => {
      fotos.forEach((foto) => {
        URL.revokeObjectURL(foto.preview);
      });
    };
  }, [fotos]);

  function selecionarFotos(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const arquivos = Array.from(
      event.target.files ?? []
    );

    event.target.value = "";

    if (arquivos.length === 0) return;

    if (
      fotos.length + arquivos.length >
      LIMITE_FOTOS
    ) {
      setErro(
        `Você pode selecionar no máximo ${LIMITE_FOTOS} fotos.`
      );
      return;
    }

    for (const arquivo of arquivos) {
      if (!TIPOS_PERMITIDOS.includes(arquivo.type)) {
        setErro(
          "Utilize apenas imagens JPG, PNG ou WebP."
        );
        return;
      }

      if (
        arquivo.size === 0 ||
        arquivo.size > TAMANHO_MAXIMO
      ) {
        setErro(
          "Cada imagem deve ter mais de 0 bytes e no máximo 5 MB."
        );
        return;
      }
    }

    const novasFotos = arquivos.map((arquivo) => ({
      id: crypto.randomUUID(),
      arquivo,
      preview: URL.createObjectURL(arquivo),
    }));

    setFotos((anteriores) => [
      ...anteriores,
      ...novasFotos,
    ]);

    setErro("");
  }

  function removerFoto(id: string) {
    setFotos((anteriores) =>
      anteriores.filter((foto) => foto.id !== id)
    );
  }

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

    const precoNumerico = preco
      ? Number(preco.replace(",", "."))
      : null;

    if (
      precoNumerico !== null &&
      (!Number.isFinite(precoNumerico) ||
        precoNumerico < 0)
    ) {
      setErro("Informe um preço válido.");
      return;
    }

    try {
      setSalvando(true);
      setErro("");

      let id = servicoCriadoId;

      if (!id) {
        setProgresso("Cadastrando serviço...");

        const servico = await cadastrarServico({
          categoria_id: categoriaId,
          nome,
          descricao,
          preco_inicial: precoNumerico,
          cidade,
          estado,
        });

        id = servico.id;
        setServicoCriadoId(id);
      }

      // Se houver falha, o cadastro já criado é
      // preservado e o usuário pode tentar novamente.
      for (let i = 0; i < fotos.length; i++) {
        setProgresso(
          `Enviando foto ${i + 1} de ${fotos.length}...`
        );

        await enviarImagemServico(
          id,
          fotos[i].arquivo
        );

        // Retira da fila apenas a foto enviada.
        setFotos((anteriores) =>
          anteriores.filter(
            (foto) => foto.id !== fotos[i].id
          )
        );
      }

      setProgresso("Serviço publicado!");
      router.push("/profissional/servicos");
      router.refresh();
    } catch (error) {
      console.error(error);

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível concluir a publicação."
      );

      setProgresso("");
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
                disabled={
                  carregandoCategorias ||
                  salvando ||
                  !!servicoCriadoId
                }
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
                disabled={salvando || !!servicoCriadoId}
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
                disabled={salvando || !!servicoCriadoId}
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
                  disabled={salvando || !!servicoCriadoId}
                />
              </div>

              <span className="novo-campo-ajuda">
                Opcional. Sem valor, aparecerá
                "Sob consulta".
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
                disabled={salvando || !!servicoCriadoId}
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
                disabled={salvando || !!servicoCriadoId}
              />
            </div>
          </div>
        </section>

        <section className="novo-servico-bloco">
          <div className="novo-bloco-header">
            <span>04</span>

            <div>
              <h2>Fotos do serviço</h2>
              <p>
                Mostre seus trabalhos e ajude os clientes
                a conhecerem seu serviço.
              </p>
            </div>
          </div>

          <div className="novo-form-grid">
            <div className="novo-form-campo campo-completo">
              <label htmlFor="fotos-servico">
                Adicionar fotos
              </label>

              <input
                id="fotos-servico"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                disabled={
                  salvando ||
                  fotos.length >= LIMITE_FOTOS
                }
                onChange={selecionarFotos}
              />

              <span className="novo-campo-ajuda">
                Até 10 fotos, com no máximo 5 MB cada.
                A primeira foto será a capa.
              </span>

              <span className="novo-contador">
                {fotos.length} foto(s) selecionada(s)
              </span>
            </div>

            {fotos.length > 0 && (
              <div
                className="campo-completo"
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fill, minmax(140px, 1fr))",
                  gap: 14,
                }}
              >
                {fotos.map((foto, index) => (
                  <div
                    key={foto.id}
                    style={{
                      border: "1px solid #242424",
                      borderRadius: 12,
                      overflow: "hidden",
                      background: "#101010",
                    }}
                  >
                    <img
                      src={foto.preview}
                      alt={`Prévia ${index + 1}`}
                      style={{
                        width: "100%",
                        height: 125,
                        objectFit: "cover",
                        display: "block",
                      }}
                    />

                    <div
                      style={{
                        padding: 10,
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 12,
                          color:
                            index === 0
                              ? "#d6aa46"
                              : "#aaa",
                        }}
                      >
                        {index === 0
                          ? "★ Foto de capa"
                          : `Foto ${index + 1}`}
                      </span>

                      <button
                        type="button"
                        disabled={salvando}
                        onClick={() =>
                          removerFoto(foto.id)
                        }
                        style={{
                          background: "transparent",
                          border: "1px solid #444",
                          borderRadius: 6,
                          color: "#fff",
                          padding: "7px 10px",
                          cursor: "pointer",
                        }}
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {erro && (
          <div className="novo-servico-erro">
            <span>!</span>
            <p>{erro}</p>
          </div>
        )}

        {progresso && (
          <p
            role="status"
            style={{
              color: "#d6aa46",
              marginTop: 12,
            }}
          >
            {progresso}
          </p>
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
              : servicoCriadoId
                ? "Continuar envio das fotos"
                : "Publicar serviço"}
          </button>
        </div>
      </form>
    </div>
  );
}
