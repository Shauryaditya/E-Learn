"use client";

import { useClerk } from "@clerk/nextjs";
import { LogIn } from "lucide-react";

import { Button } from "@/components/ui/button";

interface AuthPromptButtonProps {
  label?: string;
  redirectUrl?: string;
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive" | "success";
}

export const AuthPromptButton = ({
  label = "Sign in to start",
  redirectUrl,
  className,
  size = "default",
  variant = "default",
}: AuthPromptButtonProps) => {
  const { openSignIn } = useClerk();

  const onClick = () => {
    openSignIn({
      afterSignInUrl: redirectUrl,
      afterSignUpUrl: redirectUrl,
    });
  };

  return (
    <Button onClick={onClick} size={size} variant={variant} className={className}>
      <LogIn className="h-4 w-4 mr-2" />
      {label}
    </Button>
  );
};
