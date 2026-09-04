// TODO(実画像): docs/00-overview.md「画像はユーザー提供」。実際のヒーロー画像に差し替える。
// 今は単色背景のプレースホルダ。ヘッダーは常に不透明固定なので、このセクションは
// 他の本文と同じくヘッダーの下から始まる（(shop)/layout.tsx の main の pt-16 をそのまま使う）。
export default function Hero() {
  return (
    <section className="flex h-screen items-center justify-center bg-ink text-paper">
      <div className="text-center">
        <p className="text-xs tracking-[0.3em] uppercase">EC-PORTFOLIO</p>
        <p className="mt-4 text-[11px] tracking-[0.2em] text-graphite uppercase">
          Minimal essentials, made to last.
        </p>
      </div>
    </section>
  );
}
