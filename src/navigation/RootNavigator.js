import 'react-native-gesture-handler';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import useCartStore from '../store/cartStore';

import HomeScreen         from '../screens/home/HomeScreen';
import ProductsScreen     from '../screens/products/ProductsScreen';
import ProductDetailScreen from '../screens/products/ProductDetailScreen';
import UsedPhonesScreen   from '../screens/usedphones/UsedPhonesScreen';
import UsedPhoneDetailScreen from '../screens/usedphones/UsedPhoneDetailScreen';
import CartScreen         from '../screens/cart/CartScreen';
import OrdersScreen       from '../screens/orders/OrdersScreen';
import OrderDetailScreen  from '../screens/orders/OrderDetailScreen';
import AuthScreen         from '../screens/auth/AuthScreen';

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabIcon({ emoji, focused }) {
  return <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>;
}

function CartIcon({ focused }) {
  const count = useCartStore((s) => s.getCount());
  return (
    <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>
      🛒{count > 0 ? ` ${count}` : ''}
    </Text>
  );
}

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown:          false,
        tabBarStyle:          { backgroundColor: '#fff', borderTopColor: '#e5e7eb', height: 60 },
        tabBarLabelStyle:     { fontSize: 11, marginBottom: 6 },
        tabBarActiveTintColor:   '#1E40AF',
        tabBarInactiveTintColor: '#9CA3AF',
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen}
        options={{ tabBarLabel: 'Home',     tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} /> }} />
      <Tab.Screen name="Products" component={ProductsScreen}
        options={{ tabBarLabel: 'Products', tabBarIcon: ({ focused }) => <TabIcon emoji="📱" focused={focused} /> }} />
      <Tab.Screen name="UsedPhones" component={UsedPhonesScreen}
        options={{ tabBarLabel: 'Used',     tabBarIcon: ({ focused }) => <TabIcon emoji="♻️" focused={focused} /> }} />
      <Tab.Screen name="Cart" component={CartScreen}
        options={{ tabBarLabel: 'Cart',     tabBarIcon: ({ focused }) => <CartIcon focused={focused} /> }} />
      <Tab.Screen name="Orders" component={OrdersScreen}
        options={{ tabBarLabel: 'Orders',   tabBarIcon: ({ focused }) => <TabIcon emoji="📦" focused={focused} /> }} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main"            component={TabNavigator} />
      <Stack.Screen name="ProductDetail"   component={ProductDetailScreen} />
      <Stack.Screen name="UsedPhoneDetail" component={UsedPhoneDetailScreen} />
      <Stack.Screen name="OrderDetail"     component={OrderDetailScreen} />
      <Stack.Screen name="Auth"            component={AuthScreen} />
    </Stack.Navigator>
  );
}