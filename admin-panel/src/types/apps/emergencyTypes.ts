export type EmergencyUserType = {
  id: string
  fullName: string
  email: string
  role: string
  isActive: boolean
}

export type MedicalProfileType = {
  id: string
  user: EmergencyUserType
  bloodGroup?: string
  allergies: string[]
  chronicConditions: string[]
  medications: string[]
  pastSurgeries: string[]
  emergencyNotes?: string
  gender?: string
  dateOfBirth?: string
}

export type MedicalSummaryType = {
  id: string
  user: EmergencyUserType
  hospitalName?: string
  doctorName?: string
  treatmentDuration?: string
  treatmentStatus?: string
  currentMedications: string[]
  notes?: string
}

export type EmergencyContactType = {
  id: string
  user: EmergencyUserType
  name: string
  phoneNumber: string
  relationship?: string
  isPrimary: boolean
}

export type QrAccessType = {
  id: string
  user: EmergencyUserType
  lastGeneratedAt: string
}

export type PanicAlertDispatchType = {
  id: string
  contactName: string
  phoneNumber: string
  status: string
  providerResponse?: string
  errorMessage?: string
}

export type PanicAlertType = {
  id: string
  user: EmergencyUserType
  status: string
  latitude: number
  longitude: number
  message?: string
  fallbackUsed: boolean
  createdAt: string
  dispatches?: PanicAlertDispatchType[]
}

