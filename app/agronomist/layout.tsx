import { redirect } from "next/navigation";

export default function AgronomistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  void children;
  redirect("/admin/ai-knowledge/diseases");
}
