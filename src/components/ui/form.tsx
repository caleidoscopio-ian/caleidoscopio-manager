"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

const Form = React.forwardRef<
  HTMLFormElement,
  React.FormHTMLAttributes<HTMLFormElement>
>(({ className, ...props }, ref) => (
  <form
    ref={ref}
    className={cn("space-y-6", className)}
    {...props}
  />
))
Form.displayName = "Form"

const FormField = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("space-y-2", className)}
    {...props}
  />
))
FormField.displayName = "FormField"

const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement> & {
    variant?: "default" | "error" | "success"
  }
>(({ className, variant = "default", ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      "text-sm font-medium",
      {
        "text-muted-foreground": variant === "default",
        "text-destructive": variant === "error",
        "text-green-600": variant === "success",
      },
      className
    )}
    {...props}
  />
))
FormMessage.displayName = "FormMessage"

export { Form, FormField, FormMessage }