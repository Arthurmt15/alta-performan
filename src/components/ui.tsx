/**
 * Design System leve - NativeWind + componentes nativos
 * Zero lib pesada de UI, só Tailwind compile-time
 */
import React from "react";
import { Text, TouchableOpacity, View, ActivityIndicator, ViewProps, TextProps, TouchableOpacityProps } from "react-native";
import { cn } from "@/utils/cn";

export function Card({ className, ...props }: ViewProps & { className?: string }) {
  return <View className={cn("bg-surface rounded-xl p-4", className)} {...props} />;
}

export function Button({
  variant = "primary",
  size = "md",
  loading,
  className,
  children,
  ...props
}: TouchableOpacityProps & {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const base = "items-center justify-center rounded-xl flex-row";
  const variants = {
    primary: "bg-primary active:opacity-90",
    secondary: "bg-surfaceLight border border-zinc-700",
    ghost: "bg-transparent",
  };
  const sizes = {
    sm: "px-3 py-2",
    md: "px-4 py-3.5",
    lg: "px-6 py-4",
  };
  return (
    <TouchableOpacity className={cn(base, variants[variant], sizes[size], className)} disabled={loading || props.disabled} {...props}>
      {loading ? <ActivityIndicator color={variant === "primary" ? "#000" : "#fff"} /> : children}
    </TouchableOpacity>
  );
}

export function AppText({ className, ...props }: TextProps & { className?: string }) {
  return <Text className={cn("text-white", className)} {...props} />;
}

export function MutedText({ className, ...props }: TextProps & { className?: string }) {
  return <Text className={cn("text-muted text-sm", className)} {...props} />;
}

export function Badge({ className, children, ...props }: ViewProps & { className?: string; children: React.ReactNode }) {
  return (
    <View className={cn("bg-surfaceLight px-2.5 py-1 rounded-full self-start", className)} {...props}>
      <Text className="text-xs text-zinc-300 font-medium">{children}</Text>
    </View>
  );
}
