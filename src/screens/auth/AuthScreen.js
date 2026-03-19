import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import useAuthStore from '../../store/authStore';
import { sendOTP, verifyOTP } from '../../lib/queries';

export default function AuthScreen({ navigation }) {
  const [step,    setStep]    = useState(1); // 1=phone, 2=otp
  const [phone,   setPhone]   = useState('');
  const [otp,     setOtp]     = useState('');
  const [name,    setName]    = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuthStore();

  const handleSendOTP = async () => {
    if (phone.length !== 10) {
      Alert.alert('Error', '10 digit phone number daalo');
      return;
    }
    setLoading(true);
    try {
      await sendOTP(phone);
      setStep(2);
      Alert.alert('OTP Bheja!', 'Backend terminal mein OTP dekho (dev mode)');
    } catch (err) {
    console.log('SendOTP Error:', err.message, err.code);
    Alert.alert('Error', err.response?.data?.message || err.message || 'OTP nahi bheja');
  } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
  if (otp.length < 4) {
    Alert.alert('Error', 'OTP daalo');
    return;
  }
  setLoading(true);
  try {
    const res = await verifyOTP(phone.trim(), otp.trim(), name.trim());
    await login(res.data.user, res.data.accessToken);
    Alert.alert('✅ Welcome!', `Hello ${res.data.user.name || 'Customer'}!`, [
      { text: 'OK', onPress: () => navigation.goBack() }
    ]);
  } catch (err) {
    console.log('OTP Error full:', err.message, err.code, JSON.stringify(err.response?.data));
    Alert.alert('Error', err.response?.data?.message || err.message || 'OTP galat hai');
  } finally {
    setLoading(false);
  }
};

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <LinearGradient colors={['#1E40AF', '#1D4ED8']} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>⚡ ElectroZone</Text>
        <Text style={styles.headerSub}>Login karo ya account banao</Text>
      </LinearGradient>

      <View style={styles.card}>

        {/* Steps Indicator */}
        <View style={styles.stepsRow}>
          <View style={styles.step(true)}>
            <Text style={styles.stepText(true)}>1</Text>
          </View>
          <View style={styles.stepLine(step === 2)} />
          <View style={styles.step(step === 2)}>
            <Text style={styles.stepText(step === 2)}>2</Text>
          </View>
        </View>
        <View style={styles.stepsLabel}>
          <Text style={styles.stepLabel}>Phone</Text>
          <Text style={styles.stepLabel}>OTP</Text>
        </View>

        {step === 1 ? (
          <>
            <Text style={styles.title}>Phone Number Daalo</Text>
            <Text style={styles.subtitle}>OTP aayega verify karne ke liye</Text>

            <View style={styles.inputRow}>
              <View style={styles.countryCode}>
                <Text style={styles.countryText}>🇮🇳 +91</Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder="10 digit number"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                maxLength={10}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <TouchableOpacity
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={handleSendOTP}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnText}>OTP Bhejo →</Text>
              }
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.title}>OTP Verify Karo</Text>
            <Text style={styles.subtitle}>+91 {phone} pe bheja gaya</Text>

            <TextInput
              style={styles.otpInput}
              placeholder="6 digit OTP"
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
              placeholderTextColor="#9CA3AF"
            />

            <TextInput
              style={styles.nameInput}
              placeholder="Aapka naam (optional)"
              value={name}
              onChangeText={setName}
              placeholderTextColor="#9CA3AF"
            />

            <TouchableOpacity
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={handleVerifyOTP}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnText}>Verify & Login ✓</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resendBtn}
              onPress={() => setStep(1)}
            >
              <Text style={styles.resendText}>← Phone change karo</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#F9FAFB' },

  header:       { paddingTop: 50, paddingBottom: 30, paddingHorizontal: 20 },
  backBtn:      { marginBottom: 16 },
  backText:     { color: '#93C5FD', fontSize: 14, fontWeight: '600' },
  headerTitle:  { color: '#fff', fontSize: 26, fontWeight: 'bold' },
  headerSub:    { color: '#93C5FD', fontSize: 13, marginTop: 4 },

  card:         { margin: 16, backgroundColor: '#fff', borderRadius: 20, padding: 24, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },

  stepsRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  step:         (active) => ({ width: 32, height: 32, borderRadius: 16, backgroundColor: active ? '#1E40AF' : '#E5E7EB', alignItems: 'center', justifyContent: 'center' }),
  stepText:     (active) => ({ color: active ? '#fff' : '#9CA3AF', fontWeight: 'bold', fontSize: 14 }),
  stepLine:     (active) => ({ flex: 1, height: 2, backgroundColor: active ? '#1E40AF' : '#E5E7EB', marginHorizontal: 8 }),
  stepsLabel:   { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 24 },
  stepLabel:    { fontSize: 12, color: '#6B7280' },

  title:        { fontSize: 20, fontWeight: 'bold', color: '#1F2937', marginBottom: 6 },
  subtitle:     { fontSize: 13, color: '#6B7280', marginBottom: 24 },

  inputRow:     { flexDirection: 'row', gap: 8, marginBottom: 16 },
  countryCode:  { backgroundColor: '#F3F4F6', borderRadius: 10, paddingHorizontal: 12, justifyContent: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  countryText:  { fontSize: 14, color: '#374151', fontWeight: '500' },
  input:        { flex: 1, backgroundColor: '#F9FAFB', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, borderWidth: 1, borderColor: '#E5E7EB', color: '#1F2937' },

  otpInput:     { backgroundColor: '#F9FAFB', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 14, fontSize: 24, borderWidth: 1, borderColor: '#E5E7EB', color: '#1F2937', textAlign: 'center', letterSpacing: 8, marginBottom: 12 },
  nameInput:    { backgroundColor: '#F9FAFB', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, borderWidth: 1, borderColor: '#E5E7EB', color: '#1F2937', marginBottom: 16 },

  btn:          { backgroundColor: '#1E40AF', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  btnDisabled:  { backgroundColor: '#93C5FD' },
  btnText:      { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  resendBtn:    { marginTop: 16, alignItems: 'center' },
  resendText:   { color: '#1E40AF', fontSize: 14, fontWeight: '600' },
});