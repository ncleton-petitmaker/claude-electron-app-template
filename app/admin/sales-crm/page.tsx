import { AdminShell } from "@/components/AdminShell";
import { SalesCrmAdminPanel } from "@/modules/sales_crm";

export default function SalesCrmAdminPage() {
  return (
    <AdminShell
      title="CRM commercial"
      description="Contrat Bridge du CRM commercial : déploiement indépendant, scopes, actions proxifiées et ouverture par billet."
    >
      <SalesCrmAdminPanel />
    </AdminShell>
  );
}
