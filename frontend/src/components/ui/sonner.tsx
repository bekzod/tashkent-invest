"use client";

import { Toaster as Sonner } from "sonner";

function Toaster() {
  return (
    <Sonner
      closeButton
      position="top-right"
      toastOptions={{
        classNames: {
          toast: "invest-toast",
          title: "invest-toast-title",
          description: "invest-toast-description",
          closeButton: "invest-toast-close",
          success: "invest-toast-success",
          error: "invest-toast-error",
          warning: "invest-toast-warning",
          info: "invest-toast-info",
        },
      }}
    />
  );
}

export { Toaster };
