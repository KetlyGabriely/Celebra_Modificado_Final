import CommunityLayout from "@/components/feed/CommunityLayout";
import "../profissional/profissional.css";
import "../cliente/cliente.css";

export default function FeedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <CommunityLayout>{children}</CommunityLayout>
  );
}
