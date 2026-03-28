"use client";

import Image from "next/image";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { flowerImageSrc, flowerImageUnoptimized } from "@/lib/flower-image";

type Props = { rawSrc: string };

export function AdminFlowerPreview({ rawSrc }: Props) {
  const t = useTranslations("Admin");
  const [broken, setBroken] = useState(false);
  const src = flowerImageSrc(rawSrc);
  const unoptimized = flowerImageUnoptimized(rawSrc);

  if (broken) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-1 px-2 text-center text-[11px] leading-snug text-rose-400">
        <span>—</span>
        <span className="text-rose-500/90">{t("imageBrokenHint")}</span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt=""
      fill
      className="object-cover"
      unoptimized={unoptimized}
      onError={() => setBroken(true)}
    />
  );
}
