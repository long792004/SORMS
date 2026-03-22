import { ButtonHTMLAttributes } from "react";
import { motion } from "framer-motion";

type Variant = "primary" | "ghost";

type SafeButtonAttributes = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onDrag" | "onDragEnd" | "onDragStart">;

interface ButtonProps extends SafeButtonAttributes {
  variant?: Variant;
}

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  const base = "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-300";
  const styles =
    variant === "primary"
      ? "gradient-button"
      : "border border-white/10 bg-white/5 text-slate-100 hover:bg-white/10";

  return (
    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="inline-block">
      <button className={`${base} ${styles} ${className}`} {...props} />
    </motion.div>
  );
}
