"use client";

import { useState } from "react";

/**
 * ニュースレター登録フォーム。ダミーで、実際にはどこにも送信しない
 * （docs/01-sitemap-pages.md: 「送信でトースト表示のみ」）。
 */
export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setEmail("");
    setSubmitted(true);
    // 3秒でトーストを消す
    setTimeout(() => setSubmitted(false), 3000);
  }

  return (
    <div>
      <p className="mb-4 text-xs tracking-[0.15em] uppercase">Newsletter</p>
      <form onSubmit={handleSubmit} className="flex border-b border-ink">
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="EMAIL ADDRESS"
          className="flex-1 bg-transparent py-2 text-xs tracking-widest uppercase outline-none placeholder:text-graphite"
        />
        <button type="submit" className="px-2 text-xs tracking-widest uppercase">
          SUBMIT
        </button>
      </form>
      {/* role="status" でスクリーンリーダーにも通知される */}
      <p role="status" className="mt-2 h-4 text-[11px] text-graphite">
        {submitted ? "Thank you for subscribing." : ""}
      </p>
    </div>
  );
}
