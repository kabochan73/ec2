"use client";

import { forwardRef, useImperativeHandle, useState } from "react";

import type { SizeChart } from "@/lib/types";

export type SizeChartEditorHandle = {
  /** 現在の入力から SizeChart を組み立てる。「サイズ表なし」なら null */
  getValue: () => SizeChart | null;
};

type SizeChartEditorProps = {
  initialValue: SizeChart | null;
};

const SIZES = ["S", "M", "L"] as const;

/**
 * size_chart（jsonb）の簡易エディタ。docs/05-admin.md は「列名＋S/M/L の数値グリッド編集」
 * だが、列の動的追加・削除まで作るとフォームが重くなるので、列名・各サイズの数値は
 * カンマ区切りのテキスト入力にしている（例: 列 "着丈,身幅,肩幅"、S行 "66,52,46"）。
 *
 * react-hook-form には載せず、親（ProductForm）が ref 経由で送信時に getValue() を呼ぶ。
 */
const SizeChartEditor = forwardRef<SizeChartEditorHandle, SizeChartEditorProps>(
  function SizeChartEditor({ initialValue }, ref) {
    const [enabled, setEnabled] = useState(initialValue !== null);
    const [unit, setUnit] = useState(initialValue?.unit ?? "cm");
    const [columnsText, setColumnsText] = useState(initialValue?.columns.join(",") ?? "");
    const [rowsText, setRowsText] = useState<Record<string, string>>(() => {
      const initial: Record<string, string> = { S: "", M: "", L: "" };
      for (const size of SIZES) {
        initial[size] = initialValue?.rows[size]?.join(",") ?? "";
      }
      return initial;
    });

    useImperativeHandle(ref, () => ({
      getValue: () => {
        if (!enabled) return null;

        const columns = columnsText
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean);

        const rows: Record<string, number[]> = {};
        for (const size of SIZES) {
          const numbers = (rowsText[size] ?? "")
            .split(",")
            .map((n) => Number(n.trim()))
            .filter((n) => !Number.isNaN(n));
          if (numbers.length > 0) {
            rows[size] = numbers;
          }
        }

        return { unit, columns, rows };
      },
    }));

    return (
      <div>
        <label className="flex items-center gap-2 text-[11px] tracking-widest text-graphite uppercase">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
          />
          Has Size Chart
        </label>

        {enabled && (
          <div className="mt-4 space-y-4 border border-mist p-4">
            <div>
              <label className="block text-[11px] tracking-widest text-graphite uppercase">
                Unit
              </label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="mt-2 w-24 border-b border-ink bg-transparent py-2 text-sm outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] tracking-widest text-graphite uppercase">
                Columns（カンマ区切り。例: 着丈,身幅,肩幅,袖丈）
              </label>
              <input
                type="text"
                value={columnsText}
                onChange={(e) => setColumnsText(e.target.value)}
                className="mt-2 w-full border-b border-ink bg-transparent py-2 text-sm outline-none"
              />
            </div>
            {SIZES.map((size) => (
              <div key={size}>
                <label className="block text-[11px] tracking-widest text-graphite uppercase">
                  {size}（カンマ区切りの数値。列の順番に対応）
                </label>
                <input
                  type="text"
                  value={rowsText[size]}
                  onChange={(e) => setRowsText({ ...rowsText, [size]: e.target.value })}
                  className="mt-2 w-full border-b border-ink bg-transparent py-2 text-sm outline-none"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  },
);

export default SizeChartEditor;
