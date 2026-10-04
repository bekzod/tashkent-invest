import type { HTMLAttributes, ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type FormSectionProps = HTMLAttributes<HTMLDivElement> & {
  title: string;
  description?: string;
  actions?: ReactNode;
};

export function FormSection({ title, description, actions, children, className, ...props }: FormSectionProps) {
  return (
    <Card className={cn("shadow-[var(--ds-shadow-card)]", className)} {...props}>
      <CardHeader className="flex-row items-start justify-between gap-4 p-4">
        <div><CardTitle>{title}</CardTitle>{description ? <CardDescription className="mt-1 leading-5">{description}</CardDescription> : null}</div>
        {actions}
      </CardHeader>
      <CardContent className="p-4 pt-0">{children}</CardContent>
    </Card>
  );
}
