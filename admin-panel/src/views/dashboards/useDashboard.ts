import { useCallback, useEffect, useState } from 'react'
import apiClient from 'src/utils/api-client'

const ALERT_STATUSES = ['pending', 'sent', 'partial', 'failed', 'logged_fallback'] as const

type AlertStatus = (typeof ALERT_STATUSES)[number]

type TrendPoint = {
  label: string
  total: number
}

type RecentAlert = {
  id: string
  status: AlertStatus | string
  fallbackUsed: boolean
  message?: string | null
  latitude: number
  longitude: number
  createdAt: string
  user?: {
    id: string
    fullName: string
    email: string
    role: string
    isActive: boolean
  } | null
}

type DashboardData = {
  totals: {
    users: number
    usersActive: number
    usersInactive: number
    medicalProfiles: number
    medicalSummaries: number
    emergencyContacts: number
    qrAccess: number
    panicAlerts: number
  }
  coverage: {
    profile: number
    summary: number
    qr: number
    contactsPerUser: number
  }
  alerts: {
    statusCounts: Record<AlertStatus, number>
    sentSuccessRate: number
    fallbackRate: number
    today: number
    last7Days: number
    trend: TrendPoint[]
  }
  recentAlerts: RecentAlert[]
}

const defaultData: DashboardData = {
  totals: {
    users: 0,
    usersActive: 0,
    usersInactive: 0,
    medicalProfiles: 0,
    medicalSummaries: 0,
    emergencyContacts: 0,
    qrAccess: 0,
    panicAlerts: 0
  },
  coverage: {
    profile: 0,
    summary: 0,
    qr: 0,
    contactsPerUser: 0
  },
  alerts: {
    statusCounts: {
      pending: 0,
      sent: 0,
      partial: 0,
      failed: 0,
      logged_fallback: 0
    },
    sentSuccessRate: 0,
    fallbackRate: 0,
    today: 0,
    last7Days: 0,
    trend: []
  },
  recentAlerts: []
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
  const date = new Date(`${isoDate}T00:00:00`)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })
}

const toPercent = (part: number, total: number) => {
  if (!total) return 0
  return Math.min(100, Math.round((part / total) * 100))
}

const toFixedNumber = (value: number, digits = 2) => {
  const parsed = Number(value || 0)
  if (!Number.isFinite(parsed)) return 0
  return Number(parsed.toFixed(digits))
}

const getTotal = async (
  endpoint: string,
  params?: Record<string, string | number | boolean | undefined>
): Promise<number> => {
  try {
    const response = await apiClient.get(endpoint, {
      params: {
        page: 0,
        limit: 1,
        ...(params || {})
      }
    })

    return Number(response?.data?.total || 0)
  } catch {
    return 0
  }
}

const getRecentAlerts = async (): Promise<RecentAlert[]> => {
  try {
    const response = await apiClient.get('v2/admin/panic-alerts', {
      params: {
        page: 0,
        limit: 8
      }
    })

    return Array.isArray(response?.data?.data) ? response.data.data : []
  } catch {
    return []
  }
}

const getUserActivity = async () => {
  const limit = 200
  let page = 0
  let total = 0
  let activeUsers = 0
  let inactiveUsers = 0
  let fetched = 0

  // Safety cap to avoid long-running loops when backend total is very large.
  while (page < 25) {
    try {
      const response = await apiClient.get('v2/user', {
        params: {
          page,
          limit
        }
      })

      const rows = Array.isArray(response?.data?.data) ? response.data.data : []
      const apiTotal = Number(response?.data?.total || 0)
      if (apiTotal > 0) {
        total = apiTotal
      }

      rows.forEach((user: any) => {
        if (user?.isActive) activeUsers += 1
        else inactiveUsers += 1
      })

      fetched += rows.length
      if (!rows.length || (total > 0 && fetched >= total)) {
        break
      }

      page += 1
    } catch {
      break
    }
  }

  return {
    total: total || fetched,
    activeUsers,
    inactiveUsers
  }
}

const useDashboard = () => {
  const [data, setData] = useState<DashboardData>(defaultData)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const loadDashboard = useCallback(async (manualRefresh = false) => {
    if (manualRefresh) {
      setIsRefreshing(true)
    } else {
      setIsLoading(true)
    }

    setError(null)

    try {
      const todayISO = toLocalISODate(new Date())
      const dates = getLastDaysISO(7)

      const [
        users,
        medicalProfiles,
        medicalSummaries,
        emergencyContacts,
        qrAccess,
        panicAlerts,
        pendingAlerts,
        sentAlerts,
        partialAlerts,
        failedAlerts,
        fallbackAlerts,
        recentAlerts,
        userActivity
      ] = await Promise.all([
        getTotal('v2/user'),
        getTotal('v2/admin/medical-profiles'),
        getTotal('v2/admin/medical-summaries'),
        getTotal('v2/admin/emergency-contacts'),
        getTotal('v2/admin/qr-access'),
        getTotal('v2/admin/panic-alerts'),
        getTotal('v2/admin/panic-alerts', { status: 'pending' }),
        getTotal('v2/admin/panic-alerts', { status: 'sent' }),
        getTotal('v2/admin/panic-alerts', { status: 'partial' }),
        getTotal('v2/admin/panic-alerts', { status: 'failed' }),
        getTotal('v2/admin/panic-alerts', { status: 'logged_fallback' }),
        getRecentAlerts(),
        getUserActivity()
      ])

      const trendCounts = await Promise.all(
        dates.map(date =>
          getTotal('v2/admin/panic-alerts', {
            fromDate: date,
            toDate: date
          })
        )
      )

      const trend = dates.map((date, index) => ({
        label: formatShortDate(date),
        total: Number(trendCounts[index] || 0)
      }))

      const last7Days = trend.reduce((sum, item) => sum + Number(item.total || 0), 0)
      const today = trend[trend.length - 1]?.total || Number(
        await getTotal('v2/admin/panic-alerts', {
          fromDate: todayISO,
          toDate: todayISO
        })
      )

      const profileCoverage = toPercent(medicalProfiles, users)
      const summaryCoverage = toPercent(medicalSummaries, users)
      const qrCoverage = toPercent(qrAccess, users)
      const contactsPerUser = toFixedNumber(users > 0 ? emergencyContacts / users : 0, 2)

      const sentSuccessRate = toPercent(sentAlerts + partialAlerts, panicAlerts)
      const fallbackRate = toPercent(fallbackAlerts, panicAlerts)

      setData({
        totals: {
          users,
          usersActive: userActivity.activeUsers,
          usersInactive: userActivity.inactiveUsers,
          medicalProfiles,
          medicalSummaries,
          emergencyContacts,
          qrAccess,
          panicAlerts
        },
        coverage: {
          profile: profileCoverage,
          summary: summaryCoverage,
          qr: qrCoverage,
          contactsPerUser
        },
        alerts: {
          statusCounts: {
            pending: pendingAlerts,
            sent: sentAlerts,
            partial: partialAlerts,
            failed: failedAlerts,
            logged_fallback: fallbackAlerts
          },
          sentSuccessRate,
          fallbackRate,
          today,
          last7Days,
          trend
        },
        recentAlerts
      })

      setLastUpdated(new Date())
    } catch {
      setError('Unable to load dashboard metrics right now.')
    } finally {
      if (manualRefresh) {
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
