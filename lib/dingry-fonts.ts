import { Anton, Inter } from "next/font/google";

/** UI boutique : prix, navigation, corps de texte. */
export const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

/** Titres d’impact street / hero / grandes sections. */
export const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-anton",
});