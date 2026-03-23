import { ButtonHTMLAttributes } from "react";
import { motion } from "framer-motion";

type Variant = "primary" | "ghost";

type SafeButtonAttributes = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onDrag" | "onDragEnd" | "onDragStart">;

interface ButtonProps extends SafeButtonAttributes {
  variant?: Variant;
}

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  const base = "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-60";
  const styles =
    variant === "primary"
      ? "gradient-button"
      : "border border-slate-300 bg-white/80 text-slate-700 hover:bg-slate-100";

  return (
    <motion.div whileHover={{ scale: 1.018 }} whileTap={{ scale: 0.985 }} className="inline-block">
      <button className={`${base} ${styles} ${className}`} {...props} />
    </motion.div>
  );
}
