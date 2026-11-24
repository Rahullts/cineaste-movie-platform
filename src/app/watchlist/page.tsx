import { redirect } from "next/navigation";

export default function WatchlistRedirectPage() {
  redirect("/library?tab=all-films");
}
