import { UseQueryOptions } from '@tanstack/vue-query'

export type ExtendedQueryOptions = {
  options?: UseQueryOptions
  server?: boolean
  queryKey?: string
}