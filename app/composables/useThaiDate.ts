export const useThaiDate = () => {
  const formatter = new Intl.DateTimeFormat('th-TH-u-ca-buddhist', {
    dateStyle: 'medium',
    timeZone: 'Asia/Bangkok',
  })
  const dateTimeFormatter = new Intl.DateTimeFormat('th-TH-u-ca-buddhist', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Bangkok',
  })

  const formatThaiDate = (value?: string | Date | null, includeTime = false) => {
    if (!value) return '—'
    const date = value instanceof Date ? value : new Date(value)
    if (Number.isNaN(date.getTime())) return '—'
    return (includeTime ? dateTimeFormatter : formatter).format(date)
  }

  return { formatThaiDate }
}
