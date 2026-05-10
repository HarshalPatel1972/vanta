export interface TypographySettings {
  size: number;
  emissiveIntensity: number;
  weight: "thin" | "regular" | "bold" | "black";
  spacing: number;
  shake?: boolean;
}

export const mapVolumeToTypography = (rms: number): TypographySettings => {
  if (rms < 20) {
    return { size: 0.06, emissiveIntensity: 0.2, weight: "thin", spacing: 0.04 };
  } else if (rms < 60) {
    return { size: 0.10, emissiveIntensity: 0.5, weight: "regular", spacing: 0.02 };
  } else if (rms < 100) {
    return { size: 0.16, emissiveIntensity: 0.8, weight: "bold", spacing: 0.01 };
  } else if (rms < 180) {
    return { size: 0.26, emissiveIntensity: 1.2, weight: "black", spacing: 0 };
  } else {
    return { size: 0.45, emissiveIntensity: 2.0, weight: "black", spacing: -0.01, shake: true };
  }
};
