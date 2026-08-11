// ============================================================
// M ONE ERP — Supabase Database Types
// ============================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          role: 'admin' | 'driver' | 'viewer'
          location_id: string | null
          phone: string | null
          avatar_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          role?: 'admin' | 'driver' | 'viewer'
          location_id?: string | null
          phone?: string | null
          avatar_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          full_name?: string
          role?: 'admin' | 'driver' | 'viewer'
          location_id?: string | null
          phone?: string | null
          avatar_url?: string | null
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      locations: {
        Row: {
          id: string
          name: string
          type: 'depot' | 'vehicle'
          description: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          type: 'depot' | 'vehicle'
          description?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          name?: string
          type?: 'depot' | 'vehicle'
          description?: string | null
          is_active?: boolean
        }
        Relationships: []
      }
      categories: {
        Row: {
          id: string
          name: string
          description: string | null
          color: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          color?: string
          created_at?: string
        }
        Update: {
          name?: string
          description?: string | null
          color?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          id: string
          sku: string
          name: string
          description: string | null
          category_id: string | null
          unit: string
          purchase_price: number
          selling_price: number
          min_stock: number
          barcode: string | null
          image_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          sku: string
          name: string
          description?: string | null
          category_id?: string | null
          unit?: string
          purchase_price?: number
          selling_price?: number
          min_stock?: number
          barcode?: string | null
          image_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          sku?: string
          name?: string
          description?: string | null
          category_id?: string | null
          unit?: string
          purchase_price?: number
          selling_price?: number
          min_stock?: number
          barcode?: string | null
          image_url?: string | null
          is_active?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'products_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'categories'
            referencedColumns: ['id']
          }
        ]
      }
      stock_items: {
        Row: {
          id: string
          product_id: string
          location_id: string
          quantity: number
          min_stock: number | null
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          location_id: string
          quantity?: number
          min_stock?: number | null
          updated_at?: string
        }
        Update: {
          quantity?: number
          min_stock?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      stock_ledger: {
        Row: {
          id: string
          product_id: string
          location_id: string
          entry_type: 'transfer_in' | 'transfer_out' | 'sale' | 'purchase' | 'adjustment' | 'return'
          quantity: number
          balance_after: number
          reference_id: string | null
          reference_type: 'transfer' | 'sale' | 'purchase' | 'adjustment' | null
          unit_price: number | null
          notes: string | null
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          location_id: string
          entry_type: 'transfer_in' | 'transfer_out' | 'sale' | 'purchase' | 'adjustment' | 'return'
          quantity: number
          balance_after: number
          reference_id?: string | null
          reference_type?: 'transfer' | 'sale' | 'purchase' | 'adjustment' | null
          unit_price?: number | null
          notes?: string | null
          user_id: string
          created_at?: string
        }
        Update: {
          notes?: string | null
        }
        Relationships: []
      }
      stock_transfers: {
        Row: {
          id: string
          transfer_number: string
          from_location_id: string
          to_location_id: string
          status: 'draft' | 'confirmed' | 'cancelled'
          notes: string | null
          user_id: string
          confirmed_at: string | null
          cancelled_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          transfer_number?: string
          from_location_id: string
          to_location_id: string
          status?: 'draft' | 'confirmed' | 'cancelled'
          notes?: string | null
          user_id: string
          confirmed_at?: string | null
          cancelled_at?: string | null
          created_at?: string
        }
        Update: {
          status?: 'draft' | 'confirmed' | 'cancelled'
          notes?: string | null
          confirmed_at?: string | null
          cancelled_at?: string | null
        }
        Relationships: []
      }
      stock_transfer_items: {
        Row: {
          id: string
          stock_transfer_id: string
          product_id: string
          quantity: number
        }
        Insert: {
          id?: string
          stock_transfer_id: string
          product_id: string
          quantity: number
        }
        Update: {
          quantity?: number
        }
        Relationships: []
      }
      customers: {
        Row: {
          id: string
          company_name: string
          contact_person: string | null
          email: string | null
          phone: string | null
          address: string | null
          city: string | null
          postal_code: string | null
          customer_type: 'regular' | 'premium' | 'wholesale'
          discount_pct: number
          notes: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_name: string
          contact_person?: string | null
          email?: string | null
          phone?: string | null
          address?: string | null
          city?: string | null
          postal_code?: string | null
          customer_type?: 'regular' | 'premium' | 'wholesale'
          discount_pct?: number
          notes?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          company_name?: string
          contact_person?: string | null
          email?: string | null
          phone?: string | null
          address?: string | null
          city?: string | null
          postal_code?: string | null
          customer_type?: 'regular' | 'premium' | 'wholesale'
          discount_pct?: number
          notes?: string | null
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      sales_orders: {
        Row: {
          id: string
          order_number: string
          customer_id: string | null
          location_id: string
          user_id: string
          status: 'draft' | 'confirmed' | 'delivered' | 'invoiced' | 'cancelled'
          payment_method: 'cash' | 'invoice' | 'card' | 'transfer' | null
          payment_status: 'pending' | 'paid' | 'partial' | 'overdue'
          subtotal: number
          discount_amount: number
          tax_rate: number
          tax_amount: number
          total_amount: number
          notes: string | null
          delivery_address: string | null
          due_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_number?: string
          customer_id?: string | null
          location_id: string
          user_id: string
          status?: 'draft' | 'confirmed' | 'delivered' | 'invoiced' | 'cancelled'
          payment_method?: 'cash' | 'invoice' | 'card' | 'transfer' | null
          payment_status?: 'pending' | 'paid' | 'partial' | 'overdue'
          subtotal?: number
          discount_amount?: number
          tax_rate?: number
          tax_amount?: number
          total_amount?: number
          notes?: string | null
          delivery_address?: string | null
          due_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          customer_id?: string | null
          location_id?: string
          status?: 'draft' | 'confirmed' | 'delivered' | 'invoiced' | 'cancelled'
          payment_method?: 'cash' | 'invoice' | 'card' | 'transfer' | null
          payment_status?: 'pending' | 'paid' | 'partial' | 'overdue'
          subtotal?: number
          discount_amount?: number
          tax_rate?: number
          tax_amount?: number
          total_amount?: number
          notes?: string | null
          delivery_address?: string | null
          due_date?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      sales_order_items: {
        Row: {
          id: string
          sales_order_id: string
          product_id: string
          quantity: number
          unit_price: number
          discount_pct: number
          total_price: number
        }
        Insert: {
          id?: string
          sales_order_id: string
          product_id: string
          quantity: number
          unit_price: number
          discount_pct?: number
          total_price: number
        }
        Update: {
          quantity?: number
          unit_price?: number
          discount_pct?: number
          total_price?: number
        }
        Relationships: []
      }
      customer_logs: {
        Row: {
          id: string
          customer_id: string
          action_type: 'sale' | 'note' | 'delivery' | 'payment' | 'contact' | 'complaint' | 'discount'
          description: string
          reference_id: string | null
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          action_type: 'sale' | 'note' | 'delivery' | 'payment' | 'contact' | 'complaint' | 'discount'
          description: string
          reference_id?: string | null
          user_id: string
          created_at?: string
        }
        Update: {
          description?: string
        }
        Relationships: []
      }
    }
    Views: {
      v_product_sales_summary: {
        Row: {
          product_id: string | null
          product_name: string | null
          sku: string | null
          category: string | null
          purchase_price: number | null
          selling_price: number | null
          order_count: number | null
          total_qty_sold: number | null
          total_revenue: number | null
          total_profit: number | null
          profit_margin_pct: number | null
        }
        Relationships: []
      }
      v_customer_summary: {
        Row: {
          customer_id: string | null
          company_name: string | null
          contact_person: string | null
          phone: string | null
          city: string | null
          customer_type: string | null
          discount_pct: number | null
          total_orders: number | null
          total_revenue: number | null
          last_order_date: string | null
          days_since_last_order: number | null
          open_amount: number | null
        }
        Relationships: []
      }
      v_stock_alerts: {
        Row: {
          location_id: string | null
          location_name: string | null
          location_type: string | null
          product_id: string | null
          product_name: string | null
          sku: string | null
          unit: string | null
          current_stock: number | null
          threshold: number | null
          stock_status: string | null
        }
        Relationships: []
      }
      v_location_performance: {
        Row: {
          location_id: string | null
          location_name: string | null
          type: string | null
          total_orders: number | null
          total_revenue: number | null
          unique_customers: number | null
          total_transfers_received: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      confirm_stock_transfer: {
        Args: { p_transfer_id: string; p_user_id: string }
        Returns: Json
      }
      confirm_sales_order: {
        Args: { p_order_id: string; p_user_id: string }
        Returns: Json
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      get_my_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      user_role: 'admin' | 'driver' | 'viewer'
      location_type: 'depot' | 'vehicle'
      order_status: 'draft' | 'confirmed' | 'delivered' | 'invoiced' | 'cancelled'
      payment_status: 'pending' | 'paid' | 'partial' | 'overdue'
      stock_entry_type: 'transfer_in' | 'transfer_out' | 'sale' | 'purchase' | 'adjustment' | 'return'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, 'public'>]

// Convenience-Typen
export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        Database[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      Database[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

// Entitäts-Typen (Shorthand)
export type Profile          = Tables<'profiles'>
export type Location         = Tables<'locations'>
export type Category         = Tables<'categories'>
export type Product          = Tables<'products'>
export type StockItem        = Tables<'stock_items'>
export type StockLedger      = Tables<'stock_ledger'>
export type StockTransfer    = Tables<'stock_transfers'>
export type StockTransferItem = Tables<'stock_transfer_items'>
export type Customer         = Tables<'customers'>
export type SalesOrder       = Tables<'sales_orders'>
export type SalesOrderItem   = Tables<'sales_order_items'>
export type CustomerLog      = Tables<'customer_logs'>

// View-Typen
export type ProductSalesSummary = Tables<'v_product_sales_summary'>
export type CustomerSummary     = Tables<'v_customer_summary'>
export type StockAlert          = Tables<'v_stock_alerts'>
export type LocationPerformance = Tables<'v_location_performance'>
