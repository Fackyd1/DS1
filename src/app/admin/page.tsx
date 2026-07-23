import { redirect } from "next/navigation";
import { readSession } from "@/lib/auth/session";
import { SectionShell } from "@/components/layout/section-shell";
import { AdminDashboard } from "@/components/admin/admin-dashboard";

export const metadata = {
  title: "Admin | DS1",
  description: "Panel administrativo con RBAC para gestión de contenido y balance.",
};

export default async function AdminPage() {
  const session = await readSession();

  if (!session) {
    redirect("/contact");
  }

  if (session.role !== "ADMIN" && session.role !== "EDITOR") {
    return (
      <SectionShell id="admin-forbidden" eyebrow="ADMIN" title="Access Denied">
        <p className="text-[var(--color-text-muted)]">This area requires ADMIN or EDITOR role.</p>
      </SectionShell>
    );
  }

  return (
    <SectionShell id="admin-page" eyebrow="ADMIN" title="Control Center">
      <AdminDashboard />
    </SectionShell>
  );
}
