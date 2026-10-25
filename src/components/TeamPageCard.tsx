import type { ReactNode } from "react";
import { Users } from "lucide-react";
import PageCard from "@/components/PageCard";

export default function TeamPageCard(props: {
  title: string;
  description: string;
  children: ReactNode;
  hasTabs?: boolean;
}) {
  return <PageCard icon={Users} {...props} />;
}
