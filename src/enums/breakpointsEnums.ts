/**
 * An enum that defines a set of standardized screen size labels, ranging from extra-small (XS) to extra-extra-large (XXL).
 * These labels are used to create a consistent vocabulary for responsive design across the application.
 */
export enum ScreenSize {
  XS = 'XS',
  SM = 'SM',
  MD = 'MD',
  LG = 'LG',
  XL = 'XL',
  XXL = 'XXL'
}

/**
 * An enum that establishes specific pixel values for screen width breakpoints, corresponding to the labels in `ScreenSize`.
 * These values are used to implement responsive design changes at standard device widths.
 */
export enum ScreenBreakpoint {
  XS = 480,
  SM = 576,
  MD = 768,
  LG = 992,
  XL = 1200,
  XXL = 1600
}

/**
 * A map that associates the symbolic screen size names from the `ScreenSize` enum with their
 * corresponding pixel values from the `ScreenBreakpoint` enum. This provides an easy way to
 * look up the pixel width for a given screen size label.
 * @type {Map<ScreenSize, number>}
 */
const screenMap = new Map<ScreenSize, number>();

screenMap.set(ScreenSize.XS, ScreenBreakpoint.XS);
screenMap.set(ScreenSize.SM, ScreenBreakpoint.SM);
screenMap.set(ScreenSize.MD, ScreenBreakpoint.MD);
screenMap.set(ScreenSize.LG, ScreenBreakpoint.LG);
screenMap.set(ScreenSize.XL, ScreenBreakpoint.XL);
screenMap.set(ScreenSize.XXL, ScreenBreakpoint.XXL);

export { screenMap };