export type Role = 'superAdmin' | 'admin' | 'user' | 'readonly'
export type Lang = 'it' | 'en' | 'si'
export type RequestStatus = 'pending' | 'approved' | 'declined'
export type UserStatus = 'pending' | 'approved' | 'rejected'
export type AccessLevel = 'readonly' | 'edit'

export interface Category {
  id: string
  name_it: string
  name_en: string
  name_si: string
  icon: string
  created_at: string
}

export interface ProfileCategory {
  profile_id: string
  category_id: string
  access_level: AccessLevel
}

export interface Profile {
  id: string
  full_name: string
  username: string
  role: Role
  lang: Lang
  status: UserStatus
  created_at: string
  profile_categories?: ProfileCategory[]
}

export interface SessionUser {
  id: string
  full_name: string
  role: Role
  category_ids: string[]
  category_access: Record<string, AccessLevel>
  lang: Lang
}

export interface Product {
  id: string
  name: string
  category_id: string
  qty: number
  unit: string
  min_qty: number
  created_at: string
  created_by: string | null
  categories?: Category
}

export interface Movement {
  id: string
  product_id: string
  user_id: string
  delta: number
  qty_after: number
  note: string | null
  created_at: string
  products?: Product
  profiles?: Pick<Profile, 'id' | 'full_name'>
}

export interface Request {
  id: string
  user_id: string
  category_id: string | null
  text: string
  status: RequestStatus
  approved_by: string | null
  created_at: string
  profiles?: Pick<Profile, 'id' | 'full_name'>
  categories?: Category
}