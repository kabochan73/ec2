type ToastProps = {
  message: string;
  show: boolean;
};

/**
 * 画面下固定の簡易トースト。表示・消去のタイミングは呼び出し元が state で管理する。
 */
export default function Toast({ message, show }: ToastProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed inset-x-0 bottom-6 z-50 flex justify-center px-6 transition-opacity duration-300 ${
        show ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <p className="bg-ink px-6 py-3 text-xs tracking-widest text-paper uppercase">{message}</p>
    </div>
  );
}
