/** Single source of truth for order/status colours, icons and labels. */

export type OrderStatus = 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled'

export const STATUS_CONFIG: Record<string, { color: string; icon: string; label: string }> = {
  pending: { color: '#f59e0b', icon: 'schedule', label: 'Pending' },
  paid: { color: '#00c2ff', icon: 'payments', label: 'Paid' },
  processing: { color: '#7c3aed', icon: 'inventory_2', label: 'Processing' },
  shipped: { color: '#38bdf8', icon: 'local_shipping', label: 'Shipped' },
  delivered: { color: '#00e5a0', icon: 'check_circle', label: 'Delivered' },
  cancelled: { color: '#ef4444', icon: 'cancel', label: 'Cancelled' },
}

export const PIPELINE = ['pending', 'paid', 'processing', 'shipped', 'delivered'] as const

export function statusColor(status: string) {
  return STATUS_CONFIG[status]?.color ?? '#8fafc7'
}
