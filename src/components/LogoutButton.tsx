"use client";

type Props = {
  label: string;
  className?: string;
};

export function LogoutButton({ label, className }: Props) {
  return (
    <button
      type="button"
      className={className}
      onClick={async () => {
        await fetch("/api/auth/logout", {
          method: "POST",
          credentials: "include",
        });
        window.location.assign("/");
      }}
    >
      {label}
    </button>
  );
}
