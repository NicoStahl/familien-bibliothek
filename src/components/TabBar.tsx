"use client";

// Feste Leiste am unteren Rand — die Hauptnavigation, nicht nur eine Handy-Variante: Das
// iPhone ist Primärgerät, der Katalog wird vor dem Regal bedient. Am Rechner bleibt sie
// stehen und wandert nur mittig unter den auf Lesebreite begrenzten Inhalt.
//
// Höhe 63 px plus env(safe-area-inset-bottom). Der Zusatz liefert nur dann einen Wert, wenn
// im viewport-Export `viewportFit: "cover"` steht — sonst liegt die Leiste auf iPhones unter
// dem Home-Balken.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavIcon } from "@/components/NavIcons";
import { TABS, isActivePath } from "@/lib/nav";
import { useTexte } from "@/components/SpracheProvider";

export function TabBar() {
  const pathname = usePathname();
  const t = useTexte();

  return (
    <nav
      aria-label={t.nav.hauptnavigation}
      className="tabbar fixed inset-x-0 bottom-0 z-40 border-t border-linie bg-papier"
    >
      <ul className="mx-auto flex max-w-2xl items-stretch">
        {TABS.map((item) => {
          const active = isActivePath(pathname, item.href);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex h-[63px] flex-col items-center justify-center gap-1 text-[10px] leading-none ${
                  active ? "font-semibold text-tinte" : "text-stein"
                }`}
              >
                <NavIcon name={item.icon} className="h-[23px] w-[23px]" />
                {t.nav[item.label]}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
