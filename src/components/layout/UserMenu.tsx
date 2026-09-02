"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  CircleUserRound,
  ClipboardList,
  Heart,
  LayoutDashboard,
  LogOut,
  PackagePlus,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import type { SessionUser } from "@/lib/auth";
import type { ProfileSocials } from "@/lib/data";
import {
  FacebookIcon,
  InstagramIcon,
  LinkedInIcon,
  WhatsAppIcon,
  XIcon,
} from "@/components/member/SocialIcons";
import { NotificationBell, type NotifItem } from "@/components/member/NotificationBell";

const SOCIAL_META: {
  key: keyof ProfileSocials;
  label: string;
  icon: typeof InstagramIcon;
  hover: string;
}[] = [
  { key: "instagram", label: "Instagram", icon: InstagramIcon, hover: "hover:text-[#d32f2f]" },
  { key: "whatsapp", label: "WhatsApp", icon: WhatsAppIcon, hover: "hover:text-green-600" },
  { key: "linkedin", label: "LinkedIn", icon: LinkedInIcon, hover: "hover:text-blue-600" },
  { key: "twitter", label: "X / Twitter", icon: XIcon, hover: "hover:text-navy" },
  { key: "facebook", label: "Facebook", icon: FacebookIcon, hover: "hover:text-blue-700" },
];

/** Item menu dropdown akun. */
function MenuItem({
  href,
  icon: Icon,
  label,
  onClick,
  accent,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  accent?: "blue" | "brand";
}) {
  const cls =
    accent === "blue"
      ? "font-semibold text-blue-700 hover:bg-blue-50"
      : accent === "brand"
        ? "font-medium text-brand hover:bg-brand-soft"
        : "font-medium text-navy hover:bg-surface";
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition ${cls}`}
    >
      <Icon className="h-4 w-4 text-muted" aria-hidden="true" />
      {label}
    </Link>
  );
}

export function UserMenu({
  user,
  isAdmin,
  notifications = [],
  socials,
}: {
  user: SessionUser;
  isAdmin: boolean;
  notifications?: NotifItem[];
  socials?: ProfileSocials;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function signOut() {
    await fetch("/auth/signout", { method: "POST" });
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      {!isAdmin && notifications.length > 0 && (
        <NotificationBell items={notifications} userKey={user.email} />
      )}
      <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Menu akun"
        aria-expanded={open}
        className="flex h-10 items-center gap-1.5 rounded-full border-2 border-brand/60 bg-white pl-0.5 pr-2.5 text-navy transition hover:border-brand hover:shadow-sm"
      >
        <span className="flex h-[30px] w-[30px] items-center justify-center overflow-hidden rounded-full bg-surface">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
          ) : (
            <CircleUserRound className="h-5 w-5" />
          )}
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-muted transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div className="animate-fade-in absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-line bg-white shadow-xl">
          {/* Kartu identitas */}
          <div className="border-b border-line px-5 pb-4 pt-5">
            <div className="flex items-center gap-3">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-surface bg-surface">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
                ) : (
                  <CircleUserRound className="h-7 w-7 text-muted" />
                )}
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="truncate text-sm font-bold text-navy">{user.name}</p>
                  <span
                    className={
                      isAdmin
                        ? "rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700"
                        : "rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-bold text-green-700"
                    }
                  >
                    {isAdmin ? "Admin" : "Member"}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-xs text-muted">{user.email}</p>
              </div>
            </div>

            {/* Sosmed: link sungguhan ke platform */}
            {socials && (
              <div className="mt-3 flex items-center gap-1.5">
                {SOCIAL_META.map(({ key, label, icon: Icon, hover }) =>
                  socials[key] ? (
                    <a
                      key={key}
                      href={socials[key] as string}
                      target="_blank"
                      rel="noopener noreferrer me"
                      aria-label={label}
                      title={label}
                      className={`flex h-8 w-8 items-center justify-center rounded-lg border border-line text-muted transition hover:border-navy/20 hover:bg-surface ${hover}`}
                    >
                      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                    </a>
                  ) : null
                )}
              </div>
            )}
          </div>

          {/* Menu akun: satu list flat, urut sesuai alur pakai */}
          <div className="p-2">
            {isAdmin && (
              <MenuItem href="/admin" icon={LayoutDashboard} label="Panel Admin" onClick={() => setOpen(false)} accent="blue" />
            )}
            <MenuItem href="/dashboard" icon={LayoutDashboard} label="Dashboard" onClick={() => setOpen(false)} />
            <MenuItem href="/pengajuan" icon={ClipboardList} label="Pengajuan Saya" onClick={() => setOpen(false)} />
            <MenuItem href="/favorit" icon={Heart} label="Favorit" onClick={() => setOpen(false)} />
            <MenuItem href="/profil" icon={UserRound} label="Profil Saya" onClick={() => setOpen(false)} />
            <MenuItem href="/submit" icon={PackagePlus} label="Submit Produk" onClick={() => setOpen(false)} accent="brand" />
            <button
              onClick={signOut}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium text-navy transition hover:bg-surface"
            >
              <LogOut className="h-4 w-4 text-muted" aria-hidden="true" />
              Keluar
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
