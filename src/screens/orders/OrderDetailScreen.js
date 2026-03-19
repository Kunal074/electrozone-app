import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getOrder } from '../../lib/queries';
import api from '../../lib/api';

const STATUS_STEPS = [
  { key: 'PENDING',          label: 'Order Placed',    emoji: '📝' },
  { key: 'CONFIRMED',        label: 'Confirmed',        emoji: '✓' },
  { key: 'PROCESSING',       label: 'Processing',       emoji: '⚙️' },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', emoji: '🚚' },
  { key: 'DELIVERED',        label: 'Delivered',        emoji: '✅' },
];

const STATUS_COLORS = {
  PENDING:          { bg: '#FEF3C7', text: '#92400E' },
  CONFIRMED:        { bg: '#DBEAFE', text: '#1E40AF' },
  PROCESSING:       { bg: '#EDE9FE', text: '#5B21B6' },
  OUT_FOR_DELIVERY: { bg: '#D1FAE5', text: '#065F46' },
  DELIVERED:        { bg: '#D1FAE5', text: '#065F46' },
  CANCELLED:        { bg: '#FEE2E2', text: '#991B1B' },
};

function formatPrice(p) {
  return '₹' + Number(p).toLocaleString('en-IN');
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

export default function OrderDetailScreen({ navigation, route }) {
  const { id } = route.params;
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn:  () => getOrder(id),
  });

  const { mutate: cancelOrder, isLoading: cancelling } = useMutation({
    mutationFn: () => api.put(`/orders/${id}/cancel`),
    onSuccess: () => {
      queryClient.invalidateQueries(['order', id]);
      queryClient.invalidateQueries(['orders']);
      Alert.alert('✓ Cancelled', 'Order cancel ho gaya');
    },
    onError: (err) => {
      Alert.alert('Error', err.response?.data?.message || 'Cancel nahi hua');
    },
  });

  const handleCancel = () => {
    Alert.alert('Order Cancel Karo?', 'Kya aap sure hain?', [
      { text: 'Nahi', style: 'cancel' },
      { text: 'Haan Cancel Karo', style: 'destructive', onPress: () => cancelOrder() },
    ]);
  };

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#1E40AF" />
      </View>
    );
  }

  const order = data?.data;
  if (!order) {
    return (
      <View style={styles.loading}>
        <Text>Order nahi mila</Text>
      </View>
    );
  }

  const statusColor = STATUS_COLORS[order.status] || STATUS_COLORS.PENDING;
  const currentStep = STATUS_STEPS.findIndex(s => s.key === order.status);
  const isCancelled = order.status === 'CANCELLED';

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Detail</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
            <Text style={[styles.statusText, { color: statusColor.text }]}>
              {order.status.replace(/_/g, ' ')}
            </Text>
          </View>
        </View>

        {/* Order ID & Date */}
        <View style={styles.section}>
          <View style={styles.orderMeta}>
            <View>
              <Text style={styles.orderIdLabel}>Order ID</Text>
              <Text style={styles.orderId}>#{order.id.slice(-8).toUpperCase()}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.orderIdLabel}>Placed On</Text>
              <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
            </View>
          </View>
        </View>

        {/* Status Timeline */}
        {!isCancelled && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Order Status</Text>
            <View style={styles.timeline}>
              {STATUS_STEPS.map((step, index) => {
                const done    = index <= currentStep;
                const current = index === currentStep;
                return (
                  <View key={step.key} style={styles.timelineItem}>
                    <View style={styles.timelineLeft}>
                      <View style={[styles.timelineDot, done && styles.timelineDotDone, current && styles.timelineDotCurrent]}>
                        <Text style={styles.timelineDotEmoji}>{done ? step.emoji : '○'}</Text>
                      </View>
                      {index < STATUS_STEPS.length - 1 && (
                        <View style={[styles.timelineLine, done && styles.timelineLineDone]} />
                      )}
                    </View>
                    <Text style={[styles.timelineLabel, done && styles.timelineLabelDone]}>
                      {step.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items</Text>
          {order.items?.map((item, i) => (
            <View key={i} style={styles.itemRow}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>
                  {item.product?.modelName || item.usedPhone?.modelName || 'Item'}
                </Text>
                <Text style={styles.itemBrand}>
                  {item.product?.brand || item.usedPhone?.brand}
                </Text>
              </View>
              <View style={styles.itemRight}>
                <Text style={styles.itemQty}>×{item.quantity}</Text>
                <Text style={styles.itemPrice}>{formatPrice(item.priceAtTime)}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Delivery Address */}
        {order.deliveryAddress && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
            <View style={styles.addressCard}>
              <Text style={styles.addressName}>{order.deliveryAddress.name}</Text>
              <Text style={styles.addressLine}>{order.deliveryAddress.street}</Text>
              <Text style={styles.addressLine}>
                {order.deliveryAddress.city} — {order.deliveryAddress.pincode}
              </Text>
              {order.deliveryAddress.landmark && (
                <Text style={styles.addressLine}>Near: {order.deliveryAddress.landmark}</Text>
              )}
              <Text style={styles.addressPhone}>📞 {order.deliveryAddress.phone}</Text>
            </View>
          </View>
        )}

        {/* Payment */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment</Text>
          <View style={styles.payRow}>
            <Text style={styles.payKey}>Method</Text>
            <Text style={styles.payVal}>{order.paymentMethod.replace(/_/g, ' ')}</Text>
          </View>
          <View style={styles.payRow}>
            <Text style={styles.payKey}>Status</Text>
            <Text style={[styles.payVal, { color: order.paymentStatus === 'PAID' ? '#065F46' : '#92400E' }]}>
              {order.paymentStatus}
            </Text>
          </View>
          <View style={styles.payRow}>
            <Text style={styles.payKey}>Subtotal</Text>
            <Text style={styles.payVal}>{formatPrice(order.subtotal)}</Text>
          </View>
          <View style={styles.payRow}>
            <Text style={styles.payKey}>Delivery</Text>
            <Text style={styles.payVal}>
              {order.deliveryCharge === 0 ? 'Free' : formatPrice(order.deliveryCharge)}
            </Text>
          </View>
          <View style={[styles.payRow, styles.totalRow]}>
            <Text style={styles.totalKey}>Total</Text>
            <Text style={styles.totalVal}>{formatPrice(order.totalAmount)}</Text>
          </View>
        </View>

        {/* Store */}
        {order.store && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Store</Text>
            <Text style={styles.storeName}>🏪 {order.store.storeName}</Text>
            <Text style={styles.storeAddress}>{order.store.address}, {order.store.city}</Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Cancel Button */}
      {order.status === 'PENDING' && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.cancelBtn, cancelling && styles.cancelBtnDisabled]}
            onPress={handleCancel}
            disabled={cancelling}
          >
            {cancelling
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.cancelBtnText}>✗ Order Cancel Karo</Text>
            }
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: '#F9FAFB' },
  loading:            { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header:             { backgroundColor: '#1E40AF', paddingTop: 50, paddingBottom: 16, paddingHorizontal: 16 },
  backText:           { color: '#93C5FD', fontSize: 14, fontWeight: '600', marginBottom: 8 },
  headerTitle:        { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  statusBadge:        { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
  statusText:         { fontSize: 13, fontWeight: 'bold' },

  section:            { backgroundColor: '#fff', padding: 16, marginTop: 8 },
  sectionTitle:       { fontSize: 15, fontWeight: 'bold', color: '#1F2937', marginBottom: 12 },

  orderMeta:          { flexDirection: 'row', justifyContent: 'space-between' },
  orderIdLabel:       { fontSize: 11, color: '#9CA3AF', marginBottom: 2 },
  orderId:            { fontSize: 16, fontWeight: 'bold', color: '#1F2937' },
  orderDate:          { fontSize: 13, color: '#374151' },

  timeline:           { gap: 0 },
  timelineItem:       { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  timelineLeft:       { alignItems: 'center', width: 36 },
  timelineDot:        { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#E5E7EB' },
  timelineDotDone:    { backgroundColor: '#DBEAFE', borderColor: '#1E40AF' },
  timelineDotCurrent: { backgroundColor: '#1E40AF', borderColor: '#1E40AF' },
  timelineDotEmoji:   { fontSize: 14 },
  timelineLine:       { width: 2, height: 24, backgroundColor: '#E5E7EB', marginVertical: 2 },
  timelineLineDone:   { backgroundColor: '#1E40AF' },
  timelineLabel:      { fontSize: 13, color: '#9CA3AF', paddingTop: 8 },
  timelineLabelDone:  { color: '#1F2937', fontWeight: '600' },

  itemRow:            { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  itemInfo:           { flex: 1 },
  itemName:           { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  itemBrand:          { fontSize: 12, color: '#6B7280', marginTop: 2 },
  itemRight:          { alignItems: 'flex-end' },
  itemQty:            { fontSize: 12, color: '#6B7280' },
  itemPrice:          { fontSize: 14, fontWeight: 'bold', color: '#EA580C', marginTop: 2 },

  addressCard:        { backgroundColor: '#F9FAFB', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  addressName:        { fontSize: 15, fontWeight: 'bold', color: '#1F2937', marginBottom: 4 },
  addressLine:        { fontSize: 13, color: '#4B5563', marginBottom: 2 },
  addressPhone:       { fontSize: 13, color: '#1E40AF', marginTop: 4, fontWeight: '500' },

  payRow:             { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  payKey:             { fontSize: 13, color: '#6B7280' },
  payVal:             { fontSize: 13, color: '#1F2937', fontWeight: '500' },
  totalRow:           { borderBottomWidth: 0, marginTop: 4 },
  totalKey:           { fontSize: 16, fontWeight: 'bold', color: '#1F2937' },
  totalVal:           { fontSize: 20, fontWeight: 'bold', color: '#EA580C' },

  storeName:          { fontSize: 15, fontWeight: 'bold', color: '#1F2937' },
  storeAddress:       { fontSize: 13, color: '#6B7280', marginTop: 4 },

  footer:             { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E5E7EB', padding: 16, paddingBottom: 28 },
  cancelBtn:          { backgroundColor: '#DC2626', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  cancelBtnDisabled:  { backgroundColor: '#FCA5A5' },
  cancelBtnText:      { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});