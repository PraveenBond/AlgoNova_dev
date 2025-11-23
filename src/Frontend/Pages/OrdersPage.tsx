import { useState, useEffect } from 'react'
import api from '../services/api'
import './OrdersPage.css'

interface Order {
  id: number
  order_id: string | null
  instrument_token: string
  transaction_type: string
  order_type: string
  quantity: number
  price: number | null
  status: string
  filled_quantity: number
  average_price: number | null
  placed_at: string
}

const OrdersPage = () => {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const response = await api.get<Order[]>('/api/orders/history')
      setOrders(response.data)
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="orders-page">Loading...</div>
  }

  return (
    <div className="orders-page">
      <h1>Orders</h1>
      <div className="orders-table-container">
        <table className="orders-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Instrument</th>
              <th>Type</th>
              <th>Side</th>
              <th>Quantity</th>
              <th>Price</th>
              <th>Status</th>
              <th>Filled</th>
              <th>Placed At</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={9} className="no-orders">No orders found</td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id}>
                  <td>{order.order_id || '-'}</td>
                  <td>{order.instrument_token}</td>
                  <td>{order.order_type}</td>
                  <td>{order.transaction_type}</td>
                  <td>{order.quantity}</td>
                  <td>{order.price || 'Market'}</td>
                  <td>
                    <span className={`status-badge status-${order.status.toLowerCase()}`}>
                      {order.status}
                    </span>
                  </td>
                  <td>{order.filled_quantity}</td>
                  <td>{new Date(order.placed_at).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default OrdersPage

