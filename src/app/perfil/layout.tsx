import CommunityLayout from "@/components/feed/CommunityLayout";

import "../profissional/profissional.css";
import "../cliente/cliente.css";

export default function PerfilLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <CommunityLayout>{children}</CommunityLayout>
  );
}
