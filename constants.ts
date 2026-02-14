import { CouponConfig } from './types';

export const APP_TITLE = "Jalpan Services – Cash Manager";
export const FOOTER_TEXT = "";

export const COUPON_CONFIGS: CouponConfig[] = [
  { label: "Rs 5", faceValue: 5, bundleSize: 500, color: "#bdd6f5", textColor: "black" },
  { label: "Rs 10", faceValue: 10, bundleSize: 500, color: "#c2a091", textColor: "black" },
  { label: "Rs 15", faceValue: 15, bundleSize: 500, color: "#f1bf85", textColor: "black" },
  { label: "Rs 20", faceValue: 20, bundleSize: 500, color: "#c8f7da", textColor: "black" },
  { label: "Rs 50", faceValue: 50, bundleSize: 400, color: "#fac4e3", textColor: "black" },
  { label: "Rs 50 (Combo)", faceValue: 50, bundleSize: 100, color: "#93ce8c", textColor: "black" },
  { label: "Rs 100 (Combo)", faceValue: 100, bundleSize: 100, color: "#c2a8db", textColor: "black" },
];

export const DATE_FORMAT = "YYYY-MM-DD"; // Internal use