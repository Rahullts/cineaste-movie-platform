import { redirect } from "next/navigation";

export default function ImportRedirectPage() {
  redirect("/library?tab=import");
}
