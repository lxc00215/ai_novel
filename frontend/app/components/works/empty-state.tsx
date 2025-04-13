import { FileX } from "lucide-react";

interface EmptyStateProps {
  message: string;
}

export default function EmptyState({ message }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-gray-500">
      <FileX className="h-12 w-12 mb-4 text-gray-400" />
      <p>{message}</p>
    </div>
  );
} 