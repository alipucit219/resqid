import { ProjectType } from './projectTypes'
import { StaffType } from './userTypes'

export interface DataParams {
  type: string
  limit: number
  page: number
  title?: string
  platform?: string
}
export interface AllowPermissionDataParams {
  id: number
  type: string
  payload: number[]
}
export interface AllowPortfolioPermissionDataParams {
  id: number
  payload: number[]
}

export enum MarketingEnum {
  Emails = 'Emails',
  Freelance = 'Freelance',
  Social = 'Social',
  UIUX = 'UIUX',
  Technologies = 'Technologies',
  BDTemplates = 'BDTemplates',
  Others = 'Others',
  Portfolio = 'Portfolio'
}
interface CommonAttributeType {
  id: number
  url: string
  username: string
  email: string
  password: string
  allowedTo: StaffType[]
}

export interface EmailType extends CommonAttributeType {
  title: string
}

export interface PortfolioType extends CommonAttributeType {
  id: number
  category: string
  androidUrl: string
  demoUrl: string
  iosUrl: string
  webUrl: string
  adminUrl: string
  postmanUrl: string
  docUrl: string
  contractUrl: string
  description: string
  location: string
  projectId: number
  technologiesId: string
}

export interface FreelanceAndSocialType extends CommonAttributeType {
  platform: string
  note: string
}

export interface UIUXType {
  id: number
  title: string
  platform: string
  designedBy: StaffType
  sourceUrl: string
  behanceUrl: string
}

export type TechnologyType = Pick<EmailType, 'title' | 'id'> & Pick<OtherType, 'description'>
export interface BDTemplateType extends Pick<EmailType, 'title' | 'id'> {
  bdTemplatePostedBy: StaffType
  technology: string
  bdTemplateType: string
  description: string
}
export interface OtherType extends Pick<EmailType, 'title' | 'url' | 'allowedTo' | 'id'> {
  postedBy: StaffType
  description: string
}

export interface PortfolioType extends Pick<CommonAttributeType, 'email' | 'password' | 'allowedTo'> {
  id: number
  category: string
  androidUrl: string
  demoUrl: string
  iosUrl: string
  webUrl: string
  adminUrl: string
  postmanUrl: string
  docUrl: string
  contractUrl: string
  description: string
  deploymentEnvironment: string
  project: ProjectType
  technologies: { id: number; title: string }[]
}
