"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Settings, LayoutGrid, List, User, Info, Palette, Bell, Archive } from "lucide-react";
import { useEffect } from "react";

export type ViewDensity = "compact" | "comfy";

interface SettingsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  viewDensity: ViewDensity;
  onViewDensityChange: (density: ViewDensity) => void;
  showArchived: boolean;
  onShowArchivedChange: (show: boolean) => void;
}

export function SettingsSidebar({ 
  isOpen, 
  onClose, 
  viewDensity, 
  onViewDensityChange,
  showArchived,
  onShowArchivedChange 
}: SettingsSidebarProps) {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  // Handle swipe to close
  useEffect(() => {
    if (!isOpen) return;

    let touchStartX = 0;
    let touchEndX = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.changedTouches[0].screenX;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    };

    const handleSwipe = () => {
      // Swipe left to close (at least 50px)
      if (touchStartX - touchEndX > 50) {
        onClose();
      }
    };

    document.addEventListener("touchstart", handleTouchStart);
    document.addEventListener("touchend", handleTouchEnd);

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-0 left-0 h-full w-[280px] sm:w-[320px] bg-card/95 backdrop-blur-xl border-r border-white/20 dark:border-gray-700/50 shadow-elevated-lg z-[101]"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/10 dark:border-gray-700/50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl gradient-primary shadow-elevated">
                    <Settings className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-semibold gradient-text">Settings</h2>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="p-2 rounded-xl glass hover:bg-white/50 dark:hover:bg-gray-800/50 transition-all"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>
              <p className="text-sm text-muted-foreground">Customize your experience</p>
            </div>

            {/* Settings Content */}
            <div className="p-6 space-y-6 overflow-y-auto h-[calc(100%-140px)]">
              {/* View Density Section */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <LayoutGrid className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-sm">View Density</h3>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Choose how much information to display
                </p>
                
                <div className="space-y-2">
                  {/* Comfy Option */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onViewDensityChange("comfy")}
                    className={`
                      w-full p-4 rounded-xl border-2 transition-all text-left
                      ${viewDensity === "comfy"
                        ? "bg-gradient-to-br from-primary/10 to-primary/5 border-primary shadow-md"
                        : "glass border-white/20 dark:border-gray-700/50 hover:border-primary/30"
                      }
                    `}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`
                        p-2 rounded-lg transition-colors
                        ${viewDensity === "comfy" 
                          ? "bg-primary/20" 
                          : "bg-muted"
                        }
                      `}>
                        <LayoutGrid className={`w-5 h-5 ${viewDensity === "comfy" ? "text-primary" : "text-muted-foreground"}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm">Comfy</span>
                          {viewDensity === "comfy" && (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="px-2 py-0.5 rounded-full bg-primary text-white text-xs font-medium"
                            >
                              Active
                            </motion.span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Large cards with all details visible
                        </p>
                      </div>
                    </div>
                  </motion.button>

                  {/* Compact Option */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onViewDensityChange("compact")}
                    className={`
                      w-full p-4 rounded-xl border-2 transition-all text-left
                      ${viewDensity === "compact"
                        ? "bg-gradient-to-br from-primary/10 to-primary/5 border-primary shadow-md"
                        : "glass border-white/20 dark:border-gray-700/50 hover:border-primary/30"
                      }
                    `}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`
                        p-2 rounded-lg transition-colors
                        ${viewDensity === "compact" 
                          ? "bg-primary/20" 
                          : "bg-muted"
                        }
                      `}>
                        <List className={`w-5 h-5 ${viewDensity === "compact" ? "text-primary" : "text-muted-foreground"}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm">Compact</span>
                          {viewDensity === "compact" && (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="px-2 py-0.5 rounded-full bg-primary text-white text-xs font-medium"
                            >
                              Active
                            </motion.span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Condensed list view, more items visible
                        </p>
                      </div>
                    </div>
                  </motion.button>
                </div>
              </div>

              {/* View Archived Toggle */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Archive className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-sm">Archived Items</h3>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Show items that have been archived
                </p>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onShowArchivedChange(!showArchived)}
                  className={`
                    w-full p-4 rounded-xl border-2 transition-all
                    ${showArchived
                      ? "bg-gradient-to-br from-amber-500/10 to-orange-500/5 border-amber-500 shadow-md"
                      : "glass border-white/20 dark:border-gray-700/50 hover:border-amber-500/30"
                    }
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`
                        p-2 rounded-lg transition-colors
                        ${showArchived 
                          ? "bg-amber-500/20" 
                          : "bg-muted"
                        }
                      `}>
                        <Archive className={`w-5 h-5 ${showArchived ? "text-amber-500" : "text-muted-foreground"}`} />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-sm">
                          {showArchived ? "Showing Archived" : "Hide Archived"}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {showArchived ? "Viewing archived items" : "Only active items"}
                        </p>
                      </div>
                    </div>
                    <div className={`
                      w-12 h-6 rounded-full transition-colors relative
                      ${showArchived ? "bg-amber-500" : "bg-muted"}
                    `}>
                      <motion.div
                        animate={{ x: showArchived ? 24 : 2 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-md"
                      />
                    </div>
                  </div>
                </motion.button>
              </div>

              {/* Coming Soon Sections */}
              <div className="space-y-3 opacity-60 pointer-events-none">
                <div className="flex items-center gap-2 pt-3 border-t border-white/10">
                  <Palette className="w-4 h-4 text-muted-foreground" />
                  <h3 className="font-semibold text-sm text-muted-foreground">Theme</h3>
                  <span className="ml-auto text-xs bg-muted px-2 py-1 rounded-full">Coming Soon</span>
                </div>
                
                <div className="flex items-center gap-2 pt-3 border-t border-white/10">
                  <Bell className="w-4 h-4 text-muted-foreground" />
                  <h3 className="font-semibold text-sm text-muted-foreground">Notifications</h3>
                  <span className="ml-auto text-xs bg-muted px-2 py-1 rounded-full">Coming Soon</span>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-white/10">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <h3 className="font-semibold text-sm text-muted-foreground">Account</h3>
                  <span className="ml-auto text-xs bg-muted px-2 py-1 rounded-full">Coming Soon</span>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-white/10">
                  <Info className="w-4 h-4 text-muted-foreground" />
                  <h3 className="font-semibold text-sm text-muted-foreground">About</h3>
                  <span className="ml-auto text-xs bg-muted px-2 py-1 rounded-full">Coming Soon</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10 dark:border-gray-700/50 glass-strong">
              <p className="text-xs text-center text-muted-foreground">
                Home Manager v1.0.0
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
