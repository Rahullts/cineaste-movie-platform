import { redirect } from "next/navigation";

export default function WatchedRedirectPage() {
  redirect("/library?tab=watched");
}
