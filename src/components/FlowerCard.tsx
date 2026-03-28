import Image from "next/image";
import type { Flower, LocaleCode } from "@/lib/types";
import { OrderButton } from "./OrderButton";

type Props = {
  flower: Flower;
  locale: string;
};

export function FlowerCard({ flower, locale }: Props) {
  const loc = (["zh", "en", "hu"].includes(locale) ? locale : "zh") as LocaleCode;
  const name = flower.names[loc] || flower.names.zh;
  const price = flower.priceHint[loc] || flower.priceHint.zh;
  const remote = flower.image.startsWith("http");
  const upload = flower.image.startsWith("/uploads/");
  const unoptimized = remote || upload;

  return (
    <article className="group overflow-hidden rounded-2xl border border-rose-200/70 bg-white shadow-md shadow-rose-900/[0.06] transition hover:-translate-y-0.5 hover:border-rose-300/80 hover:shadow-lg hover:shadow-rose-900/[0.08]">
      <div className="relative aspect-[8/5] w-full min-h-0 overflow-hidden bg-rose-50/80">
        {flower.image ? (
          <Image
            src={flower.image}
            alt={name}
            fill
            className="object-cover transition duration-500 group-hover:scale-[1.03]"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            unoptimized={unoptimized}
            priority={false}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-rose-400">
            —
          </div>
        )}
      </div>
      <div className="space-y-1.5 px-4 py-4">
        <h3 className="font-display text-lg font-medium tracking-tight text-stone-900">
          {name}
        </h3>
        <p className="text-sm font-semibold text-rose-700">{price}</p>
        <OrderButton flowerId={flower.id} />
      </div>
    </article>
  );
}
