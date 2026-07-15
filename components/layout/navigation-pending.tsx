"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";

interface NavigationPendingContextValue {
  pendingHref: string | null;
  setPendingHref: (href: string | null) => void;
}

const NavigationPendingContext = createContext<NavigationPendingContextValue>({
  pendingHref: null,
  setPendingHref: () => undefined,
});

export function NavigationPendingProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [pendingHref, setPendingHrefState] = useState<string | null>(null);

  const setPendingHref = useCallback((href: string | null) => {
    setPendingHrefState(href);
  }, []);

  useEffect(() => {
    setPendingHrefState(null);
  }, [pathname]);

  const value = useMemo(
    () => ({ pendingHref, setPendingHref }),
    [pendingHref, setPendingHref]
  );

  return (
    <NavigationPendingContext.Provider value={value}>
      {children}
    </NavigationPendingContext.Provider>
  );
}

export function useNavigationPending() {
  return useContext(NavigationPendingContext);
}

/** Thin progress bar while a sidebar route transition is in flight. */
export function NavigationProgressBar() {
  const { pendingHref } = useNavigationPending();
  const active = Boolean(pendingHref);

  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 z-20 h-0.5 overflow-hidden"
      aria-hidden={!active}
    >
      <div
        className={`h-full origin-left bg-primary transition-all duration-300 ${
          active ? "w-full animate-pulse opacity-100" : "w-0 opacity-0"
        }`}
      />
    </div>
  );
}
