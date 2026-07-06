"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import Toaster, {
  type ToasterProps,
  type ToasterRef,
  type ToastVariant,
} from "@/components/ui/toast";

type ShowToast = (props: ToasterProps) => void;

interface ConfirmToastOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void | Promise<void>;
  variant?: "warning" | "error";
  duration?: number;
}

interface AppToastContextValue {
  show: ShowToast;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  confirm: (options: ConfirmToastOptions) => void;
}

const AppToastContext = createContext<AppToastContextValue | null>(null);

function pushVariant(
  show: ShowToast,
  variant: ToastVariant,
  message: string,
  title?: string
) {
  show({ message, title, variant });
}

export function AppToastProvider({ children }: { children: ReactNode }) {
  const toasterRef = useRef<ToasterRef>(null);

  const show = useCallback<ShowToast>((props) => {
    toasterRef.current?.show(props);
  }, []);

  const value = useMemo<AppToastContextValue>(
    () => ({
      show,
      success: (message, title) =>
        pushVariant(show, "success", message, title ?? "Success"),
      error: (message, title) =>
        pushVariant(show, "error", message, title ?? "Error"),
      warning: (message, title) =>
        pushVariant(show, "warning", message, title ?? "Warning"),
      info: (message, title) =>
        pushVariant(show, "default", message, title ?? "Notice"),
      confirm: ({
        title,
        message,
        confirmLabel = "Confirm",
        onConfirm,
        variant = "warning",
        duration = 12000,
      }) => {
        show({
          title,
          message,
          variant,
          duration,
          action: {
            label: confirmLabel,
            variant: "outline",
            onClick: () => {
              void onConfirm();
            },
          },
        });
      },
    }),
    [show]
  );

  return (
    <AppToastContext.Provider value={value}>
      {children}
      <Toaster ref={toasterRef} />
    </AppToastContext.Provider>
  );
}

export function useAppToast(): AppToastContextValue {
  const context = useContext(AppToastContext);
  if (!context) {
    throw new Error("useAppToast must be used within AppToastProvider");
  }
  return context;
}
