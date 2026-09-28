// Données structurées schema.org. `<` est échappé pour qu'un texte saisi
// (description, avis) ne puisse pas fermer la balise <script>.
export default function JsonLd({ data }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
