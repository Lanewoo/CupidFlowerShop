import { SiteHeader } from "@/components/SiteHeader";
import { AdminNav } from "@/components/AdminNav";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteHeader />
      <AdminNav />
      {children}
    </>
  );
}
