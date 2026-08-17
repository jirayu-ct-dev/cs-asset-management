export interface ApiListResponse<T> {
  data?: T[]
  items?: T[]
  total?: number
}

export const useResourceList = <T>(endpoint: string) => {
  const route = useRoute()
  const query = ref('')
  const refreshKey = ref(0)
  const { data, status, error, refresh } = useFetch<ApiListResponse<T> | T[]>(endpoint, {
    query: computed(() => ({
      search: query.value || undefined,
      refresh: refreshKey.value || undefined,
      assetId: endpoint === '/api/loans' && typeof route.query.assetId === 'string' ? route.query.assetId : undefined,
    })),
    watch: false,
  })

  const items = computed<T[]>(() => {
    if (Array.isArray(data.value)) return data.value
    return data.value?.data ?? data.value?.items ?? []
  })
  const total = computed(() => Array.isArray(data.value) ? data.value.length : (data.value?.total ?? items.value.length))
  const reload = () => {
    refreshKey.value += 1
    return refresh()
  }

  return { query, items, total, status, error, reload }
}
