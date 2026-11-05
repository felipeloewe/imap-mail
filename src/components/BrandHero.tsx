import Link from "next/link";
import type { ReactNode } from "react";

type Props = {
  eyebrow?: string;
  title: ReactNode;
  support?: ReactNode;
  actions?: ReactNode;
  topRight?: ReactNode;
  compact?: boolean;
};

/** Hero homologado a la gráfica Repositoria (navy→teal + marca). */
export function BrandHero({
  eyebrow = "Repositoria · Correo",
  title,
  support,
  actions,
  topRight,
  compact = false,
}: Props) {
  return (
    <header className={`hero${compact ? " hero--compact" : ""}`}>
      <div className="hero__top">
        <Link href="/" className="hero__brand" aria-label="Repositoria Correo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/logo-on-dark.svg"
            alt="Repositoria — Gestor documental"
            width={240}
            height={55}
            className="hero__logo"
          />
        </Link>
        {topRight}
      </div>
      {eyebrow ? <p className="hero-eyebrow">{eyebrow}</p> : null}
      <h1 className={`hero__title${compact ? " hero__title--compact" : ""}`}>
        {title}
      </h1>
      {support ? <div className="hero__support">{support}</div> : null}
      {actions ? <div className="hero__actions">{actions}</div> : null}
    </header>
  );
}
