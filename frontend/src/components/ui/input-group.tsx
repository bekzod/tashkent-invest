import * as React from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const InputGroup = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, role = "group", ...props }, ref) => (
  <div
    ref={ref}
    role={role}
    data-slot="input-group"
    className={cn(
      "group/input-group flex min-h-11 w-full min-w-0 items-stretch overflow-hidden rounded-md border border-input bg-background shadow-xs transition-[border-color,box-shadow] focus-within:border-primary focus-within:ring-3 focus-within:ring-[var(--focus-ring-color)] aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/15 has-[[data-slot=input-group-control]:disabled]:cursor-not-allowed has-[[data-slot=input-group-control]:disabled]:opacity-60",
      className,
    )}
    {...props}
  />
));
InputGroup.displayName = "InputGroup";

const InputGroupInput = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input">
>(({ className, ...props }, ref) => (
  <Input
    ref={ref}
    data-slot="input-group-control"
    className={cn(
      "h-auto min-h-11 min-w-0 flex-1 rounded-none border-0 bg-transparent shadow-none focus-visible:ring-0 disabled:opacity-100",
      className,
    )}
    {...props}
  />
));
InputGroupInput.displayName = "InputGroupInput";

const InputGroupAddon = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="input-group-addon"
    className={cn(
      "flex shrink-0 items-center justify-center border-border bg-muted/40 px-3 text-sm text-muted-foreground",
      className,
    )}
    {...props}
  />
));
InputGroupAddon.displayName = "InputGroupAddon";

const InputGroupButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "ghost", size = "icon", ...props }, ref) => (
    <Button
      ref={ref}
      data-slot="input-group-button"
      variant={variant}
      size={size}
      className={cn(
        "h-auto min-h-11 shrink-0 rounded-none border-0 shadow-none focus-visible:ring-0",
        className,
      )}
      {...props}
    />
  ),
);
InputGroupButton.displayName = "InputGroupButton";

export { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput };
