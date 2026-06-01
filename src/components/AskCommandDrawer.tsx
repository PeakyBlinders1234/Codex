"use client";

import { useEffect, useRef } from "react";
import { Bot, Sparkles, X } from "lucide-react";
import { NaturalLanguageQueryDemo } from "@/components/NaturalLanguageQueryDemo";

export function AskCommandDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div className="liquid-drawer-backdrop" aria-hidden={false}>
      <button type="button" className="absolute inset-0 cursor-default" aria-label="关闭 AI 问数抽屉" onClick={onClose} />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="ask-drawer-title"
        className="liquid-drawer-panel"
      >
        <header className="sticky top-0 z-20 border-b border-line bg-[rgba(var(--panel-rgb),0.76)] px-4 py-3 backdrop-blur-2xl sm:px-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-accent">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                Isolated AI Ask Layer
              </p>
              <h2 id="ask-drawer-title" className="mt-1 text-lg font-semibold text-ink">
                AI 问数与补充询问
              </h2>
              <p className="mt-1 text-xs leading-5 text-muted">
                独立抽屉承载 Slot Filling 流程，主工作台保持总控、分析和行动视图不重叠。
              </p>
            </div>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              className="liquid-control inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted transition hover:text-ink focus:outline-none focus:ring-2 focus:ring-accent/40"
              aria-label="关闭 AI 问数抽屉"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted">
            <span className="liquid-control inline-flex min-h-8 items-center gap-1 rounded-full px-3">
              <Bot className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
              Mock AI 稳定演示
            </span>
            <span className="liquid-control inline-flex min-h-8 items-center rounded-full px-3">校区 ID · 时间范围 · 指标槽位</span>
            <span className="liquid-control inline-flex min-h-8 items-center rounded-full px-3">看板 + Excel 表格</span>
          </div>
        </header>
        <div className="ask-drawer-scroll px-4 py-4 sm:px-5">
          <NaturalLanguageQueryDemo variant="drawer" />
        </div>
      </section>
    </div>
  );
}
