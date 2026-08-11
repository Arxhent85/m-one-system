import { z } from 'zod'

// ============================================================
// API RESPONSE FORMAT (aus ALLSKILL patterns.md)
// ============================================================
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  meta?: {
    total: number
    page: number
    limit: number
  }
}

// ============================================================
// ZOD SCHEMAS — Validierung für alle Mutations
// ============================================================

export const createProductSchema = z.object({
  sku:            z.string().min(1, 'SKU ist erforderlich').max(50),
  name:           z.string().min(1, 'Name ist erforderlich').max(200),
  description:    z.string().max(1000).optional(),
  category_id:    z.string().uuid().optional(),
  unit:           z.string().min(1).max(20),
  purchase_price: z.number().min(0, 'Einkaufspreis muss ≥ 0 sein'),
  selling_price:  z.number().min(0, 'Verkaufspreis muss ≥ 0 sein'),
  min_stock:      z.number().int().min(0),
  barcode:        z.string().max(50).optional(),
})

export const updateProductSchema = createProductSchema.partial().omit({ sku: true })

export const createCustomerSchema = z.object({
  company_name:   z.string().min(1, 'Firmenname ist erforderlich').max(200),
  contact_person: z.string().max(100).optional(),
  email:          z.string().email().optional().or(z.literal('')),
  phone:          z.string().max(30).optional(),
  address:        z.string().max(300).optional(),
  city:           z.string().max(100).optional(),
  postal_code:    z.string().max(10).optional(),
  customer_type:  z.enum(['regular', 'premium', 'wholesale']),
  discount_pct:   z.number().min(0).max(100),
  notes:          z.string().max(1000).optional(),
})

export const createTransferSchema = z.object({
  from_location_id: z.string().uuid('Quell-Standort ist erforderlich'),
  to_location_id:   z.string().uuid('Ziel-Standort ist erforderlich'),
  notes:            z.string().max(500).optional(),
  items: z.array(z.object({
    product_id: z.string().uuid(),
    quantity:   z.number().positive('Menge muss > 0 sein'),
  })).min(1, 'Mindestens eine Position erforderlich'),
}).refine(
  (data) => data.from_location_id !== data.to_location_id,
  { message: 'Quell- und Ziel-Standort müssen unterschiedlich sein', path: ['to_location_id'] }
)

export const createSalesOrderSchema = z.object({
  customer_id:      z.string().uuid().optional(),
  location_id:      z.string().uuid('Standort ist erforderlich'),
  payment_method:   z.enum(['cash', 'invoice', 'card', 'transfer']).optional(),
  notes:            z.string().max(500).optional(),
  delivery_address: z.string().max(300).optional(),
  due_date:         z.string().optional(),
  tax_rate:         z.number().min(0).max(100).default(0),
  items: z.array(z.object({
    product_id:  z.string().uuid(),
    quantity:    z.number().positive('Menge muss > 0 sein'),
    unit_price:  z.number().min(0, 'Preis muss ≥ 0 sein'),
    discount_pct: z.number().min(0).max(100).default(0),
  })).min(1, 'Mindestens eine Position erforderlich'),
})

export const addCustomerLogSchema = z.object({
  customer_id: z.string().uuid(),
  action_type: z.enum(['sale', 'note', 'delivery', 'payment', 'contact', 'complaint', 'discount']),
  description: z.string().min(1).max(1000),
  reference_id: z.string().uuid().optional(),
})

// ============================================================
// INFERRED TYPES AUS ZOD SCHEMAS
// ============================================================
export type CreateProductInput  = z.infer<typeof createProductSchema>
export type UpdateProductInput  = z.infer<typeof updateProductSchema>
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>
export type CreateTransferInput = z.infer<typeof createTransferSchema>
export type CreateSalesOrderInput = z.infer<typeof createSalesOrderSchema>
export type AddCustomerLogInput = z.infer<typeof addCustomerLogSchema>

// ============================================================
// FILTER & PAGINATION TYPEN
// ============================================================
export interface PaginationParams {
  page: number
  limit: number
}

export interface ProductFilters {
  search?: string
  category_id?: string
  is_active?: boolean
}

export interface CustomerFilters {
  search?: string
  customer_type?: 'regular' | 'premium' | 'wholesale'
  is_active?: boolean
}

export interface OrderFilters {
  status?: 'draft' | 'confirmed' | 'delivered' | 'invoiced' | 'cancelled'
  location_id?: string
  customer_id?: string
  date_from?: string
  date_to?: string
}

export type DateRange = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom'
