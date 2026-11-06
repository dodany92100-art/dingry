import { redirect } from "next/navigation";

export default function AdminLookbookRoutePage() {
  redirect("/admin?tab=lookbook");
}
