/**
 * Servicio para gestión de WooCommerce
 */

import { wpClient } from './client'

export interface WooCommerceOrder {
  id: number
  parent_id: number
  status: string
  currency: string
  version: string
  prices_include_tax: boolean
  date_created: string
  date_modified: string
  discount_total: string
  discount_tax: string
  shipping_total: string
  shipping_tax: string
  cart_tax: string
  total: string
  total_tax: string
  customer_id: number
  order_key: string
  billing: BillingAddress
  shipping: ShippingAddress
  payment_method: string
  payment_method_title: string
  transaction_id: string
  customer_ip_address: string
  customer_user_agent: string
  created_via: string
  customer_note: string
  date_completed: string | null
  date_paid: string | null
  cart_hash: string
  number: string
  meta_data: any[]
  line_items: LineItem[]
  tax_lines: any[]
  shipping_lines: any[]
  fee_lines: any[]
  coupon_lines: any[]
  refunds: any[]
  payment_url: string
  is_editable: boolean
  needs_payment: boolean
  needs_processing: boolean
  date_created_gmt: string
  date_modified_gmt: string
  date_completed_gmt: string | null
  date_paid_gmt: string | null
  currency_symbol: string
}

export interface BillingAddress {
  first_name: string
  last_name: string
  company: string
  address_1: string
  address_2: string
  city: string
  state: string
  postcode: string
  country: string
  email: string
  phone: string
}

export interface ShippingAddress {
  first_name: string
  last_name: string
  company: string
  address_1: string
  address_2: string
  city: string
  state: string
  postcode: string
  country: string
  phone: string
}

export interface LineItem {
  id: number
  name: string
  product_id: number
  variation_id: number
  quantity: number
  tax_class: string
  subtotal: string
  subtotal_tax: string
  total: string
  total_tax: string
  taxes: any[]
  meta_data: any[]
  sku: string
  price: number
  image: {
    id: string
    src: string
  }
  parent_name: string | null
}

export interface WooCommerceProduct {
  id: number
  name: string
  slug: string
  permalink: string
  date_created: string
  date_modified: string
  type: string
  status: string
  featured: boolean
  catalog_visibility: string
  description: string
  short_description: string
  sku: string
  price: string
  regular_price: string
  sale_price: string
  on_sale: boolean
  purchasable: boolean
  total_sales: number
  virtual: boolean
  downloadable: boolean
  downloads: any[]
  download_limit: number
  download_expiry: number
  external_url: string
  button_text: string
  tax_status: string
  tax_class: string
  manage_stock: boolean
  stock_quantity: number | null
  backorders: string
  backorders_allowed: boolean
  backordered: boolean
  low_stock_amount: number | null
  sold_individually: boolean
  weight: string
  dimensions: {
    length: string
    width: string
    height: string
  }
  shipping_required: boolean
  shipping_taxable: boolean
  shipping_class: string
  shipping_class_id: number
  reviews_allowed: boolean
  average_rating: string
  rating_count: number
  upsell_ids: number[]
  cross_sell_ids: number[]
  parent_id: number
  purchase_note: string
  categories: any[]
  tags: any[]
  images: any[]
  attributes: any[]
  default_attributes: any[]
  variations: number[]
  grouped_products: number[]
  menu_order: number
  price_html: string
  related_ids: number[]
  meta_data: any[]
  stock_status: string
}

export class WooCommerceService {
  /**
   * Obtener todas las órdenes
   */
  async getOrders(params?: {
    page?: number
    per_page?: number
    search?: string
    status?: string
    customer?: number
    orderby?: string
    order?: 'asc' | 'desc'
  }): Promise<WooCommerceOrder[]> {
    return wpClient.get<WooCommerceOrder[]>('/wc/v3/orders', params)
  }

  /**
   * Obtener una orden por ID
   */
  async getOrder(orderId: number): Promise<WooCommerceOrder> {
    return wpClient.get<WooCommerceOrder>(`/wc/v3/orders/${orderId}`)
  }

  /**
   * Actualizar el estado de una orden
   */
  async updateOrderStatus(orderId: number, status: string): Promise<WooCommerceOrder> {
    return wpClient.put<WooCommerceOrder>(`/wc/v3/orders/${orderId}`, {
      status,
    })
  }

  /**
   * Aprobar/Completar una orden
   */
  async approveOrder(orderId: number): Promise<WooCommerceOrder> {
    return this.updateOrderStatus(orderId, 'completed')
  }

  /**
   * Marcar orden como procesando
   */
  async processOrder(orderId: number): Promise<WooCommerceOrder> {
    return this.updateOrderStatus(orderId, 'processing')
  }

  /**
   * Cancelar una orden
   */
  async cancelOrder(orderId: number): Promise<WooCommerceOrder> {
    return this.updateOrderStatus(orderId, 'cancelled')
  }

  /**
   * Obtener órdenes pendientes
   */
  async getPendingOrders(params?: { page?: number; per_page?: number }): Promise<WooCommerceOrder[]> {
    return this.getOrders({ status: 'pending', ...params })
  }

  /**
   * Obtener órdenes de un cliente
   */
  async getCustomerOrders(customerId: number, params?: { page?: number; per_page?: number }): Promise<WooCommerceOrder[]> {
    return this.getOrders({ customer: customerId, ...params })
  }

  /**
   * Crear una nueva orden
   */
  async createOrder(data: {
    customer_id: number
    line_items: Array<{
      product_id: number
      quantity: number
    }>
    status?: string
    payment_method?: string
    payment_method_title?: string
  }): Promise<WooCommerceOrder> {
    return wpClient.post<WooCommerceOrder>('/wc/v3/orders', data)
  }

  /**
   * Obtener todos los productos
   */
  async getProducts(params?: {
    page?: number
    per_page?: number
    search?: string
    status?: 'publish' | 'draft' | 'pending'
    category?: number
    orderby?: string
    order?: 'asc' | 'desc'
  }): Promise<WooCommerceProduct[]> {
    return wpClient.get<WooCommerceProduct[]>('/wc/v3/products', params)
  }

  /**
   * Obtener un producto por ID
   */
  async getProduct(productId: number): Promise<WooCommerceProduct> {
    return wpClient.get<WooCommerceProduct>(`/wc/v3/products/${productId}`)
  }

  /**
   * Buscar productos por nombre
   */
  async searchProducts(searchTerm: string): Promise<WooCommerceProduct[]> {
    return this.getProducts({ search: searchTerm })
  }

  /**
   * Asignar productos a un usuario (crear orden y marcar como completada)
   */
  async assignProductsToUser(
    userId: number,
    productIds: number[]
  ): Promise<WooCommerceOrder> {
    const lineItems = productIds.map(productId => ({
      product_id: productId,
      quantity: 1,
    }))

    const order = await this.createOrder({
      customer_id: userId,
      line_items: lineItems,
      status: 'completed',
      payment_method: 'manual',
      payment_method_title: 'Asignación Manual',
    })

    return order
  }

  /**
   * Obtener estadísticas de ventas
   */
  async getSalesStats(params?: {
    period?: 'week' | 'month' | 'year'
    date_min?: string
    date_max?: string
  }): Promise<any> {
    return wpClient.get('/wc/v3/reports/sales', params)
  }
}

// Instancia singleton del servicio
export const wooCommerceService = new WooCommerceService()
