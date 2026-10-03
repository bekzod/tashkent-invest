import { toast } from "sonner";

type ToastOptions = {
  description?: string;
  action?: { label: string; onClick: () => void };
};

function toastOptions(options?: ToastOptions) {
  return {
    description: options?.description,
    ...(options?.action ? { action: options.action } : {}),
  };
}

export const notify = {
  success(message: string, options?: ToastOptions) {
    toast.success(message, toastOptions(options));
  },
  error(message: string, options?: ToastOptions) {
    toast.error(message, toastOptions(options));
  },
  warning(message: string, options?: ToastOptions) {
    toast.warning(message, toastOptions(options));
  },
  info(message: string, options?: ToastOptions) {
    toast.info(message, toastOptions(options));
  },
};
