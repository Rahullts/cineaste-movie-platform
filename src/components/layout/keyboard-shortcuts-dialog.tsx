"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Keyboard, X } from "lucide-react";
import { KEYBOARD_SHORTCUTS } from "@/lib/constants";

export interface KeyboardShortcutsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsDialog({
  isOpen,
  onClose,
}: KeyboardShortcutsDialogProps) {
  const router = useRouter();

  // Listen for global shortcut keys ('?', '/', and 'g' + letter)
  React.useEffect(() => {
    let gPressed = false;
    let gTimer: NodeJS.Timeout;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);

      if (e.key === "?" && !isInput) {
        e.preventDefault();
        onClose(); // toggle or open
        return;
      }

      if (isInput || e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === "/") {
        e.preventDefault();
        router.push("/discover");
        return;
      }

      if (e.key.toLowerCase() === "g") {
        gPressed = true;
        clearTimeout(gTimer);
        gTimer = setTimeout(() => {
          gPressed = false;
        }, 800);
        return;
      }

      if (gPressed) {
        const key = e.key.toLowerCase() as keyof typeof KEYBOARD_SHORTCUTS;
        const targetRoute = KEYBOARD_SHORTCUTS[key];
        if (targetRoute) {
          e.preventDefault();
          gPressed = false;
          clearTimeout(gTimer);
          router.push(targetRoute.to);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      clearTimeout(gTimer);
    };
  }, [router, onClose]);

  React.useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard Shortcuts"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-[1rem] bg-[#101118] border border-[#1E1F2A] shadow-2xl p-6 animate-slideDown space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#1E1F2A]">
          <div className="flex items-center gap-2.5">
            <Keyboard className="w-5 h-5 text-[#00D664]" />
            <h3 className="font-heading text-base font-bold text-[#F3F4F6]">
              Keyboard shortcuts
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#9496A1] hover:text-[#F3F4F6] hover:bg-[#181820] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <p className="text-xs text-[#9496A1]">
            Press{" "}
            <kbd className="px-1.5 py-0.5 rounded border border-[#1E1F2A] bg-[#181820] text-xs font-mono text-[#F3F4F6]">
              g
            </kbd>{" "}
            then a letter to jump anywhere.
          </p>

          <div className="grid grid-cols-2 gap-2">
            {Object.entries(KEYBOARD_SHORTCUTS).map(([key, item]) => (
              <div
                key={key}
                className="flex items-center justify-between text-xs rounded-lg border border-[#1E1F2A] bg-[#141520] px-3 py-2"
              >
                <span className="text-[#9496A1]">{item.label}</span>
                <span className="flex items-center gap-1 font-mono">
                  <kbd className="px-1.5 py-0.5 rounded border border-[#1E1F2A] bg-[#181820] text-[10px] text-[#F3F4F6]">
                    g
                  </kbd>
                  <kbd className="px-1.5 py-0.5 rounded border border-[#1E1F2A] bg-[#181820] text-[10px] text-[#00D664] font-bold">
                    {key}
                  </kbd>
                </span>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-[#1E1F2A] space-y-2">
            <div className="flex items-center justify-between text-xs rounded-lg border border-[#1E1F2A] bg-[#141520] px-3 py-2">
              <span className="text-[#9496A1]">Search films</span>
              <kbd className="px-1.5 py-0.5 rounded border border-[#1E1F2A] bg-[#181820] text-[10px] font-mono text-[#F3F4F6]">
                /
              </kbd>
            </div>
            <div className="flex items-center justify-between text-xs rounded-lg border border-[#1E1F2A] bg-[#141520] px-3 py-2">
              <span className="text-[#9496A1]">Command palette</span>
              <kbd className="px-1.5 py-0.5 rounded border border-[#1E1F2A] bg-[#181820] text-[10px] font-mono text-[#F3F4F6]">
                ⌘K
              </kbd>
            </div>
            <div className="flex items-center justify-between text-xs rounded-lg border border-[#1E1F2A] bg-[#141520] px-3 py-2">
              <span className="text-[#9496A1]">Show this help</span>
              <kbd className="px-1.5 py-0.5 rounded border border-[#1E1F2A] bg-[#181820] text-[10px] font-mono text-[#F3F4F6]">
                ?
              </kbd>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
