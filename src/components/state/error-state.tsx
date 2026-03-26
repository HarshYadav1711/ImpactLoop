import { Button } from "@/components/ui";

interface ErrorStateProps {
  title?: string;
  message?: string;
}

export function ErrorState({ title = "Something went wrong", message = "Please try again in a moment." }: ErrorStateProps) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4">
      <h3 className="text-sm font-semibold text-red-700">{title}</h3>
      <p className="mt-1 text-sm text-red-600">{message}</p>
      <Button variant="secondary" className="mt-3">Retry</Button>
    </div>
  );
}
