"use client";

import Link from "next/link";

type AcoesFeedProps = {
  mostrarVoltar?: boolean;
};

function IconeCriarPublicacao() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <path d="M12 8v8" />
      <path d="M8 12h8" />
    </svg>
  );
}

function IconeSalvos() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 4.8A1.8 1.8 0 0 1 7.8 3h8.4A1.8 1.8 0 0 1 18 4.8V21l-6-3.7L6 21V4.8Z" />
    </svg>
  );
}

function IconePerfilPublico() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
    </svg>
  );
}

function IconeVoltar() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M19 12H5" />
      <path d="M12 19l-7-7 7-7" />
    </svg>
  );
}

export default function AcoesFeed({
  mostrarVoltar = false,
}: AcoesFeedProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      {/* VOLTAR PARA O FEED */}

      {mostrarVoltar ? (
        <Link
          href="/feed"
          className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-zinc-400 transition hover:text-[#d6aa46]"
        >
          <IconeVoltar />
          <span>Voltar para o Feed</span>
        </Link>
      ) : (
        <div />
      )}

      {/* AÇÕES DO FEED */}

      <nav
        aria-label="Ações do Feed"
        className="flex items-center gap-2"
      >
        {/* CRIAR PUBLICAÇÃO */}

        <Link
          href="/feed/criar"
          title="Criar publicação"
          aria-label="Criar publicação"
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#d6aa46] bg-[#d6aa46] text-[#090909] shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-[#e8bf62] hover:shadow-[0_6px_20px_rgba(214,170,70,0.20)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d6aa46]"
        >
          <IconeCriarPublicacao />
        </Link>

        {/* PUBLICAÇÕES SALVAS */}

        <Link
          href="/feed/salvos"
          title="Publicações salvas"
          aria-label="Publicações salvas"
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-700 bg-[#141414] text-zinc-300 transition duration-200 hover:-translate-y-0.5 hover:border-[#d6aa46] hover:bg-[#1b1b1b] hover:text-[#d6aa46] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d6aa46]"
        >
          <IconeSalvos />
        </Link>

        {/* PERFIL PÚBLICO */}

        <Link
          href="/perfil/editar"
          title="Meu perfil público"
          aria-label="Meu perfil público"
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-700 bg-[#141414] text-zinc-300 transition duration-200 hover:-translate-y-0.5 hover:border-[#d6aa46] hover:bg-[#1b1b1b] hover:text-[#d6aa46] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d6aa46]"
        >
          <IconePerfilPublico />
        </Link>
      </nav>
    </div>
  );
}