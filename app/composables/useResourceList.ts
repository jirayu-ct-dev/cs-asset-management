export interface ApiListResponse<T> {
  data?: T[]
  items?: T[]
  total?: number
  page?: number
  pageSize?: number
}

export const useResourceList = <T>(endpoint: string, initialFilters: Record<string, string> = {}) => {
  const route = useRoute()
  const query = ref('')
  const page = ref(1)
  const pageSize = ref(20)
  const sortBy = ref('')
  const sortDirection = ref<'asc' | 'desc' | ''>('')
  const filters = reactive<Record<string, string>>({ ...initialFilters })
  const requestQuery = computed(() => ({
    page: page.value,
    pageSize: pageSize.value,
    search: query.value.trim() || undefined,
    sortBy: sortBy.value || undefined,
    sortDirection: sortDirection.value || undefined,
    ...Object.fromEntries(Object.entries(filters).map(([key, value]) => [key, value || undefined])),
    assetId: endpoint === '/api/loans' && typeof route.query.assetId === 'string' ? route.query.assetId : undefined,
  }))
  const { data, status, error, refresh } = useFetch<ApiListResponse<T> | T[]>(endpoint, {
    query: requestQuery,
    watch: false,
  })

  const items = computed<T[]>(() => {
    if (Array.isArray(data.value)) return data.value
    return data.value?.data ?? data.value?.items ?? []
  })
  const total = computed(() => Array.isArray(data.value) ? data.value.length : (data.value?.total ?? items.value.length))
  const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))
  const firstItem = computed(() => total.value === 0 ? 0 : ((page.value - 1) * pageSize.value) + 1)
  const lastItem = computed(() => Math.min(page.value * pageSize.value, total.value))
  let searchTimer: ReturnType<typeof setTimeout> | undefined
  watch(query, () => {
    page.value = 1
    clearTimeout(searchTimer)
    searchTimer = setTimeout(() => refresh(), 300)
  })
  watch(filters, () => {
    page.value = 1
    refresh()
  }, { deep: true })
  watch(pageSize, () => {
    page.value = 1
    refresh()
  })
  watch(totalPages, (value) => {
    if (page.value > value) {
      page.value = value
      refresh()
    }
  })
  onScopeDispose(() => clearTimeout(searchTimer))
  const reload = () => refresh()
  const toggleSort = (key: string) => {
    if (sortBy.value !== key || !sortDirection.value) {
      sortBy.value = key
      sortDirection.value = 'asc'
    } else if (sortDirection.value === 'asc') {
      sortDirection.value = 'desc'
    } else {
      sortBy.value = ''
      sortDirection.value = ''
    }
    page.value = 1
    refresh()
  }
  const goToPage = (value: number) => {
    if (value < 1 || value > totalPages.value || value === page.value) return false
    page.value = value
    refresh()
    return true
  }

  return { query, filters, page, pageSize, sortBy, sortDirection, items, total, totalPages, firstItem, lastItem, status, error, reload, goToPage, toggleSort }
}
