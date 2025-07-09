import React from "react";
import { useToast } from "@/components/ui/use-toast";
import { Toast, ToastClose, ToastDescription, ToastTitle } from "@/components/ui/toast";
import { AnimatePresence, motion } from "framer-motion";

export default function Toaster() {
  const { toasts } = useToast();

  // סינון הודעות כפולות
  const uniqueToasts = React.useMemo(() => {
    const seen = new Map();
    return toasts.filter(toast => {
      const key = `${toast.title}-${toast.description}`;
      if (!seen.has(key)) {
        seen.set(key, true);
        return true;
      }
      return false;
    });
  }, [toasts]);

  if (!uniqueToasts.length) return null;

  return (
    <div className="fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]">
      <AnimatePresence>
        {uniqueToasts.map(({ id, title, description, action, ...props }) => (
          <motion.div
            key={id}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="mb-2"
          >
            <Toast {...props}>
              <div className="grid gap-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && <ToastDescription>{description}</ToastDescription>}
              </div>
              {action}
              <ToastClose />
            </Toast>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}