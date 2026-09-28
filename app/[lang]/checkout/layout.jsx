import { privatePageMetadata } from "@/app/lib/seo";

// Page privée ou transactionnelle : exclue des moteurs de recherche
export const generateMetadata = privatePageMetadata({ fr: "Finaliser ma commande", en: "Checkout" });

export default function CheckoutLayout({ children }) {
  return children;
}
