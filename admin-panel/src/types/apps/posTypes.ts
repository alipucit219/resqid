export type PosCategoryType = {
  id: number
  name: string
  imageUrl?: string
  isActive?: boolean
}

export type PosSubcategoryType = {
  id: number
  name: string
  imageUrl?: string
  isActive?: boolean
  category?: PosCategoryType
}

export type PosProductVariantType = {
  id?: number
  name: string
  price: number
  isActive?: boolean
}

export type PosProductType = {
  id: number
  name: string
  recipe?: string
  price?: number
  imageUrl?: string
  isActive?: boolean
  category?: PosCategoryType
  subcategory?: PosSubcategoryType
  variants?: PosProductVariantType[]
}

export type PosDealType = {
  id: number
  name: string
  price: number
  imageUrl?: string
  description?: string
  isActive?: boolean
  items?: Array<{
    id?: number
    quantity: number
    dish?: PosProductType
    variant?: PosProductVariantType
  }>
}
