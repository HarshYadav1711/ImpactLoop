import type { PropsWithChildren } from "react";
import { Card } from "./card";
import { Button } from "./button";

interface DialogProps extends PropsWithChildren {
  title: string;
  description?: string;
  open?: boolean;
}

export function Dialog({ title, description, open = false, children }: DialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/40 p-4 sm:items-center sm:justify-center">
      <Card className="w-full max-w-md">
        <h3 className="text-lg font-semibold text-zinc-900">{title}</h3>
        {description ? <p className="mt-1 text-sm text-zinc-600">{description}</p> : null}
        <div className="mt-4">{children}</div>
        <div className="mt-5 flex justify-end">
          <Button variant="secondary" type="button">Close</Button>
        </div>
      </Card>
    </div>
  );
}
