/**
 * Enum representing various MIME types for different file categories.
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

export enum AudioTypes {
  Audios = 'audio/*',
}

export enum VideoTypes {
  Videos = 'video/*',
}

export enum TextTypes {
  PlainText = 'text/plain',
  HTML = 'text/html',
  CSS = 'text/css',
  JavaScript = 'application/javascript',
  CSV = 'text/csv',
  JSON = 'application/json',
  XML = 'application/xml',
}

export enum DocumentTypes {
  PDF = 'application/pdf',
  Word = 'application/msword',
  WordOpenXML = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  Excel = 'application/vnd.ms-excel',
  ExcelOpenXML = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  PowerPoint = 'application/vnd.ms-powerpoint',
  PowerPointOpenXML = 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
}

export enum ArchiveTypes {
  ZIP = 'application/zip',
  GZIP = 'application/gzip',
  TAR = 'application/x-tar',
  RAR = 'application/x-rar-compressed',
}

export enum FontTypes {
  TrueType = 'font/ttf',
  OpenType = 'font/otf',
  WebOpenFont = 'font/woff',
  WebOpenFont2 = 'font/woff2',
}

export enum AppTypes {
  Executable = 'application/octet-stream',
  AndroidAPK = 'application/vnd.android.package-archive',
  Java = 'application/java-archive',
}

export enum OtherTypes {
  JSONLD = 'application/ld+json',
  WASM = 'application/wasm',
}