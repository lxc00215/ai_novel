import { Card, CardContent } from "@/components/ui/card";
import { ReactNode } from "react";

interface WorkEmptyStateProps {
  icon: ReactNode;
  title: string;
  onClick: () => void;
}

export default function WorkEmptyState({ icon, title, onClick }: WorkEmptyStateProps) {
  return (
    <Card 
      className="flex flex-col items-center justify-center h-[200px] cursor-pointer border-dashed hover:border-solid  transition-colors"
      onClick={onClick}
    >
      <CardContent className="flex flex-col items-center justify-center pt-6">
        {icon}
        <p className="mt-4 font-medium text-muted-foreground">{title}</p>
      </CardContent>
    </Card>
  );
} 