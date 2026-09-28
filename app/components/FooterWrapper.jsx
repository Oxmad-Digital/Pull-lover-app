import Footer from "./Footer";

// Seul le site public (app/[lang]) affiche le footer : l'administration a son propre layout racine
export default function FooterWrapper() {
  return <Footer />;
}
