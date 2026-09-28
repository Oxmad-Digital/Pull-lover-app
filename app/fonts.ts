import { Montserrat } from "next/font/google";

// Partagée par les deux layouts racines : le site public (app/[lang]) et l'administration (app/admin)
export const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-montserrat",
  display: "swap",
});
