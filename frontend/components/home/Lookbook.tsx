// TODO(実画像): ルックブック画像（5〜6枚）に差し替える。今は枚数分のプレースホルダ枠のみ。
const PLACEHOLDER_COUNT = 6;

export default function Lookbook() {
  return (
    <section className="border-t border-ink py-20">
      <div className="flex gap-4 overflow-x-auto px-6 pb-2">
        {Array.from({ length: PLACEHOLDER_COUNT }, (_, index) => (
          <div key={index} className="aspect-3/4 w-64 flex-none bg-mist" />
        ))}
      </div>
    </section>
  );
}
