import { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  StyleSheet, Image, Alert, ScrollView, ActivityIndicator
} from 'react-native';
import { useMutation } from '@tanstack/react-query';
import useCartStore from '../../store/cartStore';
import useAuthStore from '../../store/authStore';
import { createOrder } from '../../lib/queries';

const PAYMENT_METHODS = [
  { label: '💵 Cash on Delivery', value: 'COD' },
  { label: '📱 UPI',              value: 'UPI' },
  { label: '💳 Card',             value: 'CARD' },
  { label: '🏦 Net Banking',      value: 'NET_BANKING' },
  { label: '50% Advance',         value: 'ADVANCE_50' },
];

function formatPrice(p) {
  return '₹' + Number(p).toLocaleString('en-IN');
}

export default function CartScreen({ navigation }) {
  const { items, removeItem, updateQuantity, clearCart, getSubtotal, storeId } = useCartStore();
  const { user, isLoggedIn } = useAuthStore();

  const [fulfillment, setFulfillment] = useState('HOME_DELIVERY');
  const [payment,     setPayment]     = useState('COD');
  const [address,     setAddress]     = useState({
    name: user?.name || '', phone: user?.phone || '',
    street: '', city: '', pincode: '', landmark: ''
  });

  const deliveryCharge = fulfillment === 'HOME_DELIVERY' ? 49 : 0;
  const subtotal       = getSubtotal();
  const total          = subtotal + deliveryCharge;

  const { mutate: placeOrder, isLoading } = useMutation({
    mutationFn: createOrder,
    onSuccess: (res) => {
      clearCart();
      Alert.alert('🎉 Order Place Ho Gaya!', `Order ID: ${res.data.id.slice(-8).toUpperCase()}`, [
        { text: 'Orders Dekho', onPress: () => navigation.navigate('Orders') },
      ]);
    },
    onError: (err) => {
      Alert.alert('Error', err.response?.data?.message || 'Order place nahi hua');
    },
  });

  const handlePlaceOrder = () => {
    if (!isLoggedIn) {
      Alert.alert('Login Karo', 'Order place karne ke liye login zaroori hai', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Login', onPress: () => navigation.navigate('Auth') },
      ]);
      return;
    }
    if (items.length === 0) {
      Alert.alert('Cart Khali Hai', 'Pehle kuch products add karo');
      return;
    }
    if (fulfillment === 'HOME_DELIVERY') {
      if (!address.street || !address.city || !address.pincode) {
        Alert.alert('Address Daalo', 'Delivery ke liye address zaroori hai');
        return;
      }
    }

    placeOrder({
      storeId,
      fulfillmentType: fulfillment,
      paymentMethod:   payment,
      deliveryAddress: fulfillment === 'HOME_DELIVERY' ? address : null,
      subtotal,
      deliveryCharge,
      totalAmount: total,
      items: items.map(i => ({
        productId:   i.id,
        quantity:    i.quantity,
        priceAtTime: i.price,
      })),
    });
  };

  if (items.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyEmoji}>🛒</Text>
        <Text style={styles.emptyTitle}>Cart Khali Hai</Text>
        <Text style={styles.emptyText}>Kuch products add karo</Text>
        <TouchableOpacity
          style={styles.shopBtn}
          onPress={() => navigation.navigate('Products')}
        >
          <Text style={styles.shopBtnText}>Products Dekho →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🛒 My Cart</Text>
        <Text style={styles.headerSub}>{items.length} items</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Cart Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items</Text>
          {items.map((item) => (
            <View key={item.id} style={styles.cartItem}>
              {item.images?.[0] ? (
                <Image source={{ uri: item.images[0] }} style={styles.itemImage} />
              ) : (
                <View style={[styles.itemImage, styles.placeholder]}>
                  <Text style={{ fontSize: 24 }}>📱</Text>
                </View>
              )}
              <View style={styles.itemInfo}>
                <Text style={styles.itemBrand}>{item.brand}</Text>
                <Text style={styles.itemName} numberOfLines={2}>{item.modelName}</Text>
                <Text style={styles.itemPrice}>{formatPrice(item.price)}</Text>
              </View>
              <View style={styles.qtyBox}>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => item.quantity === 1
                    ? Alert.alert('Remove?', '', [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Remove', style: 'destructive', onPress: () => removeItem(item.id) }
                      ])
                    : updateQuantity(item.id, item.quantity - 1)
                  }
                >
                  <Text style={styles.qtyBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.qtyNum}>{item.quantity}</Text>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => updateQuantity(item.id, item.quantity + 1)}
                >
                  <Text style={styles.qtyBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Fulfillment */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Type</Text>
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleBtn, fulfillment === 'HOME_DELIVERY' && styles.toggleActive]}
              onPress={() => setFulfillment('HOME_DELIVERY')}
            >
              <Text style={[styles.toggleText, fulfillment === 'HOME_DELIVERY' && styles.toggleTextActive]}>
                🏠 Home Delivery
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, fulfillment === 'STORE_PICKUP' && styles.toggleActive]}
              onPress={() => setFulfillment('STORE_PICKUP')}
            >
              <Text style={[styles.toggleText, fulfillment === 'STORE_PICKUP' && styles.toggleTextActive]}>
                🏪 Store Pickup
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Address */}
        {fulfillment === 'HOME_DELIVERY' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
            {[
              { key: 'name',     placeholder: 'Full Name',    keyboard: 'default' },
              { key: 'phone',    placeholder: 'Phone Number', keyboard: 'phone-pad' },
              { key: 'street',   placeholder: 'Street Address', keyboard: 'default' },
              { key: 'city',     placeholder: 'City',         keyboard: 'default' },
              { key: 'pincode',  placeholder: 'Pincode',      keyboard: 'number-pad' },
              { key: 'landmark', placeholder: 'Landmark (optional)', keyboard: 'default' },
            ].map(({ key, placeholder, keyboard }) => (
              <TextInput
                key={key}
                style={styles.addressInput}
                placeholder={placeholder}
                value={address[key]}
                onChangeText={(val) => setAddress({ ...address, [key]: val })}
                keyboardType={keyboard}
                placeholderTextColor="#9CA3AF"
              />
            ))}
          </View>
        )}

        {/* Payment */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          {PAYMENT_METHODS.map((pm) => (
            <TouchableOpacity
              key={pm.value}
              style={[styles.paymentRow, payment === pm.value && styles.paymentRowActive]}
              onPress={() => setPayment(pm.value)}
            >
              <View style={[styles.radio, payment === pm.value && styles.radioActive]}>
                {payment === pm.value && <View style={styles.radioDot} />}
              </View>
              <Text style={styles.paymentLabel}>{pm.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryKey}>Subtotal</Text>
            <Text style={styles.summaryVal}>{formatPrice(subtotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryKey}>Delivery</Text>
            <Text style={styles.summaryVal}>
              {deliveryCharge === 0 ? '🆓 Free' : formatPrice(deliveryCharge)}
            </Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalKey}>Total</Text>
            <Text style={styles.totalVal}>{formatPrice(total)}</Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Place Order Button */}
      <View style={styles.footer}>
        <View>
          <Text style={styles.footerTotal}>{formatPrice(total)}</Text>
          <Text style={styles.footerItems}>{items.length} items</Text>
        </View>
        <TouchableOpacity
          style={[styles.orderBtn, isLoading && styles.orderBtnDisabled]}
          onPress={handlePlaceOrder}
          disabled={isLoading}
        >
          {isLoading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.orderBtnText}>Place Order ✓</Text>
          }
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#F9FAFB' },
  header:          { backgroundColor: '#1E40AF', paddingTop: 50, paddingBottom: 14, paddingHorizontal: 16 },
  headerTitle:     { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  headerSub:       { color: '#93C5FD', fontSize: 12, marginTop: 2 },

  empty:           { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F9FAFB' },
  emptyEmoji:      { fontSize: 64, marginBottom: 16 },
  emptyTitle:      { fontSize: 22, fontWeight: 'bold', color: '#1F2937', marginBottom: 8 },
  emptyText:       { fontSize: 14, color: '#6B7280', marginBottom: 24 },
  shopBtn:         { backgroundColor: '#1E40AF', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  shopBtnText:     { color: '#fff', fontWeight: 'bold', fontSize: 15 },

  section:         { backgroundColor: '#fff', padding: 16, marginTop: 8 },
  sectionTitle:    { fontSize: 15, fontWeight: 'bold', color: '#1F2937', marginBottom: 12 },

  cartItem:        { flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  itemImage:       { width: 70, height: 70, borderRadius: 10, resizeMode: 'cover', backgroundColor: '#F3F4F6' },
  placeholder:     { alignItems: 'center', justifyContent: 'center' },
  itemInfo:        { flex: 1, marginLeft: 12 },
  itemBrand:       { fontSize: 10, color: '#6B7280', textTransform: 'uppercase', fontWeight: '600' },
  itemName:        { fontSize: 13, fontWeight: '600', color: '#1F2937', marginTop: 2 },
  itemPrice:       { fontSize: 14, fontWeight: 'bold', color: '#EA580C', marginTop: 4 },
  qtyBox:          { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn:          { width: 28, height: 28, borderRadius: 14, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  qtyBtnText:      { fontSize: 18, color: '#1F2937', fontWeight: 'bold', lineHeight: 22 },
  qtyNum:          { fontSize: 15, fontWeight: 'bold', color: '#1F2937', minWidth: 20, textAlign: 'center' },

  toggleRow:       { flexDirection: 'row', gap: 10 },
  toggleBtn:       { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center' },
  toggleActive:    { backgroundColor: '#1E40AF', borderColor: '#1E40AF' },
  toggleText:      { fontSize: 13, color: '#6B7280', fontWeight: '600' },
  toggleTextActive:{ color: '#fff' },

  addressInput:    { backgroundColor: '#F9FAFB', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, borderWidth: 1, borderColor: '#E5E7EB', color: '#1F2937', marginBottom: 10 },

  paymentRow:      { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderRadius: 10, paddingHorizontal: 12, marginBottom: 6, borderWidth: 1, borderColor: '#E5E7EB' },
  paymentRowActive:{ borderColor: '#1E40AF', backgroundColor: '#EFF6FF' },
  radio:           { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#D1D5DB', alignItems: 'center', justifyContent: 'center' },
  radioActive:     { borderColor: '#1E40AF' },
  radioDot:        { width: 10, height: 10, borderRadius: 5, backgroundColor: '#1E40AF' },
  paymentLabel:    { fontSize: 14, color: '#374151', fontWeight: '500' },

  summaryRow:      { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  summaryKey:      { fontSize: 14, color: '#6B7280' },
  summaryVal:      { fontSize: 14, color: '#1F2937', fontWeight: '500' },
  totalRow:        { borderTopWidth: 1, borderTopColor: '#E5E7EB', marginTop: 8, paddingTop: 12 },
  totalKey:        { fontSize: 16, fontWeight: 'bold', color: '#1F2937' },
  totalVal:        { fontSize: 20, fontWeight: 'bold', color: '#EA580C' },

  footer:          { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E5E7EB', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingBottom: 28 },
  footerTotal:     { fontSize: 20, fontWeight: 'bold', color: '#1F2937' },
  footerItems:     { fontSize: 12, color: '#6B7280' },
  orderBtn:        { backgroundColor: '#1E40AF', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 12 },
  orderBtnDisabled:{ backgroundColor: '#93C5FD' },
  orderBtnText:    { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});