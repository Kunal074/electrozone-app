import { useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, FlatList, Image, Dimensions, ActivityIndicator
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getBanners, getProducts } from '../../lib/queries';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const CATEGORIES = [
  { label: 'Smartphones', emoji: '📱', value: 'SMARTPHONE' },
  { label: 'TVs',         emoji: '📺', value: 'TV' },
  { label: 'ACs',         emoji: '❄️', value: 'AC' },
  { label: 'Audio',       emoji: '🔊', value: 'AUDIO' },
  { label: 'Headphones',  emoji: '🎧', value: 'HEADPHONES' },
  { label: 'Fridges',     emoji: '🧊', value: 'FRIDGE' },
  { label: 'Coolers',     emoji: '💨', value: 'COOLER' },
  { label: 'Accessories', emoji: '🔌', value: 'ACCESSORY' },
];

function formatPrice(p) {
  return '₹' + Number(p).toLocaleString('en-IN');
}

export default function HomeScreen({ navigation }) {
  const [currentBanner, setCurrentBanner] = useState(0);
  const bannerRef = useRef(null);

  const { data: bannersData } = useQuery({ queryKey: ['banners'], queryFn: getBanners });
  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products', { limit: 6 }],
    queryFn:  () => getProducts({ limit: 6 }),
  });

  const banners  = bannersData?.data  || [];
  const products = productsData?.data || [];

  // Auto slide
  useEffect(() => {
    if (banners.length < 2) return;
    const timer = setInterval(() => {
      const next = (currentBanner + 1) % banners.length;
      setCurrentBanner(next);
      bannerRef.current?.scrollToIndex({ index: next, animated: true });
    }, 3500);
    return () => clearInterval(timer);
  }, [currentBanner, banners.length]);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* ── HEADER ── */}
      <LinearGradient colors={['#1E40AF', '#1D4ED8']} style={styles.header}>
        <Text style={styles.headerLogo}>⚡ ElectroZone</Text>
        <Text style={styles.headerSub}>Best Electronics, Best Prices</Text>
      </LinearGradient>

      {/* ── BANNERS ── */}
      {banners.length > 0 ? (
        <View>
          <FlatList
            ref={bannerRef}
            data={banners}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / width);
              setCurrentBanner(index);
            }}
            renderItem={({ item }) => (
              <LinearGradient
                colors={['#1E3A8A', '#1E40AF']}
                style={[styles.bannerSlide, { width }]}
              >
                <View style={styles.bannerContent}>
                  <View style={styles.bannerTag}>
                    <Text style={styles.bannerTagText}>{item.tag}</Text>
                  </View>
                  <Text style={styles.bannerTitle}>{item.title}</Text>
                  <Text style={styles.bannerSubtitle}>{item.subtitle}</Text>
                  <TouchableOpacity style={styles.bannerBtn}>
                    <Text style={styles.bannerBtnText}>{item.btnText} →</Text>
                  </TouchableOpacity>
                </View>
                {item.image && (
                  <Image source={{ uri: item.image }} style={styles.bannerImage} />
                )}
              </LinearGradient>
            )}
          />
          {/* Dots */}
          {banners.length > 1 && (
            <View style={styles.dotsRow}>
              {banners.map((_, i) => (
                <View key={i} style={[styles.dot, i === currentBanner && styles.dotActive]} />
              ))}
            </View>
          )}
        </View>
      ) : (
        <LinearGradient colors={['#1E3A8A', '#1E40AF']} style={[styles.bannerSlide, { width }]}>
          <View style={styles.bannerContent}>
            <View style={styles.bannerTag}>
              <Text style={styles.bannerTagText}>⚡ Best Deals</Text>
            </View>
            <Text style={styles.bannerTitle}>{'Best Smartphones\nBest Prices'}</Text>
            <Text style={styles.bannerSubtitle}>Same day delivery available</Text>
            <TouchableOpacity style={styles.bannerBtn}>
              <Text style={styles.bannerBtnText}>Shop Now →</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      )}

      {/* ── CATEGORIES ── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Shop by Category</Text>
        <FlatList
          data={CATEGORIES}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.value}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.categoryCard}
              onPress={() => navigation.navigate('Products', { category: item.value })}
            >
              <Text style={styles.categoryEmoji}>{item.emoji}</Text>
              <Text style={styles.categoryLabel}>{item.label}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* ── FEATURED PRODUCTS ── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Latest Products</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Products', {})}>
            <Text style={styles.seeAll}>See all →</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <ActivityIndicator color="#1E40AF" style={{ marginTop: 20 }} />
        ) : (
          <FlatList
            data={products}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 16 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.productCard}
                onPress={() => navigation.navigate('ProductDetail', { id: item.id })}
              >
                {item.images?.[0] ? (
                  <Image source={{ uri: item.images[0] }} style={styles.productImage} />
                ) : (
                  <View style={[styles.productImage, styles.productImagePlaceholder]}>
                    <Text style={{ fontSize: 32 }}>📱</Text>
                  </View>
                )}
                {item.mrp > item.price && (
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountText}>
                      -{Math.round(((item.mrp - item.price) / item.mrp) * 100)}%
                    </Text>
                  </View>
                )}
                <View style={styles.productInfo}>
                  <Text style={styles.productBrand}>{item.brand}</Text>
                  <Text style={styles.productName} numberOfLines={1}>{item.modelName}</Text>
                  <Text style={styles.productPrice}>{formatPrice(item.price)}</Text>
                  {item.mrp > item.price && (
                    <Text style={styles.productMrp}>{formatPrice(item.mrp)}</Text>
                  )}
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </View>

      {/* ── USED PHONES BANNER ── */}
      <TouchableOpacity
        style={styles.usedBanner}
        onPress={() => navigation.navigate('UsedPhones')}
      >
        <LinearGradient colors={['#065F46', '#047857']} style={styles.usedBannerInner}>
          <View style={{ flex: 1 }}>
            <Text style={styles.usedBannerTag}>♻️ Certified Used</Text>
            <Text style={styles.usedBannerTitle}>{'Used Phones\nBest Prices'}</Text>
            <Text style={styles.usedBannerSub}>Store verified • Warranty available</Text>
            <View style={styles.usedBannerBtn}>
              <Text style={styles.usedBannerBtnText}>Browse Now →</Text>
            </View>
          </View>
          <Text style={{ fontSize: 64 }}>📱</Text>
        </LinearGradient>
      </TouchableOpacity>

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:         { flex: 1, backgroundColor: '#F9FAFB' },
  header:            { paddingTop: 50, paddingBottom: 16, paddingHorizontal: 16 },
  headerLogo:        { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  headerSub:         { fontSize: 12, color: '#93C5FD', marginTop: 2 },

  bannerSlide:       { height: 180, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20 },
  bannerContent:     { flex: 1 },
  bannerTag:         { backgroundColor: '#EA580C', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, marginBottom: 8 },
  bannerTagText:     { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  bannerTitle:       { color: '#fff', fontSize: 20, fontWeight: 'bold', lineHeight: 26 },
  bannerSubtitle:    { color: '#93C5FD', fontSize: 12, marginTop: 4 },
  bannerBtn:         { backgroundColor: '#EA580C', alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, marginTop: 10 },
  bannerBtnText:     { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  bannerImage:       { width: 100, height: 100, resizeMode: 'contain' },
  dotsRow:           { flexDirection: 'row', justifyContent: 'center', paddingVertical: 8, gap: 6 },
  dot:               { width: 6, height: 6, borderRadius: 3, backgroundColor: '#CBD5E1' },
  dotActive:         { width: 20, backgroundColor: '#EA580C' },

  section:           { marginTop: 20 },
  sectionHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12 },
  sectionTitle:      { fontSize: 16, fontWeight: 'bold', color: '#1F2937', paddingHorizontal: 16, marginBottom: 12 },
  seeAll:            { fontSize: 13, color: '#1E40AF', fontWeight: '600' },

  categoryCard:      { alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 12, marginRight: 10, width: 80, borderWidth: 1, borderColor: '#E5E7EB' },
  categoryEmoji:     { fontSize: 28, marginBottom: 4 },
  categoryLabel:     { fontSize: 10, color: '#374151', textAlign: 'center', fontWeight: '500' },

  productCard:       { backgroundColor: '#fff', borderRadius: 12, marginRight: 12, width: 160, borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden' },
  productImage:      { width: '100%', height: 130, resizeMode: 'cover' },
  productImagePlaceholder: { backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  discountBadge:     { position: 'absolute', top: 8, left: 8, backgroundColor: '#EA580C', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  discountText:      { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  productInfo:       { padding: 10 },
  productBrand:      { fontSize: 10, color: '#6B7280', textTransform: 'uppercase', fontWeight: '600' },
  productName:       { fontSize: 13, fontWeight: '600', color: '#1F2937', marginTop: 2 },
  productPrice:      { fontSize: 14, fontWeight: 'bold', color: '#EA580C', marginTop: 4 },
  productMrp:        { fontSize: 11, color: '#9CA3AF', textDecorationLine: 'line-through' },

  usedBanner:        { marginHorizontal: 16, marginTop: 20, borderRadius: 16, overflow: 'hidden' },
  usedBannerInner:   { flexDirection: 'row', alignItems: 'center', padding: 20 },
  usedBannerTag:     { color: '#6EE7B7', fontSize: 12, fontWeight: 'bold', marginBottom: 6 },
  usedBannerTitle:   { color: '#fff', fontSize: 20, fontWeight: 'bold', lineHeight: 26 },
  usedBannerSub:     { color: '#A7F3D0', fontSize: 12, marginTop: 4 },
  usedBannerBtn:     { backgroundColor: '#EA580C', alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, marginTop: 10 },
  usedBannerBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
});