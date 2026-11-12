import Link from "next/link";

const actions = [
  { href: "/feed/criar", label: "Criar publicação", icon: "create" },
  { href: "/feed/salvos", label: "Publicações salvas", icon: "saved" },
  { href: "/perfil/editar", label: "Meu perfil público", icon: "profile" },
] as const;

export default function FeedActionsRail() {
  return (
    <nav className="feed-actions-rail" aria-label="Ações do Feed Celebra">
      {actions.map((action) => (
        <Link
          key={action.href}
          href={action.href}
          className={`feed-actions-rail-link feed-actions-rail-${action.icon}`}
          aria-label={action.label}
          title={action.label}
        >
          {action.icon === "create" && (
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          )}
          {action.icon === "saved" && (
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
              <path d="M6 4.75h12a1 1 0 0 1 1 1v14l-7-4.5-7 4.5v-14a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
            </svg>
          )}
          {action.icon === "profile" && (
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="3.5" fill="currentColor" />
              <path d="M4.75 20a7.25 7.25 0 0 1 14.5 0" fill="currentColor" />
            </svg>
          )}
        </Link>
      ))}
    </nav>
  );
}
