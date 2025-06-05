// App.tsx
import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from './auth/useAuth';
import { AuthProvider } from './auth/AuthProvider';

import Auth from './screens/Auth/auth';
import Admin from './screens/Admin/AdminDashboardScreen';
import BusinessOwner from './screens/Manager/BusinessOwner';
import BusinessAnalytics from './screens/Manager/BusinessAnalyticsScreen';
import ManageRestaurant from './screens/Manager/ManageRestaurantScreen';
import ReservationManager from './screens/Manager/ReservationManagerScreen';
import Dashboard from './screens/User/DashboardScreen';
import Profile from './screens/User/Profile';
import FriendsScreen from './screens/User/FriendsScreen';
import PostsScreen from './screens/User/PostsScreen';
import ReviewsScreen from './screens/User/ReviewsScreen';
import Restaurant from './screens/User/RestaurantScreen';
import RestaurantDetailScreen from './screens/User/RestaurantDetailScreen';
import EventDetails from './screens/User/EventDetailScreen';

import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();

const AppNavigator: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) return null;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <Stack.Screen name="Auth" component={Auth} />
      ) : user?.user_metadata?.role === 'admin' ? (
        <Stack.Screen name="Admin" component={Admin} />
      ) : user?.user_metadata?.role === 'business_owner' ? (
        <>
          <Stack.Screen name="BusinessOwner" component={BusinessOwner} />
          <Stack.Screen name="BusinessAnalytics" component={BusinessAnalytics} />
          <Stack.Screen name="ManageRestaurant" component={ManageRestaurant} />
          <Stack.Screen name="ReservationManager" component={ReservationManager} />
          <Stack.Screen name="RestaurantDetail" component={RestaurantDetailScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Dashboard" component={Dashboard} />
          <Stack.Screen name="Profile" component={Profile} />
          <Stack.Screen name="FriendsScreen" component={FriendsScreen} />
          <Stack.Screen name="PostsScreen" component={PostsScreen} />
          <Stack.Screen name="ReviewsScreen" component={ReviewsScreen} />
          <Stack.Screen name="Restaurant" component={Restaurant} />
          <Stack.Screen name="RestaurantDetail" component={RestaurantDetailScreen} />
          <Stack.Screen name="EventDetails" component={EventDetails} />
        </>
      )}
    </Stack.Navigator>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
};

export default App;
