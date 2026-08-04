export interface HotelTheme {
  ink: string;
  gold: string;
}

/** Original Tuka brand palette from the Figma designs — used for any hotel that doesn't set its own theme. */
export const DEFAULT_THEME: HotelTheme = {
  ink: "#17223b",
  gold: "#efc75e",
};
