export const assetPath = (file: string) =>
  `${import.meta.env.VITE_KABIYAHE_LOCAL_ASSETS === "true" ? "/assets" : "/manus-storage"}/${file}`;
