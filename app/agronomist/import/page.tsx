import { redirect } from "next/navigation";

export default function AgronomistImportPage() {
  redirect("/agronomist/diseases?panel=import");
}
