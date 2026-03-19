import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  StyleSheet, ActivityIndicator, Alert, FlatList
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getProduct } from '../../lib/queries';
import useCartStore from '../../store/cartStore';
import useAuthStore from '../../store/authStore';

function formatPrice(p) {
  return '₹' + Number(p).toLocaleString('en-IN');
}

export default function ProductDetailScreen({ navigation, route }) {
  const { id } = route.params;
  const [selectedImage, setSelectedImage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn:  () => getProduct(id),
  });

  const { addItem, storeId } = useCartStore();
  const { isLoggedIn }       = useAuthStore();

  const product = data?.data;

  const handleAddToCart = () => {
    if (!isLoggedIn) {
      Alert.alert(
        'Login Karo',
        'Cart mein add karne ke liye login zaroori hai',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: () => navigation.navigate('Auth') },
        ]
      );
      return;
    }
    if (product.stock === 0) {
      Alert.alert('Out of Stock', 'Yeh product abhi available nahi hai');
      return;
    }
    const added = addItem(product, product.storeId);
    if (!added) {
      Alert.alert(
        'Alag Store',
        'Cart mein already alag store ka item hai. Cart clear karke add karein?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Clear & Add', style: 'destructive', onPress: () => {
            useCartStore.getState().clearCart();
            addItem(product, product.storeId);
            Alert.alert('✅', 'Cart mein add ho gaya!');
          }},
        ]
      );
      return;
    }
    Alert.alert('✅ Added!', `${product.modelName} cart mein add ho gaya!`, [
      { text: 'Continue Shopping' },
      { text: 'Cart Dekho', onPress: () => navigation.navigate('Cart') },
    ]);
  };

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#1E40AF" />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.loading}>
        <Text>Product nahi mila</Text>
      </View>
    );
  }

  const discount = product.mrp > product.price
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;

  const specs = product.specs || {};

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Back Button */}
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        {/* Main Image */}
        <View style={styles.imageContainer}>
          {product.images?.[selectedImage] ? (
            <Image
              source={{ uri: product.images[selectedImage] }}
              style={styles.mainImage}
            />
          ) : (
            <View style={[styles.mainImage, styles.placeholder]}>
              <Text style={{ fontSize: 80 }}>📱</Text>
            </View>
          )}
          {discount > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>-{discount}%</Text>
            </View>
          )}
        </View>

        {/* Thumbnails */}
        {product.images?.length > 1 && (
          <FlatList
            data={product.images}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_, i) => i.toString()}
            contentContainerStyle={styles.thumbnails}
            renderItem={({ item, index }) => (
              <TouchableOpacity onPress={() => setSelectedImage(index)}>
                <Image
                  source={{ uri: item }}
                  style={[styles.thumbnail, selectedImage === index && styles.thumbnailActive]}
                />
              </TouchableOpacity>
            )}
          />
        )}

        {/* Product Info */}
        <View style={styles.infoBox}>
          <Text style={styles.brand}>{product.brand}</Text>
          <Text style={styles.name}>{product.modelName}</Text>
          {product.variant && (
            <Text style={styles.variant}>{product.variant}</Text>
          )}

          {/* Price */}
          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatPrice(product.price)}</Text>
            {product.mrp > product.price && (
              <Text style={styles.mrp}>{formatPrice(product.mrp)}</Text>
            )}
            {discount > 0 && (
              <View style={styles.saveBadge}>
                <Text style={styles.saveText}>Save {formatPrice(product.mrp - product.price)}</Text>
              </View>
            )}
          </View>

          {/* Stock */}
          <View style={styles.stockRow}>
            <View style={styles.stockBadge(product.stock > 0)}>
              <Text style={styles.stockText(product.stock > 0)}>
                {product.stock > 0 ? `✓ In Stock (${product.stock})` : '✗ Out of Stock'}
              </Text>
            </View>
            <Text style={styles.modelType}>
              {product.modelType === 'OFFLINE' ? '🏪 Store Stock' : '🌐 Order on Request'}
            </Text>
          </View>
        </View>

        {/* Specs */}
        {Object.keys(specs).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Specifications</Text>
            {Object.entries(specs).map(([key, val]) => val ? (
              <View key={key} style={styles.specRow}>
                <Text style={styles.specKey}>{key.charAt(0).toUpperCase() + key.slice(1)}</Text>
                <Text style={styles.specVal}>{val}</Text>
              </View>
            ) : null)}
          </View>
        )}

        {/* Description */}
        {product.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{product.description}</Text>
          </View>
        )}

        {/* Store Info */}
        {product.store && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Store</Text>
            <View style={styles.storeCard}>
              <Text style={styles.storeName}>🏪 {product.store.storeName}</Text>
              <Text style={styles.storeAddress}>{product.store.address}, {product.store.city}</Text>
              <Text style={styles.storePhone}>📞 {product.store.phone}</Text>
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Add to Cart Button */}
      <View style={styles.footer}>
        <View style={styles.footerPrice}>
          <Text style={styles.footerPriceLabel}>Price</Text>
          <Text style={styles.footerPriceValue}>{formatPrice(product.price)}</Text>
        </View>
        <TouchableOpacity
          style={[styles.addBtn, product.stock === 0 && styles.addBtnDisabled]}
          onPress={handleAddToCart}
        >
          <Text style={styles.addBtnText}>
            {product.stock === 0 ? 'Out of Stock' : '🛒 Add to Cart'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: '#F9FAFB' },
  loading:       { flex: 1, alignItems: 'center', justifyContent: 'center' },

  backBtn:       { position: 'absolute', top: 44, left: 16, zIndex: 10, backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  backText:      { color: '#fff', fontWeight: '600', fontSize: 13 },

  imageContainer:{ backgroundColor: '#fff', position: 'relative' },
  mainImage:     { width: '100%', height: 300, resizeMode: 'contain', backgroundColor: '#F9FAFB' },
  placeholder:   { alignItems: 'center', justifyContent: 'center' },
  discountBadge: { position: 'absolute', top: 50, left: 16, backgroundColor: '#EA580C', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  discountText:  { color: '#fff', fontWeight: 'bold', fontSize: 14 },

  thumbnails:    { paddingHorizontal: 12, paddingVertical: 10, gap: 8, backgroundColor: '#fff' },
  thumbnail:     { width: 64, height: 64, borderRadius: 8, resizeMode: 'cover', borderWidth: 2, borderColor: '#E5E7EB' },
  thumbnailActive:{ borderColor: '#1E40AF' },

  infoBox:       { backgroundColor: '#fff', padding: 16, marginTop: 8 },
  brand:         { fontSize: 12, color: '#6B7280', textTransform: 'uppercase', fontWeight: '700' },
  name:          { fontSize: 20, fontWeight: 'bold', color: '#1F2937', marginTop: 4 },
  variant:       { fontSize: 13, color: '#6B7280', marginTop: 4 },
  priceRow:      { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12, flexWrap: 'wrap' },
  price:         { fontSize: 24, fontWeight: 'bold', color: '#EA580C' },
  mrp:           { fontSize: 15, color: '#9CA3AF', textDecorationLine: 'line-through' },
  saveBadge:     { backgroundColor: '#D1FAE5', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  saveText:      { color: '#065F46', fontSize: 12, fontWeight: '600' },
  stockRow:      { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12, flexWrap: 'wrap' },
  stockBadge:    (ok) => ({ backgroundColor: ok ? '#D1FAE5' : '#FEE2E2', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 }),
  stockText:     (ok) => ({ color: ok ? '#065F46' : '#991B1B', fontSize: 12, fontWeight: '600' }),
  modelType:     { fontSize: 12, color: '#6B7280' },

  section:       { backgroundColor: '#fff', padding: 16, marginTop: 8 },
  sectionTitle:  { fontSize: 15, fontWeight: 'bold', color: '#1F2937', marginBottom: 12 },
  specRow:       { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  specKey:       { fontSize: 13, color: '#6B7280', flex: 1 },
  specVal:       { fontSize: 13, color: '#1F2937', fontWeight: '500', flex: 1, textAlign: 'right' },
  description:   { fontSize: 14, color: '#4B5563', lineHeight: 22 },

  storeCard:     { backgroundColor: '#F9FAFB', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  storeName:     { fontSize: 15, fontWeight: 'bold', color: '#1F2937' },
  storeAddress:  { fontSize: 13, color: '#6B7280', marginTop: 4 },
  storePhone:    { fontSize: 13, color: '#1E40AF', marginTop: 4 },

  footer:        { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E5E7EB', flexDirection: 'row', alignItems: 'center', padding: 16, paddingBottom: 28 },
  footerPrice:   { flex: 1 },
  footerPriceLabel:{ fontSize: 12, color: '#6B7280' },
  footerPriceValue:{ fontSize: 20, fontWeight: 'bold', color: '#1F2937' },
  addBtn:        { backgroundColor: '#1E40AF', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12 },
  addBtnDisabled:{ backgroundColor: '#9CA3AF' },
  addBtnText:    { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});