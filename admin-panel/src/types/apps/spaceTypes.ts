export type Status = {
  name: string
  color: string
  type: 'Active Statuses' | 'Done Statuses' | 'Not Started Statuses'
}

export interface View {
  id: number
  createdAt?: string
  name: string
  icon?: string
  isAlwaysRequired: boolean
}

export interface Directory {
  id: number
  createdAt?: string
  name: string
  icon: string
  subDirectories: Directory[]
}
export interface Space {
  id: number
  createdAt?: string
  name: string
  description: string
  logo: string
  isPublic: boolean
  statuses: Status[]
  sharedWith?: any
  views: View[]
  directories: Directory[]
}
