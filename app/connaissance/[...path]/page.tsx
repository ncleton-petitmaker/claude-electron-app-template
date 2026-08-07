import { redirect } from "next/navigation";

export default function ConnaissanceServiceFallbackPage(): never {
  redirect("/connaissance");
}
