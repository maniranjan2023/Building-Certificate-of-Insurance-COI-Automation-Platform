"use client";

import { useEffect } from "react";
import { configureBoneyard } from "boneyard-js/react";
import "../../bones/registry";

/** Runtime defaults for dark-theme skeleton bones. */
export function BoneyardProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    configureBoneyard({
      darkColor: "#2a2a2a",
      animate: "shimmer",
      darkShimmerColor: "#333333",
      select: "viewport",
      transition: 200,
    });
  }, []);

  return children;
}
