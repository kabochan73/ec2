import NewsletterForm from "./NewsletterForm";

// Shipping / Returns / Privacy / Terms は docs/01-sitemap-pages.md 上「静的プレースホルダ」で、
// ルート一覧にも実ページが無いため、リンクにはせずラベルとして表示するだけにする。
const PLACEHOLDER_LINKS = ["Shipping", "Returns", "Privacy", "Terms"];

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-ink">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-16 md:grid-cols-3">
        <NewsletterForm />

        <ul className="flex flex-col gap-3 text-xs tracking-[0.15em] text-graphite uppercase">
          {PLACEHOLDER_LINKS.map((label) => (
            <li key={label}>{label}</li>
          ))}
        </ul>
      </div>

      <div className="border-t border-ink px-6 py-6 text-center text-[11px] tracking-widest text-graphite uppercase">
        © 2026 EC-PORTFOLIO. All rights reserved.
      </div>
    </footer>
  );
}
