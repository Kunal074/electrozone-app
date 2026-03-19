import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  StyleSheet, ActivityIndicator, FlatList, Linking
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getUsedPhone } from '../../lib/queries';

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

export default function UsedPhoneDetailScreen({ navigation, route }) {
  const { id } = route.params;
  const [selectedImage, setSelectedImage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ['usedPhone', id],
    queryFn:  () => getUsedPhone(id),
  });

  const phone = data?.data;

  const handleWhatsApp = () => {
    if (!phone?.store?.whatsappNumber) return;
    const msg = `Hi, I'm interested in your ${phone.brand} ${phone.modelName} listed on ElectroZone for ${formatPrice(phone.askingPrice)}`;
    Linking.openURL(`https://wa.me/91${phone.store.whatsappNumber}?text=${encodeURIComponent(msg)}`);
  };

  const handleCall = () => {
    if (!phone?.store?.phone) return;
    Linking.openURL(`tel:${phone.store.phone}`);
  };

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#065F46" />
      </View>
    );
  }

  if (!phone) {
    return (
      <View style={styles.loading}>
        <Text>Phone nahi mila</Text>
      </View>
    );
  }

  const cond = CONDITION_COLORS[phone.conditionGrade] || CONDITION_COLORS.GOOD;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Back */}
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        {/* Main Image */}
        <View style={styles.imageContainer}>
          {phone.images?.[selectedImage] ? (
            <Image source={{ uri: phone.images[selectedImage] }} style={styles.mainImage} />
          ) : (
            <View style={[styles.mainImage, styles.placeholder]}>
              <Text style={{ fontSize: 80 }}>📱</Text>
            </View>
          )}
        </View>

        {/* Thumbnails */}
        {phone.images?.length > 1 && (
          <FlatList
            data={phone.images}
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

        {/* Info */}
        <View style={styles.infoBox}>
          <Text style={styles.brand}>{phone.brand}</Text>
          <Text style={styles.name}>{phone.modelName}</Text>

          {/* Specs Row */}
          <View style={styles.specsRow}>
            {phone.storage && <View style={styles.specChip}><Text style={styles.specText}>{phone.storage}</Text></View>}
            {phone.ram     && <View style={styles.specChip}><Text style={styles.specText}>{phone.ram} RAM</Text></View>}
            {phone.color   && <View style={styles.specChip}><Text style={styles.specText}>{phone.color}</Text></View>}
          </View>

          {/* Condition */}
          <View style={styles.condRow}>
            <View style={[styles.condBadge, { backgroundColor: cond.bg }]}>
              <Text style={[styles.condText, { color: cond.text }]}>
                {phone.conditionGrade.replace('_', ' ')}
              </Text>
            </View>
            {phone.isNegotiable && (
              <View style={styles.negoBadge}>
                <Text style={styles.negoText}>💬 Negotiable</Text>
              </View>
            )}
          </View>

          {/* Price */}
          <Text style={styles.price}>{formatPrice(phone.askingPrice)}</Text>

          {/* Battery Health */}
          {phone.batteryHealth && (
            <View style={styles.batteryRow}>
              <Text style={styles.batteryLabel}>🔋 Battery Health</Text>
              <View style={styles.batteryBar}>
                <View style={[styles.batteryFill, { width: `${phone.batteryHealth}%` }]} />
              </View>
              <Text style={styles.batteryPct}>{phone.batteryHealth}%</Text>
            </View>
          )}
        </View>

        {/* Condition Description */}
        {phone.conditionDescription && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Condition Details</Text>
            <Text style={styles.condDesc}>{phone.conditionDescription}</Text>
          </View>
        )}

        {/* Warranty & Accessories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What's Included</Text>
          {phone.warrantyLeft && (
            <View style={styles.detailRow}>
              <Text style={styles.detailKey}>🛡️ Warranty</Text>
              <Text style={styles.detailVal}>{phone.warrantyLeft}</Text>
            </View>
          )}
          {phone.accessories?.length > 0 && (
            <View style={styles.detailRow}>
              <Text style={styles.detailKey}>📦 Accessories</Text>
              <Text style={styles.detailVal}>{phone.accessories.join(', ')}</Text>
            </View>
          )}
        </View>

        {/* Store Info */}
        {phone.store && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Store</Text>
            <View style={styles.storeCard}>
              <Text style={styles.storeName}>🏪 {phone.store.storeName}</Text>
              <Text style={styles.storeAddress}>{phone.store.address}, {phone.store.city}</Text>
            </View>
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Footer Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.callBtn} onPress={handleCall}>
          <Text style={styles.callBtnText}>📞 Call</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.whatsappBtn} onPress={handleWhatsApp}>
          <Text style={styles.whatsappBtnText}>💬 WhatsApp</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#F9FAFB' },
  loading:        { flex: 1, alignItems: 'center', justifyContent: 'center' },

  backBtn:        { position: 'absolute', top: 44, left: 16, zIndex: 10, backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  backText:       { color: '#fff', fontWeight: '600', fontSize: 13 },

  imageContainer: { backgroundColor: '#fff' },
  mainImage:      { width: '100%', height: 300, resizeMode: 'contain', backgroundColor: '#F9FAFB' },
  placeholder:    { alignItems: 'center', justifyContent: 'center' },

  thumbnails:     { paddingHorizontal: 12, paddingVertical: 10, gap: 8, backgroundColor: '#fff' },
  thumbnail:      { width: 64, height: 64, borderRadius: 8, resizeMode: 'cover', borderWidth: 2, borderColor: '#E5E7EB' },
  thumbnailActive:{ borderColor: '#065F46' },

  infoBox:        { backgroundColor: '#fff', padding: 16, marginTop: 8 },
  brand:          { fontSize: 12, color: '#6B7280', textTransform: 'uppercase', fontWeight: '700' },
  name:           { fontSize: 22, fontWeight: 'bold', color: '#1F2937', marginTop: 4 },
  specsRow:       { flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' },
  specChip:       { backgroundColor: '#F3F4F6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  specText:       { fontSize: 12, color: '#374151', fontWeight: '500' },
  condRow:        { flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' },
  condBadge:      { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 6 },
  condText:       { fontSize: 12, fontWeight: 'bold' },
  negoBadge:      { backgroundColor: '#EDE9FE', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 6 },
  negoText:       { color: '#5B21B6', fontSize: 12, fontWeight: '600' },
  price:          { fontSize: 28, fontWeight: 'bold', color: '#EA580C', marginTop: 12 },

  batteryRow:     { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  batteryLabel:   { fontSize: 13, color: '#374151', width: 120 },
  batteryBar:     { flex: 1, height: 8, backgroundColor: '#E5E7EB', borderRadius: 4, overflow: 'hidden' },
  batteryFill:    { height: '100%', backgroundColor: '#065F46', borderRadius: 4 },
  batteryPct:     { fontSize: 13, fontWeight: 'bold', color: '#065F46', width: 40, textAlign: 'right' },

  section:        { backgroundColor: '#fff', padding: 16, marginTop: 8 },
  sectionTitle:   { fontSize: 15, fontWeight: 'bold', color: '#1F2937', marginBottom: 12 },
  condDesc:       { fontSize: 14, color: '#4B5563', lineHeight: 22 },
  detailRow:      { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  detailKey:      { fontSize: 13, color: '#6B7280' },
  detailVal:      { fontSize: 13, color: '#1F2937', fontWeight: '500', flex: 1, textAlign: 'right' },

  storeCard:      { backgroundColor: '#F9FAFB', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  storeName:      { fontSize: 15, fontWeight: 'bold', color: '#1F2937' },
  storeAddress:   { fontSize: 13, color: '#6B7280', marginTop: 4 },

  footer:         { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E5E7EB', flexDirection: 'row', gap: 12, padding: 16, paddingBottom: 28 },
  callBtn:        { flex: 1, backgroundColor: '#F3F4F6', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  callBtnText:    { fontSize: 15, fontWeight: 'bold', color: '#1F2937' },
  whatsappBtn:    { flex: 2, backgroundColor: '#065F46', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  whatsappBtnText:{ fontSize: 15, fontWeight: 'bold', color: '#fff' },
});