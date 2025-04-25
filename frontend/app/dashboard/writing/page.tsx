import WorksContainer from "@/app/components/works/works-container";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "作品管理 | AI小说创作",
  description: "管理您的AI小说创作作品，创建新作品或管理现有作品",
}


export default function WorksPage() {
  return <WorksContainer />;
} 