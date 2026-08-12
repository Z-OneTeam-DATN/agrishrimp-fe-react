import { redirect } from "next/navigation";

export default function AdvisorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  void children;
  redirect("/admin/chat");
}
