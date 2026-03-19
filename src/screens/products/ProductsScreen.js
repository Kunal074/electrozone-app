import { useEffect } from 'react';
import api from '../../lib/api';

import { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  StyleSheet, Image, ActivityIndicator, ScrollView
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getProducts } from '../../lib/queries';

const CATEGORIES = [
  { label: 'All',         value: '' },
  { label: '📱 Phones',   value: 'SMARTPHONE' },
  { label: '📺 TVs',      value: 'TV' },
  { label: '❄️ ACs',      value: 'AC' },
  { label: '🔊 Audio',    value: 'AUDIO' },
  { label: '🎧 Headphones', value: 'HEADPHONES' },
  { label: '🧊 Fridges',  value: 'FRIDGE' },
  { label: '💨 Coolers',  value: 'COOLER' },
  { label: '🔌 Accessories', value: 'ACCESSORY' },
];

function formatPrice(p) {
  return '₹' + Number(p).toLocaleString('en-IN');
}

export default function ProductsScreen({ navigation, route }) {

  useEffect(() => {
    api.get('/products')
      .then(res => console.log('✅ Products:', JSON.stringify(res.data)))
      .catch(err => console.log('❌ Error:', err.message, err.code));
  }, []);

  

  const [search,   setSearch]   = useState('');
  const [category, setCategory] = useState(route?.params?.category || '');
  const [inStock,  setInStock]  = useState(false);

  const filters = {};
  if (category) filters.category = category;
  if (inStock)  filters.inStock  = true;
  if (search)   filters.search   = search;

  const { data, isLoading } = useQuery({
    queryKey: ['products', filters],
    queryFn:  () => getProducts(filters),
  });

  const products = data?.data || [];

  const renderProduct = useCallback(({ item }) => {
    const discount = item.mrp > item.price
      ? Math.round(((item.mrp - item.price) / item.mrp) * 100) : 0;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('ProductDetail', { id: item.id })}
      >
        {item.images?.[0] ? (
          <Image source={{ uri: item.images[0] }} style={styles.cardImage} />
        ) : (
          <View style={[styles.cardImage, styles.placeholder]}>
            <Text style={{ fontSize: 36 }}>📱</Text>
          </View>
        )}

        {discount > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-{discount}%</Text>
          </View>
        )}

        <View style={styles.stockBadge(item.stock > 0)}>
          <Text style={styles.stockText(item.stock > 0)}>
            {item.stock > 0 ? 'In Stock' : 'Out of Stock'}
          </Text>
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.brand}>{item.brand}</Text>
          <Text style={styles.name} numberOfLines={2}>{item.modelName}</Text>
          {item.variant && <Text style={styles.variant}>{item.variant}</Text>}
          <Text style={styles.price}>{formatPrice(item.price)}</Text>
          {item.mrp > item.price && (
            <Text style={styles.mrp}>{formatPrice(item.mrp)}</Text>
          )}
          <Text style={styles.store} numberOfLines={1}>
            🏪 {item.store?.storeName}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }, []);

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Products</Text>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor="#9CA3AF"
        />
        <TouchableOpacity
          style={[styles.stockToggle, inStock && styles.stockToggleActive]}
          onPress={() => setInStock(!inStock)}
        >
          <Text style={[styles.stockToggleText, inStock && styles.stockToggleTextActive]}>
            In Stock
          </Text>
        </TouchableOpacity>
      </View>

      {/* Category Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabs}
        contentContainerStyle={{ paddingHorizontal: 12 }}
      >
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.value}
            style={[styles.tab, category === cat.value && styles.tabActive]}
            onPress={() => setCategory(cat.value)}
          >
            <Text style={[styles.tabText, category === cat.value && styles.tabTextActive]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Results count */}
      <Text style={styles.resultCount}>
        {products.length} products mile
      </Text>

      {/* Products Grid */}
      {isLoading ? (
        <ActivityIndicator color="#1E40AF" style={{ marginTop: 40 }} size="large" />
      ) : products.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>😕</Text>
          <Text style={styles.emptyText}>Koi product nahi mila</Text>
          <TouchableOpacity onPress={() => { setCategory(''); setSearch(''); setInStock(false); }}>
            <Text style={styles.clearFilter}>Filters clear karo</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={renderProduct}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#F9FAFB' },
  header:       { backgroundColor: '#1E40AF', paddingTop: 50, paddingBottom: 14, paddingHorizontal: 16 },
  headerTitle:  { color: '#fff', fontSize: 20, fontWeight: 'bold' },

  searchRow:    { flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingVertical: 10 },
  searchInput:  { flex: 1, backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, borderWidth: 1, borderColor: '#E5E7EB', color: '#1F2937' },
  stockToggle:  { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 12, justifyContent: 'center' },
  stockToggleActive: { backgroundColor: '#1E40AF', borderColor: '#1E40AF' },
  stockToggleText:   { fontSize: 12, color: '#6B7280', fontWeight: '600' },
  stockToggleTextActive: { color: '#fff' },

  tabs:         { maxHeight: 44, marginBottom: 4 },
  tab:          { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', marginRight: 8 },
  tabActive:    { backgroundColor: '#1E40AF', borderColor: '#1E40AF' },
  tabText:      { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  tabTextActive:{ color: '#fff' },

  resultCount:  { fontSize: 12, color: '#9CA3AF', paddingHorizontal: 16, marginBottom: 8 },

  list:         { paddingHorizontal: 12, paddingBottom: 20 },
  row:          { justifyContent: 'space-between', marginBottom: 12 },

  card:         { backgroundColor: '#fff', borderRadius: 12, width: '48.5%', borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden' },
  cardImage:    { width: '100%', height: 140, resizeMode: 'cover' },
  placeholder:  { backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  discountBadge:{ position: 'absolute', top: 8, left: 8, backgroundColor: '#EA580C', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  discountText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  stockBadge:   (inStock) => ({ position: 'absolute', top: 8, right: 8, backgroundColor: inStock ? '#D1FAE5' : '#FEE2E2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }),
  stockText:    (inStock) => ({ color: inStock ? '#065F46' : '#991B1B', fontSize: 10, fontWeight: 'bold' }),
  cardBody:     { padding: 10 },
  brand:        { fontSize: 10, color: '#6B7280', textTransform: 'uppercase', fontWeight: '600' },
  name:         { fontSize: 13, fontWeight: '600', color: '#1F2937', marginTop: 2 },
  variant:      { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  price:        { fontSize: 15, fontWeight: 'bold', color: '#EA580C', marginTop: 4 },
  mrp:          { fontSize: 11, color: '#9CA3AF', textDecorationLine: 'line-through' },
  store:        { fontSize: 11, color: '#6B7280', marginTop: 4 },

  empty:        { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyEmoji:   { fontSize: 48, marginBottom: 12 },
  emptyText:    { fontSize: 16, color: '#6B7280', marginBottom: 8 },
  clearFilter:  { color: '#1E40AF', fontWeight: '600', fontSize: 14 },
});