/** Messages FR pour erreurs Supabase Auth (boutique). */
export function mapShopAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("invalid login credentials")) {
    return "E-mail ou mot de passe incorrect.";
  }
  if (lower.includes("email not confirmed")) {
    return "Confirmez votre adresse e-mail avant de vous connecter.";
  }
  if (lower.includes("rate limit")) {
    return "Trop de tentatives. Réessayez dans quelques minutes.";
  }
  if (lower.includes("signup is disabled")) {
    return "Création de compte indisponible pour le moment.";
  }
  if (lower.includes("user already registered")) {
    return "Un compte existe déjà avec cet e-mail.";
  }
  return "Connexion impossible. Vérifiez vos informations ou réessayez.";
}
