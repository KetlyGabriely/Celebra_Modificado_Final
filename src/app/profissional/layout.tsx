import SidebarProfissional from "@/components/profissional/SidebarProfissional";
import HeaderProfissional from "@/components/profissional/HeaderProfissional";

import "./profissional.css";

export default function ProfissionalLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="profissional-dashboard">
      <SidebarProfissional />

      <div className="profissional-area">
        <HeaderProfissional />

        <main className="profissional-main">
          {children}
        </main>
      </div>
    </div>
  );
}