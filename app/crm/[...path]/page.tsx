import { redirect } from "next/navigation";

export default function CrmServiceFallbackPage(): never {
  redirect("/crm");
}
