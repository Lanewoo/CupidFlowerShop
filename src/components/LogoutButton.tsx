"use client";

import { useRouter } from "@/i18n/navigation";

type Props = {
  label: string;
  className?: string;
};

export function LogoutButton({ label, className }: Props) {
  const router = useRouter();

  return (
    <button
      type="button"
      className={className}
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.refresh();
        router.push("/");
      }}
    >
      {label}
    </button>
  );
}
