import { NO_INDEX } from "@/app/lib/seo";

// Page privée ou transactionnelle : exclue des moteurs de recherche
export const metadata = { title: "Finaliser ma commande", robots: NO_INDEX };

export default function CheckoutLayout({ children }) {
  return children;
}
