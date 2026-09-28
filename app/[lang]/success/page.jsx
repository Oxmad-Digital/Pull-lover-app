import { privatePageMetadata } from "@/app/lib/seo";

export const generateMetadata = privatePageMetadata({ fr: "Commande confirmée", en: "Order confirmed" });

const TEXT = {
  fr: {
    title: "✅ Commande confirmée",
    thanks: "Merci pour votre achat ! Un email de confirmation vient de vous être envoyé.",
    shipping: "Votre colis vous sera expédié à la fin de la période du drop ; vous recevrez un numéro de suivi par email.",
  },
  en: {
    title: "✅ Order confirmed",
    thanks: "Thank you for your purchase! A confirmation email is on its way.",
    shipping: "Your parcel will ship at the end of the drop period; you’ll receive a tracking number by email.",
  },
};

export default async function SuccessPage({ params }) {
  const { lang } = await params;
  const t = TEXT[lang];
  return (
    <div style={{ textAlign: "center", margin: "80px 16px" }} data-reveal-stagger>
      <h1>{t.title}</h1>
      <p>{t.thanks}</p>
      <p>{t.shipping}</p>
    </div>
  );
}
