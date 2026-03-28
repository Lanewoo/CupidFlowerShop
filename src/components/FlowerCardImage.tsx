"use client";

import Image from "next/image";
import { useState } from "react";

type Props = {
  src: string;
  alt: string;
  unoptimized: boolean;
  sizes: string;
  className: string;
};

export function FlowerCardImage({ src, alt, unoptimized, sizes, className }: Props) {
  const [broken, setBroken] = useState(false);

  if (broken) {
    return (
      <div className="flex h-full items-center justify-center bg-rose-50/80 text-sm text-rose-400">
        —
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      className={className}
      sizes={sizes}
      unoptimized={unoptimized}
      priority={false}
      onError={() => setBroken(true)}
    />
  );
}
