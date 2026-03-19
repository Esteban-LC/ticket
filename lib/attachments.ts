export interface AttachmentRef {
  provider: 'google-drive' | 'local' | 'legacy'
  sourceKind?: 'recording' | 'upload'
  url: string
  downloadUrl?: string
  previewUrl?: string
  name: string
  mimeType?: string
  size?: number
  fileId?: string
  folderId?: string
  iconLink?: string
  thumbnailLink?: string
}

function fallbackNameFromUrl(url: string) {
  try {
    const pathname = new URL(url, 'http://localhost').pathname
    const filename = pathname.split('/').pop()
    return filename || 'archivo'
  } catch {
    return url.split('/').pop() || 'archivo'
  }
}

export function serializeAttachmentRef(attachment: AttachmentRef): string {
  return JSON.stringify(attachment)
}

export function parseAttachmentRef(value: string): AttachmentRef {
  try {
    const parsed = JSON.parse(value)
    if (parsed && typeof parsed === 'object' && typeof parsed.url === 'string') {
      return {
        provider:
          parsed.provider === 'google-drive'
            ? 'google-drive'
            : parsed.provider === 'local'
              ? 'local'
              : 'legacy',
        sourceKind:
          parsed.sourceKind === 'recording'
            ? 'recording'
            : parsed.sourceKind === 'upload'
              ? 'upload'
              : undefined,
        url: parsed.url,
        downloadUrl: typeof parsed.downloadUrl === 'string' ? parsed.downloadUrl : undefined,
        previewUrl: typeof parsed.previewUrl === 'string' ? parsed.previewUrl : undefined,
        name: typeof parsed.name === 'string' ? parsed.name : fallbackNameFromUrl(parsed.url),
        mimeType: typeof parsed.mimeType === 'string' ? parsed.mimeType : undefined,
        size: typeof parsed.size === 'number' ? parsed.size : undefined,
        fileId: typeof parsed.fileId === 'string' ? parsed.fileId : undefined,
        folderId: typeof parsed.folderId === 'string' ? parsed.folderId : undefined,
        iconLink: typeof parsed.iconLink === 'string' ? parsed.iconLink : undefined,
        thumbnailLink: typeof parsed.thumbnailLink === 'string' ? parsed.thumbnailLink : undefined,
      }
    }
  } catch {
    // Legacy plain URL.
  }

  return {
    provider: 'legacy',
    sourceKind: 'upload',
    url: value,
    previewUrl: value,
    downloadUrl: value,
    name: fallbackNameFromUrl(value),
  }
}

export function isImageAttachment(attachment: AttachmentRef) {
  return attachment.mimeType?.startsWith('image/') || /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(attachment.name)
}

export function isVideoAttachment(attachment: AttachmentRef) {
  if (attachment.mimeType?.startsWith('audio/')) return false
  return attachment.mimeType?.startsWith('video/') || /\.(mp4|webm|mov|avi|mkv|m4v)$/i.test(attachment.name)
}

export function isRecordedAudioAttachment(attachment: AttachmentRef) {
  if (attachment.sourceKind === 'recording') return true
  if (!attachment.mimeType?.startsWith('audio/')) return false

  return /(^|[-_/])audio-\d+/i.test(attachment.name)
}
