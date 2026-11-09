import { Anton } from "next/font/google";

/** Unique instance Anton — subset latin, display swap. */
export const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-anton",
});
