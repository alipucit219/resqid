export enum FeedbackCategoryEnum {
  Suggestion = 'Suggestion',
  Complaint = 'Complaint',
  Request = 'Request'
}

export interface FeedbackType {
  feedback: string
  category: string
  id: number
}
