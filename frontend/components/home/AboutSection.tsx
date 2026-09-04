// 旧 /about を統合したセクション（docs/01-sitemap-pages.md）。
// BrandConcept が「理念・コンセプト」を担当するので、ここでは同じ内容を繰り返さず
// 「沿革・素材へのこだわり・製造背景」に役割を絞る。
// TODO(実画像): 3枚とも実際の写真に差し替える。

type AboutBlock = {
  label: string;
  body: string;
  /** true で画像を右に置く（交互レイアウト） */
  imageRight?: boolean;
};

const BLOCKS: AboutBlock[] = [
  {
    label: "Since 2019",
    body:
      "EC-PORTFOLIO started as a handful of samples sewn in a single rented room, made because the basics we wanted didn't quite exist yet. What began as a short run of five pieces has grown slowly, one small collection at a time, without ever changing what the label was for.",
  },
  {
    label: "Material",
    body:
      "Fabrics are chosen for how they hold up after fifty washes, not how they look on the first day. We work with a short list of mills we return to season after season, and we'd rather repeat a proven cloth than chase a new one.",
    imageRight: true,
  },
  {
    label: "Production",
    body:
      "Every piece is produced in small, numbered batches with a single manufacturing partner we've worked with since the beginning, rather than spread across factories chasing the lowest cost.",
  },
];

export default function AboutSection() {
  return (
    <section className="border-t border-ink px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center text-2xl font-medium tracking-[0.15em] uppercase">About</h2>

        <div className="mt-16 flex flex-col gap-20">
          {BLOCKS.map((block) => (
            <div key={block.label} className="grid gap-12 md:grid-cols-2 md:items-center">
              <div
                className={`aspect-4/3 bg-mist ${block.imageRight ? "md:order-2" : ""}`}
              />
              <div className={block.imageRight ? "md:order-1" : ""}>
                <p className="text-[11px] tracking-widest text-graphite uppercase">
                  {block.label}
                </p>
                <p className="mt-4 text-sm leading-loose text-graphite">{block.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
