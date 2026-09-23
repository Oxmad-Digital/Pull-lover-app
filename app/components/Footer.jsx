import Link from "next/link";
import Image from "next/image";
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="pl-footer">
      <div className="pl-footer-main">
        <Link className="pl-footer-brand" href="/" aria-label="Pull-Lover, accueil">
          <Image
            className="pl-footer-logo"
            src="/api/media/pull-lover_logo_coeur_rouge-transparent.webp"
            alt=""
            width={500}
            height={500}
            sizes="(max-width: 599px) 112px, 144px"
          />
        </Link>
        <nav className="pl-footer-column" aria-label="Découvrir Pull-Lover">
          <h2>Découvrir</h2>
          <Link href="/#piece">Le Mantasoa</Link>
          <Link href="/#atelier">Notre atelier</Link>
          <Link href="/#precommande-info">La précommande</Link>
        </nav>
        <nav className="pl-footer-column" aria-label="Restons en lien">
          <h2>Restons en lien</h2>
          <Link href="/contact">Nous écrire</Link>
          <Link href="/NotreMarque">Notre histoire</Link>
          <Link href="/dashboard">Mon compte</Link>
        </nav>
      </div>
      <div className="pl-footer-bottom">
        <p>© {new Date().getFullYear()} Pull-Lover</p>
        <p>Imaginé et fabriqué à Madagascar</p>
        <nav aria-label="Informations légales">
          <Link href="/mentions-legales">Mentions légales</Link>
          <Link href="/conditions-de-vente">Conditions de vente</Link>
          <Link href="/politique-de-confidentialite">Confidentialité</Link>
        </nav>
      </div>
      <p className="pl-footer-credit">Réalisé par <a href="https://oxmad-digital.mg" target="_blank" rel="noopener noreferrer">Oxmad Digital</a></p>
    </footer>
  );
}
