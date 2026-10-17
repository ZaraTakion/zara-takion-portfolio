import type { Locale } from "../content";
export function Signature({ locale }: { locale: Locale }) {
  return (
    <a className="author-signature" href="#about">
      <span className="signature-wordmark">
        <span>Zara</span> <strong>Takion</strong>
      </span>
      <span className="signature-caption">
        {locale === "pt"
          ? "Assinatura criativa de Rodrigo"
          : "Rodrigo’s creative signature"}
        <span aria-hidden="true"> ↗</span>
      </span>
    </a>
  );
}
