export type UserRole = 'customer' | 'retailer' | 'wholesaler' | 'staff' | 'admin'

export type Product = {
  id: number
  name: string
  description: string | null
  /** Price in paise for the requesting user's tier */
  price: number
  /** Base retail price (paise) */
  price_base?: number
  /** Retailer price override (paise, null = use price) */
  price_retailer?: number | null
  /** Wholesaler price override (paise, null = use price) */
  price_wholesaler?: number | null
  brand: 'VMS' | 'other'
  stock: number
  category_id: number | null
  category_name?: string
  image_url: string | null
  is_active: 0 | 1
  variant_group: string | null
  variant_label: string | null
  variant_type: 'size' | 'flavor' | 'color' | null
  /** Sibling variants (only present on "primary" products in listing) */
  variants?: ProductVariant[]
}

export type ProductVariant = {
  id: number
  name: string
  label: string
  price: number
  stock: number
  image_url: string | null
}

export type User = {
  id: number
  email: string | null
  phone: string | null
  name: string
  role: UserRole
  is_verified: 0 | 1
  created_at: number
}

export type Order = {
  id: number
  user_id: number
  total_paise: number
  status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  razorpay_order_id: string | null
  created_at: number
}

export type CartItem = {
  product: Product
  quantity: number
}

export type Address = {
  name: string
  phone: string
  line1: string
  line2?: string
  city: string
  state: string
  pin: string
}

export type OTP = {
  id: number
  identifier: string
  type: 'login' | 'register' | 'reset'
  expires_at: number
  used: 0 | 1
}
