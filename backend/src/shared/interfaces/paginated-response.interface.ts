export type IPaginatedResponse<TData> = {
  total: number;
  data: TData[];
}