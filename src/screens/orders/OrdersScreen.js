import { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, ScrollView
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getOrders, getMyPurchases } from '../../lib/queries';
import useAuthStore from '../../store/authStore';

const STATUS_COLORS = {
  PENDING:          { bg: '#FEF3C7', text: '#92400E', label: '⏳ Pending' },
  CONFIRMED:        { bg: '#DBEAFE', text: '#1E40AF', label: '✓ Confirmed' },
  PROCESSING:       { bg: '#EDE9FE', text: '#5B21B6', label: '⚙️ Processing' },
  OUT_FOR_DELIVERY: { bg: '#D1FAE5', text: '#065F46', label: '🚚 Out for Delivery' },
  DELIVERED:        { bg: '#D1FAE5', text: '#065F46', label: '✅ Delivered' },
  CANCELLED:        { bg: '#FEE2E2', text: '#991B1B', label: '✗ Cancelled' },
};

function formatPrice(p) {
  return '₹' + Number(p).toLocaleString('en-IN');
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  });
}

export default function OrdersScreen({ navigation }) {
  const { isLoggedIn } = useAuthStore();
  const [tab, setTab] = useState('online');

  const { data: ordersData, isLoading: ordersLoading, refetch: refetchOrders } = useQuery({
    queryKey: ['orders'],
    queryFn:  getOrders,
    enabled:  isLoggedIn,
  });

  const { data: purchasesData, isLoading: purchasesLoading, refetch: refetchPurchases } = useQuery({
    queryKey: ['my-purchases'],
    queryFn:  getMyPurchases,
    enabled:  isLoggedIn && tab === 'offline',
  });

  const orders    = ordersData?.data    || [];
  const purchases = purchasesData?.data || [];

  if (!isLoggedIn) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyEmoji}>🔒</Text>
        <Text style={styles.emptyTitle}>Login Karo</Text>
        <Text style={styles.emptyText}>Orders dekhne ke liye login zaroori hai</Text>
        <TouchableOpacity style={styles.loginBtn} onPress={() => navigation.navigate('Auth')}>
          <Text style={styles.loginBtnText}>Login Karo →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📦 My Orders</Text>
        <TouchableOpacity onPress={() => tab === 'online' ? refetchOrders() : refetchPurchases()}>
          <Text style={styles.refreshBtn}>↻ Refresh</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        {[
          { key: 'online',  label: '🛒 Online Orders' },
          { key: 'offline', label: '🏪 Store Purchases' },
        ].map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, tab === t.key && styles.tabActive]}
            onPress={() => setTab(t.key)}
          >
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── ONLINE ORDERS ── */}
      {tab === 'online' && (
        <>
          {ordersLoading ? (
            <ActivityIndicator color="#1E40AF" style={{ marginTop: 40 }} size="large" />
          ) : orders.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>📦</Text>
              <Text style={styles.emptyTitle}>Koi Order Nahi</Text>
              <Text style={styles.emptyText}>Abhi tak koi order place nahi kiya</Text>
              <TouchableOpacity style={styles.shopBtn} onPress={() => navigation.navigate('Products')}>
                <Text style={styles.shopBtnText}>Shopping Karo →</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={orders}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const status = STATUS_COLORS[item.status] || STATUS_COLORS.PENDING;
                return (
                  <TouchableOpacity
                    style={styles.card}
                    onPress={() => navigation.navigate('OrderDetail', { id: item.id })}
                  >
                    <View style={styles.cardTop}>
                      <View>
                        <Text style={styles.orderId}>#{item.id.slice(-8).toUpperCase()}</Text>
                        <Text style={styles.orderDate}>{formatDate(item.createdAt)}</Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                        <Text style={[styles.statusText, { color: status.text }]}>{status.label}</Text>
                      </View>
                    </View>

                    <View style={styles.itemsRow}>
                      {item.items?.slice(0, 3).map((orderItem, i) => (
                        <View key={i} style={styles.itemChip}>
                          <Text style={styles.itemChipText} numberOfLines={1}>
                            {orderItem.product?.modelName || orderItem.usedPhone?.modelName || 'Item'}
                          </Text>
                          {orderItem.quantity > 1 && (
                            <Text style={styles.itemQty}>×{orderItem.quantity}</Text>
                          )}
                        </View>
                      ))}
                      {item.items?.length > 3 && (
                        <Text style={styles.moreItems}>+{item.items.length - 3} more</Text>
                      )}
                    </View>

                    <View style={styles.cardBottom}>
                      <View>
                        <Text style={styles.storeLabel}>🏪 {item.store?.storeName}</Text>
                        <Text style={styles.fulfillment}>
                          {item.fulfillmentType === 'HOME_DELIVERY' ? '🏠 Home Delivery' : '🏪 Store Pickup'}
                        </Text>
                      </View>
                      <View style={styles.amountBox}>
                        <Text style={styles.amount}>{formatPrice(item.totalAmount)}</Text>
                        <Text style={styles.viewDetail}>View →</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </>
      )}

      {/* ── STORE PURCHASES ── */}
      {tab === 'offline' && (
        <>
          {purchasesLoading ? (
            <ActivityIndicator color="#065F46" style={{ marginTop: 40 }} size="large" />
          ) : purchases.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🏪</Text>
              <Text style={styles.emptyTitle}>Koi Purchase Nahi</Text>
              <Text style={styles.emptyText}>Store se kharida hua saman yahan dikhega</Text>
            </View>
          ) : (
            <FlatList
              data={purchases}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <View style={styles.card}>
                  {/* Top Row */}
                  <View style={styles.cardTop}>
                    <View>
                      <Text style={styles.orderId}>{item.billNumber}</Text>
                      <Text style={styles.orderDate}>{formatDate(item.createdAt)}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: '#D1FAE5' }]}>
                      <Text style={[styles.statusText, { color: '#065F46' }]}>✓ Purchased</Text>
                    </View>
                  </View>

                  {/* Items */}
                  <View style={styles.itemsRow}>
                    {item.items?.map((i, idx) => (
                      <View key={idx} style={styles.itemChip}>
                        <Text style={styles.itemChipText} numberOfLines={1}>
                          {i.name} ×{i.qty}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* Bottom Row */}
                  <View style={styles.cardBottom}>
                    <View>
                      <Text style={styles.storeLabel}>🏪 {item.store?.storeName}</Text>
                      <Text style={styles.fulfillment}>{item.paymentMode}</Text>
                    </View>
                    <View style={styles.amountBox}>
                      <Text style={styles.amount}>{formatPrice(item.totalAmount)}</Text>
                      {item.billImage && (
                        <Text style={styles.viewDetail}>📎 Bill</Text>
                      )}
                    </View>
                  </View>
                </View>
              )}
            />
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#F9FAFB' },
  header:       { backgroundColor: '#1E40AF', paddingTop: 50, paddingBottom: 14, paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  headerTitle:  { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  refreshBtn:   { color: '#93C5FD', fontSize: 14, fontWeight: '600' },

  tabsRow:      { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  tab:          { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive:    { borderBottomWidth: 2, borderBottomColor: '#1E40AF' },
  tabText:      { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  tabTextActive:{ color: '#1E40AF', fontWeight: '700' },

  list:         { padding: 16 },
  card:         { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  cardTop:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  orderId:      { fontSize: 15, fontWeight: 'bold', color: '#1F2937' },
  orderDate:    { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  statusBadge:  { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText:   { fontSize: 12, fontWeight: 'bold' },

  itemsRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  itemChip:     { flexDirection: 'row', backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignItems: 'center', gap: 4, maxWidth: 140 },
  itemChipText: { fontSize: 11, color: '#374151', flex: 1 },
  itemQty:      { fontSize: 11, color: '#6B7280', fontWeight: '600' },
  moreItems:    { fontSize: 11, color: '#6B7280', alignSelf: 'center' },

  cardBottom:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 10 },
  storeLabel:   { fontSize: 12, color: '#374151', fontWeight: '500' },
  fulfillment:  { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  amountBox:    { alignItems: 'flex-end' },
  amount:       { fontSize: 16, fontWeight: 'bold', color: '#1F2937' },
  viewDetail:   { fontSize: 12, color: '#1E40AF', fontWeight: '600', marginTop: 2 },

  empty:        { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F9FAFB' },
  emptyEmoji:   { fontSize: 64, marginBottom: 16 },
  emptyTitle:   { fontSize: 22, fontWeight: 'bold', color: '#1F2937', marginBottom: 8 },
  emptyText:    { fontSize: 14, color: '#6B7280', marginBottom: 24, textAlign: 'center' },
  loginBtn:     { backgroundColor: '#1E40AF', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  loginBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  shopBtn:      { backgroundColor: '#1E40AF', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  shopBtnText:  { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});