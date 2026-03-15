import { PAGINATION_DEFAULT_LIMIT, PAGINATION_DEFAULT_PAGE } from "src/constants"

export const paginationDefaultPageTransformer = (obj): number => {
  const { value } = obj
  return +value >= 0 ? Number.parseInt(value) : PAGINATION_DEFAULT_PAGE
}

export const paginationDefaultLimitTransformer = (obj): number => {
  const { value } = obj
  return +value > 0 ? Number.parseInt(value) : PAGINATION_DEFAULT_LIMIT
}
