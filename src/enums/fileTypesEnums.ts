/**
 * An enum that defines MIME types for common image formats.
 * @readonly
 */
export enum ImageTypes {
  APNG = 'image/apng',
  BMP = 'image/bmp',
  GIF = 'image/gif',
  JPEG = 'image/jpeg',
  PJPEG = 'image/pjpeg',
  PNG = 'image/png',
  SVG = 'image/svg+xml',
  TIFF = 'image/tiff',
  WEBP = 'image/webp',
  XICON = 'image/x-icon',
}

/**
 * An enum for generic audio MIME types.
 * @readonly
 */
export enum AudioTypes {
  Audios = 'audio/*',
}

/**
 * An enum for generic video MIME types.
 * @readonly
 */
export enum VideoTypes {
  Videos = 'video/*',
}

/**
 * An enum that defines MIME types for various text-based formats, including plain text, markup, and data serialization formats.
 * @readonly
 */
export enum TextTypes {
  PlainText = 'text/plain',
  HTML = 'text/html',
  CSS = 'text/css',
  JavaScript = 'application/javascript',
  CSV = 'text/csv',
  JSON = 'application/json',
  XML = 'application/xml',
}

/**
 * An enum that defines MIME types for common document formats, such as PDFs and Microsoft Office files.
 * @readonly
 */
export enum DocumentTypes {
  PDF = 'application/pdf',
  Word = 'application/msword',
  WordOpenXML = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  Excel = 'application/vnd.ms-excel',
  ExcelOpenXML = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  PowerPoint = 'application/vnd.ms-powerpoint',
  PowerPointOpenXML = 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
}

/**
 * An enum that defines MIME types for popular archive and compression formats.
 * @readonly
 */
export enum ArchiveTypes {
  ZIP = 'application/zip',
  GZIP = 'application/gzip',
  TAR = 'application/x-tar',
  RAR = 'application/x-rar-compressed',
}

/**
 * An enum that defines MIME types for different font file formats.
 * @readonly
 */
export enum FontTypes {
  TrueType = 'font/ttf',
  OpenType = 'font/otf',
  WebOpenFont = 'font/woff',
  WebOpenFont2 = 'font/woff2',
}

/**
 * An enum that defines MIME types for application-specific formats, including executables and packages.
 * @readonly
 */
export enum AppTypes {
  Executable = 'application/octet-stream',
  AndroidAPK = 'application/vnd.android.package-archive',
  Java = 'application/java-archive',
}

/**
 * An enum for miscellaneous MIME types that do not fit into the other categories.
 * @readonly
 */
export enum OtherTypes {
  JSONLD = 'application/ld+json',
  WASM = 'application/wasm',
}