import { AdminSwitcherBarScope } from "@/components/molecules/admin-switcher-bar-scope";

/** Alto : monté sur tous les hosts ; affichage client = session admin / preview + surfaces vitrine / CRM. */
export async function AdminSwitcherBarLayoutGate() {
  return <AdminSwitcherBarScope />;
}