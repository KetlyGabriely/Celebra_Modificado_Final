import SidebarCliente from "@/components/cliente/SidebarCliente";
import HeaderCliente from "@/components/cliente/HeaderCliente";
import "./cliente.css";

export default function ClienteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="cliente-dashboard">
      <SidebarCliente />

      <div className="cliente-area">
        <HeaderCliente />

        <main className="cliente-main">
          {children}
        </main>
      </div>
    </div>
  );
}