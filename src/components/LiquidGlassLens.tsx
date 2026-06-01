"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { ComponentType, CSSProperties, ReactNode, RefObject } from "react";

type LiquidGlassProps = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  displacementScale?: number;
  blurAmount?: number;
  saturation?: number;
  aberrationIntensity?: number;
  elasticity?: number;
  cornerRadius?: number;
  padding?: string;
  overLight?: boolean;
  mode?: "standard" | "polar" | "prominent" | "shader";
  mouseContainer?: RefObject<HTMLElement | null> | null;
};

const LiquidGlass = dynamic(() => import("liquid-glass-react"), {
  ssr: false,
  loading: () => null
}) as ComponentType<LiquidGlassProps>;

export function LiquidGlassLens({
  children,
  className = "",
  overLight = false,
  prominent = false
}: {
  children: ReactNode;
  className?: string;
  overLight?: boolean;
  prominent?: boolean;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className={`liquid-glass-lens-static ${className}`}>{children}</div>;
  }

  return (
    <div className={`liquid-glass-lens-fallback ${className}`}>
      <LiquidGlass
        className="liquid-glass-lens"
        displacementScale={prominent ? 30 : 18}
        blurAmount={prominent ? 0.08 : 0.04}
        saturation={prominent ? 142 : 124}
        aberrationIntensity={prominent ? 1.1 : 0.7}
        elasticity={prominent ? 0.18 : 0.12}
        cornerRadius={22}
        padding="0"
        overLight={overLight}
        mode={prominent ? "polar" : "standard"}
      >
        <div className="liquid-glass-lens-inner">{children}</div>
      </LiquidGlass>
    </div>
  );
}
