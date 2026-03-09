import { Router, Request, Response } from 'express';

const router = Router();

// ─── Mock order database ──────────────────────────────────────────────────
interface Order {
  id: string;
  customer_name: string;
  product: string;
  quantity: number;
  status: 'processing' | 'confirmed' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'returned';
  estimated_delivery: string;
  tracking_number: string | null;
  total_amount: number;
  created_at: string;
}

const ORDERS: Record<string, Order> = {
  'ORD-001': {
    id: 'ORD-001',
    customer_name: 'Rahul Sharma',
    product: 'iPhone 15 Pro Max 256GB',
    quantity: 1,
    status: 'out_for_delivery',
    estimated_delivery: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString().split('T')[0],
    tracking_number: 'DTDC1234567890',
    total_amount: 159900,
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  'ORD-002': {
    id: 'ORD-002',
    customer_name: 'Priya Patel',
    product: 'MacBook Air M3',
    quantity: 1,
    status: 'shipped',
    estimated_delivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    tracking_number: 'BLUE9876543210',
    total_amount: 114900,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  'ORD-003': {
    id: 'ORD-003',
    customer_name: 'Amit Verma',
    product: 'Sony WH-1000XM5 Headphones',
    quantity: 2,
    status: 'confirmed',
    estimated_delivery: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    tracking_number: null,
    total_amount: 59990,
    created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
  },
  'ORD-004': {
    id: 'ORD-004',
    customer_name: 'Sneha Gupta',
    product: 'Samsung 65" 4K QLED TV',
    quantity: 1,
    status: 'delivered',
    estimated_delivery: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    tracking_number: 'AMZN0011223344',
    total_amount: 89990,
    created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
  },
  'ORD-005': {
    id: 'ORD-005',
    customer_name: 'Vikram Singh',
    product: 'Nike Air Max 2024',
    quantity: 1,
    status: 'processing',
    estimated_delivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    tracking_number: null,
    total_amount: 12499,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
};

const STATUS_MESSAGES: Record<string, string> = {
  processing:       'Your order is being processed and will be confirmed shortly.',
  confirmed:        'Your order has been confirmed and is being prepared for shipment.',
  shipped:          'Your order has been shipped and is on its way to you.',
  out_for_delivery: 'Great news! Your order is out for delivery and will arrive today.',
  delivered:        'Your order has been delivered successfully. Enjoy your purchase!',
  cancelled:        'Your order has been cancelled. Refund will be processed within 5-7 business days.',
  returned:         'Your return has been initiated. Refund will be processed within 3-5 business days.',
};

// POST /order-status — get order status by order_id
router.post('/order-status', (req: Request, res: Response) => {
  const { order_id } = req.body as { order_id?: string };

  if (!order_id) {
    return res.status(400).json({ error: 'order_id is required' });
  }

  const normalized = order_id.trim().toUpperCase();
  const order = ORDERS[normalized];

  if (!order) {
    return res.status(404).json({
      error: 'Order not found',
      message: `No order found with ID ${normalized}. Please check the order ID and try again.`,
    });
  }

  return res.json({
    success: true,
    order,
    message: STATUS_MESSAGES[order.status] || 'Status unknown.',
  });
});

// GET /orders — list all demo orders (for dashboard)
router.get('/orders', (_req: Request, res: Response) => {
  return res.json(Object.values(ORDERS));
});

export default router;
