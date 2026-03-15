import { useCallback, useEffect, useState } from 'react'
import { getPosDayEndTokenReport } from 'src/services/pos-token.service'
import { getPosDayEndOrderReport, getPosOrderDashboardStats } from 'src/services/pos-order.service'
import apiClient from 'src/utils/api-client'

type DashboardTrendPoint = {
  label: string
  sales: number
  orders: number
}

type StaffSale = {
  staffId: number
  staffName: string
  tokens: number
  quantity: number
  sales: number
}

type RecentOrder = {
  id: number
  customerName: string
  generatedByStaff?: { id: number; fullName: string }
  totalItems: number
  totalQuantity: number
  totalAmount: number
  isFinalized: boolean
  createdAt: string
}

type HotItemMetric = {
  name: string
  dishName: string
  variantName?: string | null
  totalQuantity: number
  totalSales: number
  lines: number
}

type DashboardData = {
  orders: {
    total: number
    finalized: number
    draft: number
  }
  today: {
    tokens: number
    quantity: number
    sales: number
    byStaff: StaffSale[]
  }
  menu: {
    categories: number
    subcategories: number
    dishes: number
    deals: number
  }
  floor: {
    halls: number
    rooms: number
    tables: number
    seats: number
  }
  team: {
    activeUsers: number
    inactiveUsers: number
    totalUsers: number
    staff: number
    loginSessions: number
  }
  insights: {
    todaySales: number
    todayFinalizedOrders: number
    hotItemToday: HotItemMetric | null
    hotItemWeek: HotItemMetric | null
    hotItemMonth: HotItemMetric | null
  }
  recentOrders: RecentOrder[]
  trend: DashboardTrendPoint[]
}

const defaultDashboardData: DashboardData = {
  orders: {
    total: 0,
    finalized: 0,
    draft: 0
  },
  today: {
    tokens: 0,
    quantity: 0,
    sales: 0,
    byStaff: []
  },
  menu: {
    categories: 0,
    subcategories: 0,
    dishes: 0,
    deals: 0
  },
  floor: {
    halls: 0,
    rooms: 0,
    tables: 0,
    seats: 0
  },
  team: {
    activeUsers: 0,
    inactiveUsers: 0,
    totalUsers: 0,
    staff: 0,
    loginSessions: 0
  },
  insights: {
    todaySales: 0,
    todayFinalizedOrders: 0,
    hotItemToday: null,
    hotItemWeek: null,
    hotItemMonth: null
  },
  recentOrders: [],
  trend: []
}

type DayEndReport = {
  date?: string
  totalTokens: number
  totalQuantity: number
  totalSales: number
  byStaff: StaffSale[]
}

type DayEndOrderReport = {
  date?: string
  totalOrders: number
  finalizedOrders: number
  draftOrders: number
  totalQuantity: number
  totalSales: number
}

type OrderDashboardStats = {
  todaySales?: number
  todayFinalizedOrders?: number
  hotItemToday?: HotItemMetric | null
  hotItemWeek?: HotItemMetric | null
  hotItemMonth?: HotItemMetric | null
}

const defaultDayEndReport: DayEndReport = {
  totalTokens: 0,
  totalQuantity: 0,
  totalSales: 0,
  byStaff: []
}

const defaultDayEndOrderReport: DayEndOrderReport = {
  totalOrders: 0,
  finalizedOrders: 0,
  draftOrders: 0,
  totalQuantity: 0,
  totalSales: 0
}

const defaultOrderDashboardStats: OrderDashboardStats = {
  todaySales: 0,
  todayFinalizedOrders: 0,
  hotItemToday: null,
  hotItemWeek: null,
  hotItemMonth: null
}

const toLocalISODate = (date: Date) => {
  const timezoneOffsetMs = date.getTimezoneOffset() * 60 * 1000
  return new Date(date.getTime() - timezoneOffsetMs).toISOString().slice(0, 10)
}

const getLastDaysISO = (days: number) => {
  const dates: string[] = []
  for (let index = days - 1; index >= 0; index -= 1) {
    const date = new Date()
    date.setDate(date.getDate() - index)
    dates.push(toLocalISODate(date))
  }
  return dates
}

const formatShortDate = (isoDate: string) => {
  const date = new Date(isoDate)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const safeNumber = async (request: () => Promise<number>, fallback = 0) => {
  try {
    const value = await request()
    const numericValue = Number(value)
    return Number.isFinite(numericValue) ? numericValue : fallback
  } catch (error) {
    return fallback
  }
}

const safeObject = async <T>(request: () => Promise<T>, fallback: T) => {
  try {
    return await request()
  } catch (error) {
    return fallback
  }
}

const getPaginatedTotal = async (
  endpoint: string,
  params?: Record<string, string | number | boolean>
) => {
  const response = await apiClient.get(endpoint, {
    params: {
      page: 0,
      limit: 1,
      ...(params || {})
    }
  })

  return Number(response?.data?.total || 0)
}

const useDashboard = () => {
  const [data, setData] = useState<DashboardData>(defaultDashboardData)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const loadDashboard = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true)
    } else {
      setIsLoading(true)
    }

    setError(null)

    try {
      const [ordersTotal, finalizedOrders, draftOrders] = await Promise.all([
        safeNumber(() => getPaginatedTotal('v2/pos/order')),
        safeNumber(() => getPaginatedTotal('v2/pos/order', { isFinalized: true })),
        safeNumber(() => getPaginatedTotal('v2/pos/order', { isFinalized: false }))
      ])

      const [categoriesTotal, subcategoriesTotal, dishesTotal, dealsTotal] = await Promise.all([
        safeNumber(() => getPaginatedTotal('v2/pos/category')),
        safeNumber(() => getPaginatedTotal('v2/pos/subcategory')),
        safeNumber(() => getPaginatedTotal('v2/pos/product')),
        safeNumber(() => getPaginatedTotal('v2/pos/deal'))
      ])

      const [hallsTotal, roomsTotal, tablesTotal, seatsTotal] = await Promise.all([
        safeNumber(() => getPaginatedTotal('v2/pos/hall')),
        safeNumber(() => getPaginatedTotal('v2/pos/room')),
        safeNumber(() => getPaginatedTotal('v2/pos/table')),
        safeNumber(() => getPaginatedTotal('v2/pos/seat'))
      ])

      const [todayReport, userStats, recentOrdersResponse, dashboardStats] = await Promise.all([
        safeObject(() => getPosDayEndTokenReport(), defaultDayEndReport),
        safeObject(
          async () => {
            const response = await apiClient.get('v2/user/dashboard/stats')
            return response.data as {
              activeUsersCount?: number
              inActiveUsersCount?: number
              staffCount?: number
              loginSessionsCount?: number
            }
          },
          {
            activeUsersCount: 0,
            inActiveUsersCount: 0,
            staffCount: 0,
            loginSessionsCount: 0
          }
        ),
        safeObject(
          async () => {
            const response = await apiClient.get('v2/pos/order', {
              params: {
                page: 0,
                limit: 8
              }
            })
            return response.data as { data?: RecentOrder[] }
          },
          { data: [] }
        ),
        safeObject(() => getPosOrderDashboardStats(), defaultOrderDashboardStats)
      ])

      const trendDates = getLastDaysISO(7)
      const trendReports = await Promise.all(
        trendDates.map(date => safeObject(() => getPosDayEndOrderReport(date), defaultDayEndOrderReport))
      )

      const trend: DashboardTrendPoint[] = trendDates.map((date, index) => ({
        label: formatShortDate(date),
        sales: Number(trendReports[index]?.totalSales || 0),
        orders: Number(trendReports[index]?.totalOrders || 0)
      }))

      const activeUsers = Number(userStats?.activeUsersCount || 0)
      const inactiveUsers = Number(userStats?.inActiveUsersCount || 0)
      const staff = Number(userStats?.staffCount || 0)
      const loginSessions = Number(userStats?.loginSessionsCount || 0)

      setData({
        orders: {
          total: ordersTotal,
          finalized: finalizedOrders,
          draft: draftOrders
        },
        today: {
          tokens: Number(todayReport?.totalTokens || 0),
          quantity: Number(todayReport?.totalQuantity || 0),
          sales: Number(todayReport?.totalSales || 0),
          byStaff: Array.isArray(todayReport?.byStaff) ? todayReport.byStaff : []
        },
        menu: {
          categories: categoriesTotal,
          subcategories: subcategoriesTotal,
          dishes: dishesTotal,
          deals: dealsTotal
        },
        floor: {
          halls: hallsTotal,
          rooms: roomsTotal,
          tables: tablesTotal,
          seats: seatsTotal
        },
        team: {
          activeUsers: activeUsers,
          inactiveUsers: inactiveUsers,
          totalUsers: activeUsers + inactiveUsers,
          staff,
          loginSessions
        },
        insights: {
          todaySales: Number(dashboardStats?.todaySales || 0),
          todayFinalizedOrders: Number(dashboardStats?.todayFinalizedOrders || 0),
          hotItemToday: dashboardStats?.hotItemToday || null,
          hotItemWeek: dashboardStats?.hotItemWeek || null,
          hotItemMonth: dashboardStats?.hotItemMonth || null
        },
        recentOrders: Array.isArray(recentOrdersResponse?.data) ? recentOrdersResponse.data : [],
        trend
      })
      setLastUpdated(new Date())
    } catch (loadError) {
      setError('Unable to load dashboard metrics right now.')
    } finally {
      if (isManualRefresh) {
        setIsRefreshing(false)
      } else {
        setIsLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  return {
    data,
    error,
    isLoading,
    isRefreshing,
    lastUpdated,
    reload: () => loadDashboard(true)
  }
}

export default useDashboard
