/**
 * Object defining available screen sizes as constants.
 * @readonly
 */
export const sizeEnum = {
  XS: 'XS',
  SM: 'SM',
  MD: 'MD',
  LG: 'LG',
  XL: 'XL',
  XXL: 'XXL',
} as const;

/**
 * Object defining breakpoints for design based on screen width.
 * Values are in pixels.
 * @readonly
 */
export const screenEnum = {
  XS: 480,
  SM: 576,
  MD: 768,
  LG: 992,
  XL: 1200,
  XXL: 1600,
} as const;

/**
 * Map that associates each screen size defined in `sizeEnum` with its corresponding pixel value from `screenEnum`.
 * @type {Map<typeof sizeEnum[keyof typeof sizeEnum], number>}
 */
const screenMap = new Map<typeof sizeEnum[keyof typeof sizeEnum], number>();

screenMap.set(sizeEnum.XS, screenEnum.XS);
screenMap.set(sizeEnum.SM, screenEnum.SM);
screenMap.set(sizeEnum.MD, screenEnum.MD);
screenMap.set(sizeEnum.LG, screenEnum.LG);
screenMap.set(sizeEnum.XL, screenEnum.XL);
screenMap.set(sizeEnum.XXL, screenEnum.XXL);

export { screenMap };