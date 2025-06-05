import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useAuth, isAuthenticated, hasRole } from '../../auth/useAuth';
import { supabase } from '../../supabase/client';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  Auth: undefined;
  BusinessAnalytics: undefined;
  ManageRestaurant: undefined;
  ReservationManager: undefined;
  Restaurant: { id: string };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  location: string;
}

interface Booking {
  id: string;
  restaurant_id: string;
  status: string;
}

const BusinessOwner: React.FC = () => {
  const { user, loading } = useAuth();
  const navigation = useNavigation<NavigationProp>();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [pendingBookings, setPendingBookings] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!isAuthenticated(user) || !hasRole(user, 'business_owner'))) {
      navigation.navigate('Auth');
    }

    const fetchData = async () => {
      try {
        const { data: restaurantData, error: restaurantError } = await supabase
          .from('restaurants')
          .select('id, name, cuisine, location')
          .eq('owner_id', user?.id);
        if (restaurantError) throw new Error('Failed to fetch restaurants');
        setRestaurants(restaurantData || []);

        const restaurantIds = restaurantData?.map((r) => r.id) || [];
        if (restaurantIds.length > 0) {
          const { data: bookingData, error: bookingError } = await supabase
            .from('bookings')
            .select('id, restaurant_id, status')
            .in('restaurant_id', restaurantIds)
            .eq('status', 'pending');
          if (bookingError) throw new Error('Failed to fetch bookings');
          setPendingBookings(bookingData?.length || 0);
        }
      } catch (error) {
        console.error('Error:', error);
        setError(error instanceof Error ? error.message : 'Failed to load data');
      }
    };

    if (isAuthenticated(user) && hasRole(user, 'business_owner')) {
      fetchData();
    }
  }, [user, loading, navigation]);

  if (loading) return <Text style={styles.loading}>Loading...</Text>;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Business Owner Dashboard</Text>
      {error && <Text style={styles.error}>{error}</Text>}

      {/* Summary Section */}
      <View style={styles.summary}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Total Restaurants</Text>
          <Text style={styles.summaryValue}>{restaurants.length}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Pending Bookings</Text>
          <Text style={styles.summaryValue}>{pendingBookings}</Text>
        </View>
      </View>

      {/* Quick Links */}
      <View style={styles.links}>
        <Text style={styles.sectionTitle}>Manage Your Business</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('BusinessAnalytics')}
        >
          <Text style={styles.buttonText}>View Analytics</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('ManageRestaurant')}
        >
          <Text style={styles.buttonText}>Manage Restaurants</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('ReservationManager')}
        >
          <Text style={styles.buttonText}>Manage Reservations</Text>
        </TouchableOpacity>
      </View>

      {/* Restaurant List */}
      <View style={styles.restaurants}>
        <Text style={styles.sectionTitle}>Your Restaurants</Text>
        {restaurants.length === 0 ? (
          <Text style={styles.empty}>No restaurants found. Add one in Manage Restaurants.</Text>
        ) : (
          restaurants.map((restaurant) => (
            <View key={restaurant.id} style={styles.restaurantItem}>
              <Text style={styles.restaurantText}>
                {restaurant.name} - {restaurant.cuisine} ({restaurant.location})
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Restaurant', { id: restaurant.id })}
              >
                <Text style={styles.link}>View Details</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  loading: { textAlign: 'center', marginTop: 32, fontSize: 18 },
  error: { color: 'red', marginBottom: 16 },
  summary: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  summaryCard: { flex: 1, padding: 16, backgroundColor: '#f0f0f0', borderRadius: 8, marginHorizontal: 8 },
  summaryTitle: { fontSize: 16, fontWeight: '600' },
  summaryValue: { fontSize: 24, marginTop: 8 },
  links: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  button: { backgroundColor: '#007AFF', padding: 12, borderRadius: 8, marginBottom: 8 },
  buttonText: { color: '#fff', textAlign: 'center', fontSize: 16 },
  restaurants: {},
  empty: { color: '#666', fontSize: 16 },
  restaurantItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#ddd' },
  restaurantText: { fontSize: 16 },
  link: { color: '#007AFF', fontSize: 16 },
});

export default BusinessOwner;