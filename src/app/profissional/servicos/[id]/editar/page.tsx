
"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useState,
} from "react";

import {
  useParams,
  useRouter,
} from "next/navigation";

import {
  atualizarServico,
  listarCategorias,
  listarMeusServicos,
} from "@/controllers/servicoController";

import {
  definirCapaServico,
  enviarImagemServico,
  listarImagensServico,
  removerImagemServico,
} from "@/controllers/servicoImagemController";

import type {
  CategoriaServico,
} from "@/models/Servico";

import type {
  ImagemServico,
} from "@/controllers/servicoImagemController";

const MAX_FOTOS = 10;
const MAX_BYTES = 5 * 1024 * 1024;

const TIPOS = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

interface FotoPendente {
  id: string;
  arquivo: File;
  preview: string;
}

export default function EditarServicoPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [categorias, setCategorias] =
    useState<CategoriaServico[]>([]);

  const [categoriaId, setCategoriaId] =
    useState("");

  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [preco, setPreco] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [ativo, setAtivo] = useState(true);

  const [imagens, setImagens] =
    useState<ImagemServico[]>([]);

  const [pendentes, setPendentes] =
    useState<FotoPendente[]>([]);

  const [carregando, setCarregando] =
    useState(true);

  const [salvando, setSalvando] =
    useState(false);

  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [progresso, setProgresso] = useState("");

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      try {
        setCarregando(true);
        setErro("");

        const [lista, servicos, fotos] =
          await Promise.all([
            listarCategorias(),
            listarMeusServicos(),
            listarImagensServico(id),
          ]);

        if (!ativo) return;

        const servico = servicos.find(
          (item) => item.id === id
        );

        if (!servico) {
          throw new Error(
            "Serviço não encontrado ou sem permissão."
          );
        }

        setCategorias(lista);
        setCategoriaId(servico.categoria_id);
        setNome(servico.nome);
        setDescricao(servico.descricao ?? "");
        setPreco(
          servico.preco_inicial != null
            ? String(servico.preco_inicial)
            : ""
        );
        setCidade(servico.cidade ?? "");
        setEstado(servico.estado ?? "");
        setAtivo(servico.ativo);
        setImagens(fotos);
      } catch (error) {
        if (!ativo) return;

        setErro(
          error instanceof Error
            ? error.message
            : "Erro ao carregar serviço."
        );
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    if (id) void carregar();

    return () => {
      ativo = false;
    };
  }, [id]);

  useEffect(() => {
    return () => {
      pendentes.forEach((foto) =>
        URL.revokeObjectURL(foto.preview)
      );
    };
  }, [pendentes]);

  function selecionarFotos(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const arquivos = Array.from(
      event.target.files ?? []
    );

    event.target.value = "";

    if (
      imagens.length +
      pendentes.length +
      arquivos.length >
      MAX_FOTOS
    ) {
      setErro("Limite de 10 fotos por serviço.");
      return;
    }

    for (const arquivo of arquivos) {
      if (!TIPOS.includes(arquivo.type)) {
        setErro(
          "Use apenas JPG, PNG ou WebP."
        );
        return;
      }

      if (
        arquivo.size === 0 ||
        arquivo.size > MAX_BYTES
      ) {
        setErro(
          "Cada imagem deve ter no máximo 5 MB."
        );
        return;
      }
    }

    const novas = arquivos.map((arquivo) => ({
      id: crypto.randomUUID(),
      arquivo,
      preview: URL.createObjectURL(arquivo),
    }));

    setPendentes((anteriores) => [
      ...anteriores,
      ...novas,
    ]);

    setErro("");
    setSucesso("");
  }

  function removerPendente(fotoId: string) {
    setPendentes((anteriores) =>
      anteriores.filter(
        (foto) => foto.id !== fotoId
      )
    );
  }


  async function alterarCapa(imagemId: string) {
    if (salvando) return;

    try {
      setSalvando(true);
      setErro("");
      setSucesso("");

      await definirCapaServico(id, imagemId);

      const fotosAtualizadas =
        await listarImagensServico(id);

      setImagens(fotosAtualizadas);

      setSucesso(
        "Foto de capa atualizada com sucesso!"
      );
    } catch (error) {
      console.error(
        "Erro ao definir foto de capa:",
        error
      );

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível alterar a foto de capa."
      );
    } finally {
      setSalvando(false);
    }
  }


  async function removerExistente(
    imagemId: string
  ) {
    if (salvando) return;

    const confirmou = window.confirm(
      "Deseja remover esta foto permanentemente?"
    );

    if (!confirmou) return;

    try {
      setSalvando(true);
      setErro("");
      setSucesso("");

      await removerImagemServico(id, imagemId);

      const atualizadas =
        await listarImagensServico(id);

      setImagens(atualizadas);
      setSucesso("Foto removida.");
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Erro ao remover foto."
      );
    } finally {
      setSalvando(false);
    }
  }

  async function salvar(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!categoriaId || !nome.trim()) {
      setErro(
        "Preencha a categoria e o nome."
      );
      return;
    }

    const precoNumerico = preco.trim()
      ? Number(preco.replace(",", "."))
      : null;

    if (
      precoNumerico !== null &&
      (!Number.isFinite(precoNumerico) ||
        precoNumerico < 0)
    ) {
      setErro("Preço inválido.");
      return;
    }

    try {
      setSalvando(true);
      setErro("");
      setSucesso("");

      setProgresso("Salvando informações...");

      await atualizarServico(id, {
        categoria_id: categoriaId,
        nome,
        descricao,
        preco_inicial: precoNumerico,
        cidade,
        estado,
        ativo,
      });

      for (let i = 0; i < pendentes.length; i++) {
        const foto = pendentes[i];

        setProgresso(
          `Enviando foto ${i + 1} de ${pendentes.length}...`
        );

        await enviarImagemServico(
          id,
          foto.arquivo
        );

        setPendentes((anteriores) =>
          anteriores.filter(
            (item) => item.id !== foto.id
          )
        );
      }

      const fotosAtualizadas =
        await listarImagensServico(id);

      setImagens(fotosAtualizadas);

      setProgresso("");
      setSucesso(
        "Serviço atualizado com sucesso!"
      );
    } catch (error) {
      setProgresso("");

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar."
      );
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return (
      <div className="prof-estado">
        <span>✦</span>
        <p>Carregando serviço...</p>
      </div>
    );
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
          EDITAR SERVIÇO
        </span>

        <h1>Personalize seu serviço.</h1>

        <p>
          Atualize as informações e as fotos
          exibidas no marketplace Celebra.
        </p>
      </section>

      {erro && (
        <div className="novo-servico-erro">
          <span>!</span>
          <p>{erro}</p>
        </div>
      )}

      <form
        className="novo-servico-form"
        onSubmit={salvar}
      >
        <section className="novo-servico-bloco">
          <div className="novo-bloco-header">
            <span>01</span>
            <div>
              <h2>Informações principais</h2>
              <p>
                Atualize os dados do seu serviço.
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
                onChange={(e) =>
                  setCategoriaId(e.target.value)
                }
                disabled={salvando}
                required
              >
                <option value="">
                  Selecione uma categoria
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
                value={nome}
                onChange={(e) =>
                  setNome(e.target.value)
                }
                maxLength={120}
                disabled={salvando}
                required
              />
            </div>

            <div className="novo-form-campo campo-completo">
              <label htmlFor="descricao">
                Descrição
              </label>

              <textarea
                id="descricao"
                value={descricao}
                onChange={(e) =>
                  setDescricao(e.target.value)
                }
                rows={7}
                maxLength={1500}
                disabled={salvando}
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
              <h2>Preço e localização</h2>
              <p>
                Defina o valor e a região atendida.
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
                  onChange={(e) =>
                    setPreco(e.target.value)
                  }
                  disabled={salvando}
                />
              </div>
            </div>

            <div className="novo-form-campo">
              <label htmlFor="cidade">
                Cidade
              </label>

              <input
                id="cidade"
                value={cidade}
                onChange={(e) =>
                  setCidade(e.target.value)
                }
                disabled={salvando}
              />
            </div>

            <div className="novo-form-campo estado-campo">
              <label htmlFor="estado">
                Estado
              </label>

              <input
                id="estado"
                value={estado}
                onChange={(e) =>
                  setEstado(
                    e.target.value
                      .toUpperCase()
                      .slice(0, 2)
                  )
                }
                maxLength={2}
                disabled={salvando}
              />
            </div>
          </div>
        </section>

        <section className="novo-servico-bloco">
          <div className="novo-bloco-header">
            <span>03</span>
            <div>
              <h2>Status do serviço</h2>
              <p>
                Controle a disponibilidade
                do anúncio no marketplace.
              </p>
            </div>
          </div>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              color: "#fff",
            }}
          >
            <input
              type="checkbox"
              checked={ativo}
              onChange={(e) =>
                setAtivo(e.target.checked)
              }
              disabled={salvando}
            />
            Serviço ativo
          </label>
        </section>

        <section className="novo-servico-bloco">
          <div className="novo-bloco-header">
            <span>04</span>
            <div>
              <h2>Galeria de fotos</h2>
              <p>
                Gerencie as imagens dos seus trabalhos.
              </p>
            </div>
          </div>

          <div className="novo-form-campo campo-completo">
            <label htmlFor="fotos">
              Adicionar novas fotos
            </label>

            <input
              id="fotos"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              disabled={
                salvando ||
                imagens.length +
                pendentes.length >=
                MAX_FOTOS
              }
              onChange={selecionarFotos}
            />

            <span className="novo-campo-ajuda">
              Até 10 fotos por serviço, 5 MB cada.
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fill, minmax(150px, 1fr))",
              gap: 14,
              marginTop: 20,
            }}
          >
            {imagens.map((imagem) => (
              <div
                key={imagem.id}
                style={{
                  background: "#101010",
                  border: "1px solid #242424",
                  borderRadius: 12,
                  overflow: "hidden",
                }}
              >
                <img
                  src={imagem.url}
                  alt="Foto do serviço"
                  style={{
                    width: "100%",
                    height: 130,
                    objectFit: "cover",
                  }}
                />

                <div style={{ padding: 10 }}>
                  <p
                    style={{
                      color: imagem.capa
                        ? "#d6aa46"
                        : "#aaa",
                      fontSize: 12,
                    }}
                  >
                    {imagem.capa
                      ? "★ Foto de capa"
                      : "Foto publicada"}
                  </p>


                  {!imagem.capa && (
                    <button
                      type="button"
                      disabled={salvando}
                      onClick={() => alterarCapa(imagem.id)}
                      style={{
                        display: "block",
                        width: "100%",
                        marginTop: 10,
                        padding: "9px 12px",
                        borderRadius: 7,
                        border: "1px solid #d6aa46",
                        background: "transparent",
                        color: "#d6aa46",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: salvando
                          ? "not-allowed"
                          : "pointer",
                      }}
                    >
                      ☆ Definir como capa
                    </button>
                  )}


                  <button
                    type="button"
                    disabled={salvando}
                    onClick={() =>
                      removerExistente(imagem.id)
                    }
                    style={{
                      color: "#fff",
                      background: "transparent",
                      border: "1px solid #444",
                      padding: "8px 12px",
                      borderRadius: 6,
                      cursor: "pointer",
                      marginTop: 8,
                    }}
                  >
                    Remover
                  </button>
                </div>
              </div>
            ))}

            {pendentes.map((foto) => (
              <div
                key={foto.id}
                style={{
                  background: "#101010",
                  border: "1px solid #242424",
                  borderRadius: 12,
                  overflow: "hidden",
                }}
              >
                <img
                  src={foto.preview}
                  alt="Nova foto"
                  style={{
                    width: "100%",
                    height: 130,
                    objectFit: "cover",
                  }}
                />

                <div style={{ padding: 10 }}>
                  <p
                    style={{
                      color: "#d6aa46",
                      fontSize: 12,
                    }}
                  >
                    Aguardando publicação
                  </p>

                  <button
                    type="button"
                    disabled={salvando}
                    onClick={() =>
                      removerPendente(foto.id)
                    }
                    style={{
                      color: "#fff",
                      background: "transparent",
                      border: "1px solid #444",
                      padding: "8px 12px",
                      borderRadius: 6,
                      cursor: "pointer",
                      marginTop: 8,
                    }}
                  >
                    Remover
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {progresso && (
          <p
            role="status"
            style={{ color: "#d6aa46" }}
          >
            {progresso}
          </p>
        )}

        {sucesso && (
          <p
            role="status"
            style={{ color: "#78d9a0" }}
          >
            {sucesso}
          </p>
        )}

        <div className="novo-servico-acoes">
          <button
            type="button"
            className="novo-btn-cancelar"
            disabled={salvando}
            onClick={() =>
              router.push("/profissional/servicos")
            }
          >
            Cancelar
          </button>

          <button
            type="submit"
            className="prof-btn-principal"
            disabled={salvando}
          >
            {salvando
              ? "Salvando..."
              : "Salvar alterações"}
          </button>
        </div>
      </form>
    </div>
  );
}
