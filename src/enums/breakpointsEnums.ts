/**
 * Enum defining available screen sizes.
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
 * Enum defining breakpoints for design based on screen width.
 * Values are in pixels.
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
 * Map that associates each screen size defined in `ScreenSize` with its corresponding pixel value from `ScreenBreakpoint`.
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