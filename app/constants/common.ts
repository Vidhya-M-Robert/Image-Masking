export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp",] as const;
export const MAX_FILE_SIZE_IN_MB = 5;
export const MAX_FILE_SIZE = MAX_FILE_SIZE_IN_MB * 1024 * 1024;