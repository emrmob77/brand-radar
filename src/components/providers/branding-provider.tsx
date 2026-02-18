"use client";

import { createContext, useContext, useMemo, type CSSProperties } from "react";

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

export type BrandingConfig = {
  companyName: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
};

type BrandingContextValue = BrandingConfig & {
  initials: string;
};

const defaultBranding: BrandingConfig = {
  companyName: "Brand Radar",
  logoUrl: null,
  primaryColor: "#171a20",
  secondaryColor: "#2563eb"
};

const BrandingContext = createContext<BrandingContextValue | null>(null);

function normalizeHex(value: string | null | undefined, fallback: string): string {
  if (!value) {
    return fallback;
  }

  return HEX_COLOR.test(value) ? value : fallback;
}

function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace("#", "");
  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);
  return [red, green, blue];
}

function rgbToVar(value: [number, number, number]): string {
  return `${value[0]} ${value[1]} ${value[2]}`;
}

function darken(value: [number, number, number], amount: number): [number, number, number] {
  return [
    Math.max(0, Math.round(value[0] * (1 - amount))),
    Math.max(0, Math.round(value[1] * (1 - amount))),
    Math.max(0, Math.round(value[2] * (1 - amount)))
  ];
}

function tint(value: [number, number, number], ratio: number): [number, number, number] {
  return [
    Math.round(255 * ratio + value[0] * (1 - ratio)),
    Math.round(255 * ratio + value[1] * (1 - ratio)),
    Math.round(255 * ratio + value[2] * (1 - ratio))
  ];
}

function getInitials(value: string): string {
  const words = value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (words.length === 0) {
    return "BR";
  }

  return words.map((word) => word[0]?.toUpperCase() ?? "").join("");
}

function getBrandingValue(branding: BrandingConfig): BrandingContextValue {
  const companyName = branding.companyName.trim() || defaultBranding.companyName;
  const primaryColor = normalizeHex(branding.primaryColor, defaultBranding.primaryColor);
  const secondaryColor = normalizeHex(branding.secondaryColor, defaultBranding.secondaryColor);

  return {
    companyName,
    logoUrl: branding.logoUrl,
    primaryColor,
    secondaryColor,
    initials: getInitials(companyName)
  };
}

function getBrandingCssVariables(branding: BrandingContextValue): CSSProperties {
  const primaryRgb = hexToRgb(branding.primaryColor);
  const secondaryRgb = hexToRgb(branding.secondaryColor);
  const primaryDark = darken(primaryRgb, 0.18);
  const softBackground = tint(secondaryRgb, 0.9);

  return {
    "--brand-primary": branding.primaryColor,
    "--brand-secondary": branding.secondaryColor,
    "--brand-primary-rgb": rgbToVar(primaryRgb),
    "--brand-primary-dark-rgb": rgbToVar(primaryDark),
    "--brand-secondary-rgb": rgbToVar(secondaryRgb),
    "--brand-soft-rgb": rgbToVar(softBackground)
  } as CSSProperties;
}

export function BrandingProvider({
  branding,
  children
}: {
  branding: BrandingConfig;
  children: React.ReactNode;
}) {
  const value = useMemo(() => getBrandingValue(branding), [branding]);
  const cssVariables = useMemo(() => getBrandingCssVariables(value), [value]);

  return (
    <BrandingContext.Provider value={value}>
      <div style={cssVariables}>{children}</div>
    </BrandingContext.Provider>
  );
}

export function useBranding(): BrandingContextValue {
  const context = useContext(BrandingContext);
  if (!context) {
    throw new Error("useBranding must be used within BrandingProvider.");
  }

  return context;
}
