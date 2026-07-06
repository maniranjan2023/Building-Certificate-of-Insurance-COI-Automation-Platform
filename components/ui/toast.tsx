"use client";

import {
  forwardRef,
  useImperativeHandle,
  useRef,
  type ComponentType,
} from "react";
import { motion } from "framer-motion";
import {
  Toaster as SonnerToaster,
  toast as sonnerToast,
} from "sonner";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Info,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ToastVariant = "default" | "success" | "error" | "warning";

export type ToastPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

export interface ToastActionButton {
  label: string;
  onClick: () => void;
  variant?: "default" | "outline" | "ghost";
}

export interface ToasterProps {
  title?: string;
  message: string;
  variant?: ToastVariant;
  duration?: number;
  position?: ToastPosition;
  action?: ToastActionButton;
  onDismiss?: () => void;
  highlightTitle?: boolean;
}

export interface ToasterRef {
  show: (props: ToasterProps) => void;
}

const variantStyles: Record<ToastVariant, string> = {
  default: "bg-card border-border text-foreground",
  success: "bg-card border-green-600/50",
  error: "bg-card border-destructive/50",
  warning: "bg-card border-amber-600/50",
};

const titleColor: Record<ToastVariant, string> = {
  default: "text-foreground",
  success: "text-green-600 dark:text-green-400",
  error: "text-destructive",
  warning: "text-amber-600 dark:text-amber-400",
};

const iconColor: Record<ToastVariant, string> = {
  default: "text-muted-foreground",
  success: "text-green-600 dark:text-green-400",
  error: "text-destructive",
  warning: "text-amber-600 dark:text-amber-400",
};

const variantIcons: Record<
  ToastVariant,
  ComponentType<{ className?: string }>
> = {
  default: Info,
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
};

const toastAnimation = {
  initial: { opacity: 0, y: 50, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 50, scale: 0.95 },
};

const Toaster = forwardRef<ToasterRef, { defaultPosition?: ToastPosition }>(
  ({ defaultPosition = "bottom-right" }, ref) => {
    const toastReference = useRef<ReturnType<typeof sonnerToast.custom> | null>(
      null
    );

    useImperativeHandle(ref, () => ({
      show({
        title,
        message,
        variant = "default",
        duration = 4000,
        position = defaultPosition,
        action,
        onDismiss,
        highlightTitle,
      }) {
        const Icon = variantIcons[variant];

        toastReference.current = sonnerToast.custom(
          (toastId) => (
            <motion.div
              variants={toastAnimation}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeOut" }}
              className={cn(
                "flex w-full max-w-sm items-start justify-between gap-2 rounded-xl border p-3 shadow-md",
                variantStyles[variant]
              )}
            >
              <div className="flex min-w-0 items-start gap-2">
                <Icon
                  className={cn(
                    "mt-0.5 h-4 w-4 shrink-0",
                    iconColor[variant]
                  )}
                />
                <div className="min-w-0 space-y-0.5">
                  {title ? (
                    <h3
                      className={cn(
                        "text-xs font-medium leading-none",
                        titleColor[variant],
                        highlightTitle && titleColor.success
                      )}
                    >
                      {title}
                    </h3>
                  ) : null}
                  <p className="text-xs text-muted-foreground">{message}</p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {action ? (
                  <Button
                    variant={action.variant ?? "outline"}
                    size="sm"
                    onClick={() => {
                      action.onClick();
                      sonnerToast.dismiss(toastId);
                    }}
                    className={cn(
                      "cursor-pointer",
                      variant === "success"
                        ? "border-green-600 text-green-600 hover:bg-green-600/10 dark:hover:bg-green-400/20"
                        : variant === "error"
                          ? "border-destructive text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/20"
                          : variant === "warning"
                            ? "border-amber-600 text-amber-600 hover:bg-amber-600/10 dark:hover:bg-amber-400/20"
                            : "border-border text-foreground hover:bg-muted/10 dark:hover:bg-muted/20"
                    )}
                  >
                    {action.label}
                  </Button>
                ) : null}

                <button
                  type="button"
                  onClick={() => {
                    sonnerToast.dismiss(toastId);
                    onDismiss?.();
                  }}
                  className="rounded-full p-1 transition-colors hover:bg-muted/50 focus:ring-2 focus:ring-ring focus:outline-none dark:hover:bg-muted/30"
                  aria-label="Dismiss notification"
                >
                  <X className="h-3 w-3 text-muted-foreground" />
                </button>
              </div>
            </motion.div>
          ),
          { duration, position }
        );
      },
    }));

    return (
      <SonnerToaster
        position={defaultPosition}
        toastOptions={{ unstyled: true, className: "flex justify-end" }}
      />
    );
  }
);

Toaster.displayName = "Toaster";

export default Toaster;
export { Toaster };
