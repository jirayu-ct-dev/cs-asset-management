export const normalizeAssetNumber = (value: unknown): string => {
  return String(value ?? '').normalize('NFKC').trim().replace(/\s+/g, ' ')
}

export const parseLocalizedDate = (value: unknown): Date | null => {
  if (value instanceof Date && !Number.isNaN(value.valueOf())) return value
  const text = String(value ?? '').trim()
  if (!text) return null

  const parts = text.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/)
  if (parts) {
    const year = Number(parts[3]) > 2400 ? Number(parts[3]) - 543 : Number(parts[3])
    const date = new Date(Date.UTC(year, Number(parts[2]) - 1, Number(parts[1])))
    if (date.getUTCFullYear() === year && date.getUTCMonth() === Number(parts[2]) - 1 && date.getUTCDate() === Number(parts[1])) return date
    return null
  }

  const parsed = new Date(text)
  return Number.isNaN(parsed.valueOf()) ? null : parsed
}

export const parseDecimal = (value: unknown): number | null => {
  const normalized = String(value ?? '').trim().replace(/,/g, '')
  if (!normalized) return null
  const parsed = Number(normalized)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null
}
