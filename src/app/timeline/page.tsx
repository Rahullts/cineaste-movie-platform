import { redirect } from "next/navigation";

export default function TimelineRedirectPage() {
  redirect("/library?tab=timeline");
}
