import { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  StyleSheet, Image, ActivityIndicator, ScrollView
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getUsedPhones } from '../../lib/queries';

const CONDITIONS = [
  { label: 'All',       value: '' },
  { label: '✨ Like New', value: 'LIKE_NEW' },
  { label: '⭐ Excellent', value: 'EXCELLENT' },
  { label: '👍 Good',   value: 'GOOD' },
  { label: '🆗 Fair',   value: 'FAIR' },
  { label: '⚠️ Damaged', value: 'DAMAGED' },
];

const CONDITION_COLORS = {
  LIKE_NEW:  { bg: '#D1FAE5', text: '#065F46' },
  EXCELLENT: { bg: '#DBEAFE', text: '#1E40AF' },
  GOOD:      { bg: '#FEF3C7', text: '#92400E' },
  FAIR:      { bg: '#FEE2E2', text: '#991B1B' },
  DAMAGED:   { bg: '#F3F4F6', text: '#374151' },
};

function formatPrice(p) {
  return '₹' + Number(p).toLocaleString('en-IN');
}

export default function UsedPhonesScreen({ navigation }) {
  const [search,    setSearch]    = useState('');
  const [condition, setCondition] = useState('');
  const [maxPrice,  setMaxPrice]  = useState('');

  const filters = {};
  if (condition) filters.conditionGrade = condition;
  if (maxPrice)  filters.maxPrice       = maxPrice;
  if (search)    filters.search         = search;

  const { data, isLoading } = useQuery({
    queryKey: ['usedPhones', filters],
    queryFn:  () => getUsedPhones(filters),
  });

  const phones = data?.data || [];

  const renderPhone = useCallback(({ item }) => {
    const cond = CONDITION_COLORS[item.conditionGrade] || CONDITION_COLORS.GOOD;
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('UsedPhoneDetail', { id: item.id })}
      >
        {item.images?.[0] ? (
          <Image source={{ uri: item.images[0] }} style={styles.cardImage} />
        ) : (
          <View style={[styles.cardImage, styles.placeholder]}>
            <Text style={{ fontSize: 36 }}>📱</Text>
          </View>
        )}

        {/* Condition Badge */}
        <View style={[styles.condBadge, { backgroundColor: cond.bg }]}>
          <Text style={[styles.condText, { color: cond.text }]}>
            {item.conditionGrade.replace('_', ' ')}
          </Text>
        </View>

        {/* Negotiable Badge */}
        {item.isNegotiable && (
          <View style={styles.negoBadge}>
            <Text style={styles.negoText}>Negotiable</Text>
          </View>
        )}

        <View style={styles.cardBody}>
          <Text style={styles.brand}>{item.brand}</Text>
          <Text style={styles.name} numberOfLines={1}>{item.modelName}</Text>
          <View style={styles.specsRow}>
            {item.storage && <Text style={styles.spec}>{item.storage}</Text>}
            {item.ram     && <Text style={styles.spec}>{item.ram}</Text>}
          </View>
          {item.batteryHealth && (
            <Text style={styles.battery}>🔋 {item.batteryHealth}%</Text>
          )}
          <Text style={styles.price}>{formatPrice(item.askingPrice)}</Text>
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
        <Text style={styles.headerTitle}>♻️ Used Phones</Text>
        <Text style={styles.headerSub}>Store verified • Best prices</Text>
      </View>

      {/* Search + Max Price */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search brand or model..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor="#9CA3AF"
        />
        <TextInput
          style={styles.priceInput}
          placeholder="Max ₹"
          value={maxPrice}
          onChangeText={setMaxPrice}
          keyboardType="numeric"
          placeholderTextColor="#9CA3AF"
        />
      </View>

      {/* Condition Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabs}
        contentContainerStyle={{ paddingHorizontal: 12 }}
      >
        {CONDITIONS.map((c) => (
          <TouchableOpacity
            key={c.value}
            style={[styles.tab, condition === c.value && styles.tabActive]}
            onPress={() => setCondition(c.value)}
          >
            <Text style={[styles.tabText, condition === c.value && styles.tabTextActive]}>
              {c.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Count */}
      <Text style={styles.resultCount}>{phones.length} phones mile</Text>

      {/* List */}
      {isLoading ? (
        <ActivityIndicator color="#1E40AF" style={{ marginTop: 40 }} size="large" />
      ) : phones.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>😕</Text>
          <Text style={styles.emptyText}>Koi phone nahi mila</Text>
          <TouchableOpacity onPress={() => { setCondition(''); setSearch(''); setMaxPrice(''); }}>
            <Text style={styles.clearFilter}>Filters clear karo</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={phones}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={renderPhone}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#F9FAFB' },
  header:       { backgroundColor: '#065F46', paddingTop: 50, paddingBottom: 14, paddingHorizontal: 16 },
  headerTitle:  { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  headerSub:    { color: '#A7F3D0', fontSize: 12, marginTop: 2 },

  searchRow:    { flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingVertical: 10 },
  searchInput:  { flex: 1, backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, borderWidth: 1, borderColor: '#E5E7EB', color: '#1F2937' },
  priceInput:   { width: 80, backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13, borderWidth: 1, borderColor: '#E5E7EB', color: '#1F2937' },

  tabs:         { maxHeight: 44, marginBottom: 4 },
  tab:          { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', marginRight: 8 },
  tabActive:    { backgroundColor: '#065F46', borderColor: '#065F46' },
  tabText:      { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  tabTextActive:{ color: '#fff' },

  resultCount:  { fontSize: 12, color: '#9CA3AF', paddingHorizontal: 16, marginBottom: 8 },

  list:         { paddingHorizontal: 12, paddingBottom: 20 },
  row:          { justifyContent: 'space-between', marginBottom: 12 },

  card:         { backgroundColor: '#fff', borderRadius: 12, width: '48.5%', borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden' },
  cardImage:    { width: '100%', height: 140, resizeMode: 'cover' },
  placeholder:  { backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  condBadge:    { position: 'absolute', top: 8, left: 8, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  condText:     { fontSize: 9, fontWeight: 'bold' },
  negoBadge:    { position: 'absolute', top: 8, right: 8, backgroundColor: '#1E40AF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  negoText:     { color: '#fff', fontSize: 9, fontWeight: 'bold' },
  cardBody:     { padding: 10 },
  brand:        { fontSize: 10, color: '#6B7280', textTransform: 'uppercase', fontWeight: '600' },
  name:         { fontSize: 13, fontWeight: '600', color: '#1F2937', marginTop: 2 },
  specsRow:     { flexDirection: 'row', gap: 6, marginTop: 4 },
  spec:         { backgroundColor: '#F3F4F6', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, fontSize: 10, color: '#374151' },
  battery:      { fontSize: 11, color: '#065F46', marginTop: 4 },
  price:        { fontSize: 15, fontWeight: 'bold', color: '#EA580C', marginTop: 6 },
  store:        { fontSize: 11, color: '#6B7280', marginTop: 4 },

  empty:        { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyEmoji:   { fontSize: 48, marginBottom: 12 },
  emptyText:    { fontSize: 16, color: '#6B7280', marginBottom: 8 },
  clearFilter:  { color: '#065F46', fontWeight: '600', fontSize: 14 },
});