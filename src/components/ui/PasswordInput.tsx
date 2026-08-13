// src/components/ui/PasswordInput.tsx
import { forwardRef, useState, type InputHTMLAttributes } from "react";
import { Eye, EyeSlash } from "@phosphor-icons/react";
import { Input } from "./Input";

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  error?: string;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(({ label, error, ...props }, ref) => {
  const [visible, setVisible] = useState(false);
  return (
    <Input
      ref={ref}
      label={label}
      error={error}
      type={visible ? "text" : "password"}
      trailingSlot={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          className="text-(--color-text-tertiary)"
        >
          {visible ? <EyeSlash size={18} weight="light" /> : <Eye size={18} weight="light" />}
        </button>
      }
      {...props}
    />
  );
});
PasswordInput.displayName = "PasswordInput";