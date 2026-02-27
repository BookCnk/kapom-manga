"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List as ListIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  Undo,
  Redo,
  Code,
  Palette,
  Highlighter,
} from "lucide-react";
import { cn } from "@/lib/utils";

type RichTextEditorProps = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  maxLength?: number;
};

function getPlainTextLength(html: string): number {
  if (!html) return 0;
  const tmp = typeof document !== "undefined" ? document.createElement("div") : null;
  if (!tmp) return html.length;
  tmp.innerHTML = html;
  return (tmp.innerText || tmp.textContent || "").length;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "พิมพ์เนื้อหาตรงนี้",
  maxLength = 2000,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const [mode, setMode] = useState<"visual" | "source">("visual");
  const [showColorPanel, setShowColorPanel] = useState(false);
  const [showSizePanel, setShowSizePanel] = useState(false);
  const [fontSizePx, setFontSizePx] = useState(16);
  const [customColor, setCustomColor] = useState("#ffffff");
  const colorPanelRef = useRef<HTMLDivElement | null>(null);
  const sizePanelRef = useRef<HTMLDivElement | null>(null);

  // sync external value -> editor
  useEffect(() => {
    if (!editorRef.current) return;
    if (editorRef.current.innerHTML !== (value || "")) {
      editorRef.current.innerHTML = value || "";
    }
  }, [value]);

  // ปิด color / size panel เมื่อคลิกนอกกรอบ
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (
        showColorPanel &&
        colorPanelRef.current &&
        target &&
        !colorPanelRef.current.contains(target)
      ) {
        setShowColorPanel(false);
      }
      if (
        showSizePanel &&
        sizePanelRef.current &&
        target &&
        !sizePanelRef.current.contains(target)
      ) {
        setShowSizePanel(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showColorPanel, showSizePanel]);

  const applyCommand = (command: string, arg?: string) => {
    if (mode !== "visual") return;
    if (!editorRef.current) return;
    editorRef.current.focus();
    // execCommand ยังรองรับใน browser ส่วนใหญ่ เหมาะกับ use-case นี้
    document.execCommand(command, false, arg);
    const html = editorRef.current.innerHTML;
    onChange(html);
  };

  const handleInput = () => {
    if (!editorRef.current) return;
    if (mode !== "visual") return;
    let html = editorRef.current.innerHTML;

    if (maxLength) {
      const plainLen = getPlainTextLength(html);
      if (plainLen > maxLength) {
        // ถ้าเกิน limit ให้ตัด text ส่วนเกินแบบง่าย ๆ
        const tmp = document.createElement("div");
        tmp.innerHTML = html;
        const text = (tmp.innerText || tmp.textContent || "").slice(0, maxLength);
        editorRef.current.innerText = text;
        html = editorRef.current.innerHTML;
      }
    }

    onChange(html);
  };

  const currentLength = getPlainTextLength(value);

  const buttonClass =
    "w-8 h-8 flex items-center justify-center rounded-md hover:bg-muted text-xs text-foreground";

  const colorOptions = [
    "#000000",
    "#ffffff",
    "#ef4444",
    "#f97316",
    "#facc15",
    "#22c55e",
    "#3b82f6",
    "#6366f1",
    "#ec4899",
  ];

  const applyTextColor = (hex: string) => {
    if (!editorRef.current || mode !== "visual") return;
    editorRef.current.focus();
    document.execCommand("foreColor", false, hex);
    const html = editorRef.current.innerHTML;
    onChange(html);
    setCustomColor(hex);
  };

  const applyFontSize = (px: number) => {
    if (!editorRef.current || mode !== "visual") return;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    if (range.collapsed) return;

    try {
      const span = document.createElement("span");
      span.style.fontSize = `${px}px`;
      range.surroundContents(span);
      setFontSizePx(px);
      const html = editorRef.current.innerHTML;
      onChange(html);
    } catch {
      // fallback ให้ไม่พัง ถ้า surroundContents ใช้ไม่ได้กับ range นี้
      document.execCommand("fontSize", false, "3");
      const html = editorRef.current.innerHTML;
      onChange(html);
    }
  };

  return (
    <div className="border border-border rounded-xl bg-background">
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-border text-xs text-muted-foreground">
        <button
          type="button"
          className={buttonClass}
          onClick={() => applyCommand("bold")}
        >
          <Bold className="w-3 h-3" />
        </button>
        <button
          type="button"
          className={buttonClass}
          onClick={() => applyCommand("italic")}
        >
          <Italic className="w-3 h-3" />
        </button>
        <button
          type="button"
          className={buttonClass}
          onClick={() => applyCommand("underline")}
        >
          <Underline className="w-3 h-3" />
        </button>
        <button
          type="button"
          className={buttonClass}
          onClick={() => applyCommand("strikeThrough")}
        >
          <Strikethrough className="w-3 h-3" />
        </button>

        <span className="mx-1 h-4 w-px bg-border" />

        <button
          type="button"
          className={buttonClass}
          onClick={() => applyCommand("insertUnorderedList")}
        >
          <ListIcon className="w-3 h-3" />
        </button>

        <button
          type="button"
          className={buttonClass}
          onClick={() => applyCommand("justifyLeft")}
        >
          <AlignLeft className="w-3 h-3" />
        </button>
        <button
          type="button"
          className={buttonClass}
          onClick={() => applyCommand("justifyCenter")}
        >
          <AlignCenter className="w-3 h-3" />
        </button>
        <button
          type="button"
          className={buttonClass}
          onClick={() => applyCommand("justifyRight")}
        >
          <AlignRight className="w-3 h-3" />
        </button>

        <span className="mx-1 h-4 w-px bg-border" />

        {/* Text color popover */}
        <div className="relative" ref={colorPanelRef}>
          <button
            type="button"
            className={buttonClass}
            onClick={() => setShowColorPanel((open) => !open)}
          >
            <Palette className="w-3 h-3" />
          </button>

          {showColorPanel && (
            <div className="absolute z-30 mt-2 w-64 rounded-lg border border-border bg-popover p-3 shadow-lg">
              <p className="text-xs font-medium text-foreground mb-2">
                เลือกสีตัวอักษร
              </p>
              <div className="grid grid-cols-9 gap-1 mb-3">
                {colorOptions.map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    className="w-6 h-6 rounded-md border border-border"
                    style={{ backgroundColor: hex }}
                    onClick={() => applyTextColor(hex)}
                  />
                ))}
              </div>

              <p className="text-xs text-muted-foreground mb-1">
                หรือใส่รหัสสี
              </p>
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  value={customColor}
                  onChange={(e) => setCustomColor(e.target.value)}
                  className="flex-1 px-2 py-1 rounded-md bg-background border border-border text-xs text-foreground"
                  placeholder="#000000"
                />
                <button
                  type="button"
                  className="px-2 py-1 rounded-md bg-orange-500 text-white text-xs hover:bg-orange-600"
                  onClick={() => applyTextColor(customColor)}
                >
                  ใช้
                </button>
              </div>

              <button
                type="button"
                className="w-full px-2 py-1 rounded-md border border-border text-xs text-foreground hover:bg-muted"
                onClick={() => {
                  if (!editorRef.current || mode !== "visual") return;
                  editorRef.current.focus();
                  document.execCommand("removeFormat");
                  const html = editorRef.current.innerHTML;
                  onChange(html);
                  setShowColorPanel(false);
                }}
              >
                ลบสี
              </button>
            </div>
          )}
        </div>

        {/* Font size popover */}
        <div className="relative" ref={sizePanelRef}>
          <button
            type="button"
            className={cn(
              buttonClass,
              "px-2 min-w-[52px] justify-between",
            )}
            onClick={() => setShowSizePanel((open) => !open)}
          >
            <span className="text-[11px]">T</span>
            <span className="text-[11px]">{fontSizePx}px</span>
          </button>

          {showSizePanel && (
            <div className="absolute z-30 mt-2 w-64 rounded-lg border border-border bg-popover p-3 shadow-lg">
              <p className="text-xs font-medium text-foreground mb-2">
                ขนาดตัวอักษร
              </p>
              <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
                {[
                  { label: "เล็กมาก", size: 12 },
                  { label: "เล็ก", size: 14 },
                  { label: "ปกติ", size: 16 },
                  { label: "ใหญ่", size: 18 },
                  { label: "ใหญ่มาก", size: 22 },
                ].map((opt) => (
                  <button
                    key={opt.label}
                    type="button"
                    className={cn(
                      "px-2 py-1 rounded-md border border-border hover:bg-muted",
                      fontSizePx === opt.size &&
                        "bg-orange-500/20 border-orange-500 text-foreground",
                    )}
                    onClick={() => applyFontSize(opt.size)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                className="w-full px-2 py-1 rounded-md border border-border text-xs text-foreground hover:bg-muted"
                onClick={() => {
                  setFontSizePx(16);
                  setShowSizePanel(false);
                }}
              >
                รีเซ็ต
              </button>
            </div>
          )}
        </div>

        <span className="mx-1 h-4 w-px bg-border" />

        <button
          type="button"
          className={buttonClass}
          onClick={() => {
            const url = prompt("ใส่ลิงก์ (URL):");
            if (url) applyCommand("createLink", url);
          }}
        >
          <LinkIcon className="w-3 h-3" />
        </button>

        <button
          type="button"
          className={buttonClass}
          onClick={() =>
            setMode((prev) => (prev === "visual" ? "source" : "visual"))
          }
        >
          <Code
            className={cn(
              "w-3 h-3",
              mode === "source" && "text-orange-400",
            )}
          />
        </button>

        <span className="mx-1 h-4 w-px bg-border" />

        <button
          type="button"
          className={buttonClass}
          onClick={() => applyCommand("undo")}
        >
          <Undo className="w-3 h-3" />
        </button>
        <button
          type="button"
          className={buttonClass}
          onClick={() => applyCommand("redo")}
        >
          <Redo className="w-3 h-3" />
        </button>
      </div>

      {/* Editable area */}
      {mode === "visual" ? (
        <div
          ref={editorRef}
          className={cn(
            "min-h-[180px] px-4 py-3 text-sm leading-relaxed outline-none",
            "prose prose-invert max-w-none",
          )}
          contentEditable
          onInput={handleInput}
          data-placeholder={placeholder}
          suppressContentEditableWarning
        />
      ) : (
        <textarea
          className="min-h-[180px] w-full px-4 py-3 text-sm leading-relaxed outline-none bg-background border-t border-border font-mono"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="HTML source code..."
        />
      )}

      {/* Counter */}
      <div className="px-4 py-1 text-xs text-muted-foreground text-right">
        {currentLength}/{maxLength}
      </div>
    </div>
  );
}

