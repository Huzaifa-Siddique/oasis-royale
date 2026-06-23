"use client";

import { useCart } from "@/lib/cart-context";
import { motion, AnimatePresence } from "framer-motion";

export default function CartBadge() {
  const { getCount } = useCart();
  const count = getCount();

  if (count === 0) return null;

  const display = count > 99 ? "99+" : count > 9 ? "9+" : String(count);

  return (
    <AnimatePresence mode="popLayout">
      <motion.span
        key={display}
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.5, opacity: 0 }}
        className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-gold text-background text-[10px] font-bold leading-none px-1"
      >
        {display}
      </motion.span>
    </AnimatePresence>
  );
}
