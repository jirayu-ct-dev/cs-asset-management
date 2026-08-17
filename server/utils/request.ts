import type { H3Event } from 'h3'
import type { z } from 'zod'

export const readSchemaBody = async <T extends z.ZodType>(event: H3Event, schema: T): Promise<z.output<T>> => {
  const result = await schema.safeParseAsync(await readBody(event))
  if (!result.success) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Validation failed',
      data: result.error.flatten(),
    })
  }
  return result.data
}

export const getPageQuery = (event: H3Event) => {
  const query = getQuery(event)
  const page = Math.max(1, Number(query.page) || 1)
  const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 20))
  return { page, pageSize, skip: (page - 1) * pageSize, query }
}

type SortDirection = 'asc' | 'desc'

export const getSortOrder = <T>(
  query: { sortBy?: unknown, sortDirection?: unknown },
  options: Record<string, (direction: SortDirection) => T>,
  fallback: T[],
): T[] => {
  const sortBy = typeof query.sortBy === 'string' ? query.sortBy : ''
  const direction = query.sortDirection === 'asc' || query.sortDirection === 'desc' ? query.sortDirection : undefined
  const buildOrder = options[sortBy]
  return direction && buildOrder ? [buildOrder(direction), { id: 'asc' } as T] : fallback
}

export const requiredRouteParam = (event: H3Event, name = 'id'): string => {
  const value = getRouterParam(event, name)
  if (!value) throw createError({ statusCode: 400, statusMessage: `Missing ${name}` })
  return value
}
