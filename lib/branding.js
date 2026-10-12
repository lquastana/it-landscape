// Habillage, lu au build. Une variable vide masque l'élément (ex. nom d'organisation déjà dans le logo).
export const LOGO_URL = process.env.NEXT_PUBLIC_LOGO_URL ?? '/it-landscape-logo.png';
export const ORG_NAME = process.env.NEXT_PUBLIC_ORG_NAME ?? '';
export const APP_TITLE = process.env.NEXT_PUBLIC_APP_TITLE || "Cartographie du Système d'Information";
