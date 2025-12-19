import React from "react";
import brandLogo from "@/assets/GreenB_logo-removebg-preview.png";

interface LogoProps {
  className?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  rounded?: boolean;
  alt?: string;
}

const sizeClasses: Record<NonNullable<LogoProps["size"]>, string> = {
  xs: "h-6",
  sm: "h-8",
  md: "h-10",
  lg: "h-16",
  xl: "h-32",
};

export default function Logo({
  className = "",
  size = "md",
  rounded = true,
  alt = "GreenB",
}: LogoProps) {
  const roundedClass = rounded ? "rounded-lg" : "";
  const sizeClass = sizeClasses[size] ?? sizeClasses.md;
  return (
    <img src={brandLogo} alt={alt} className={`${sizeClass} w-auto ${roundedClass} ${className}`} />
  );
}