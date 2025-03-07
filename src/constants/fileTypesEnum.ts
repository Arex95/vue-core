/**
 * Object defining various image MIME types.
 * @readonly
 */
export const ImageTypes = {
  apng: 'image/apng',
  bmp: 'image/bmp',
  gif: 'image/gif',
  jpeg: 'image/jpeg',
  pjpeg: 'image/pjpeg',
  png: 'image/png',
  svg: 'image/svg+xml',
  tiff: 'image/tiff',
  webp: 'image/webp',
  xicon: 'image/x-icon',
} as const;

/**
 * Object defining various file meta types.
 * @readonly
 */
export const FileMetaTypes = {
  images: 'image/*',
  audios: 'audio/*',
  videos: 'video/*',
} as const;