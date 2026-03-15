import { WifiOff } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

export default function OfflineBanner() {
  const [offline, setOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOffline = () => setOffline(true);
    const handleOnline = () => setOffline(false);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  return (
    <AnimatePresence>
      {offline && (
        <motion.div
          data-ocid="offline.toast"
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed top-0 left-0 right-0 z-[200] flex items-center justify-center gap-2 bg-amber-500 text-white text-xs font-semibold font-body py-2 px-4 shadow-lg"
        >
          <WifiOff size={13} />
          You're offline — map data cached and available
        </motion.div>
      )}
    </AnimatePresence>
  );
}
