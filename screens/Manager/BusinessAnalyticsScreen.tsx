import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, ScrollView } from 'react-native';
import { useAuth, isAuthenticated, hasRole } from '../../auth/useAuth';
import { supabase } from '../../supabase/client';
import { useNavigation } from '@react-navigation/native';

interface Restaurant {
  id: string;
  name: string;
}

interface Booking {
  id: string;
  date: string;
  party_size: number;
}

interface Review {
  rating: number;
}

const BusinessAnalytics: React.FC = () => {
  const { user, loading } = useAuth();
  const navigation = useNavigation();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [totalBookings, setTotalBookings] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [revenue, setRevenue] = useState(0);

  useEffect(() => {
    if (!loading && (!isAuthenticated(user) || !hasRole(user, 'business_owner'))) {
      navigation.navigate('Auth' as never);
    }
  }, [user, loading, navigation]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!user?.id) return;

      try {
        const { data: restaurantData, error: restaurantError } = await supabase
          .from('restaurants')
          .select('id, name')
          .eq('owner_id', user.id);

        if (restaurantError) throw restaurantError;
        setRestaurants(restaurantData || []);

        const restaurantIds = restaurantData?.map((r) => r.id) || [];
        if (restaurantIds.length === 0) {
          setTotalBookings(0);
          setRevenue(0);
          setAverageRating(0);
          return;
        }

        const [bookingRes, reviewRes] = await Promise.all([
          supabase.from('bookings').select('id, date, party_size').in('restaurant_id', restaurantIds),
          supabase.from('reviews').select('rating').in('restaurant_id', restaurantIds),
        ]);

        if (bookingRes.error) throw bookingRes.error;
        if (reviewRes.error) throw reviewRes.error;

        const bookingData = bookingRes.data || [];
        const reviewData = reviewRes.data || [];

        setTotalBookings(bookingData.length);
        setRevenue(bookingData.length * 50);

        const avgRating =
          reviewData.length > 0
            ? reviewData.reduce((sum, r) => sum + r.rating, 0) / reviewData.length
            : 0;
        setAverageRating(avgRating);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      }
    };

    if (isAuthenticated(user) && hasRole(user, 'business_owner')) {
      fetchAnalytics();
    }
  }, [user]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!isAuthenticated(user) || !hasRole(user, 'business_owner')) return null;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Business Analytics</Text>
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statTitle}>Total Bookings</Text>
          <Text style={styles.statValue}>{totalBookings}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statTitle}>Average Rating</Text>
          <Text style={styles.statValue}>{averageRating.toFixed(1)} / 5</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statTitle}>Estimated Revenue</Text>
          <Text style={styles.statValue}>${revenue.toFixed(2)}</Text>
        </View>
      </View>
      <Text style={styles.sectionTitle}>Your Restaurants</Text>
      <FlatList
        data={restaurants}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.restaurantItem}>
            <Text style={styles.restaurantName}>{item.name}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No restaurants found.</Text>}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#f3f3f3',
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  statTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  restaurantItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  restaurantName: {
    fontSize: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    marginVertical: 16,
  },
});

export default BusinessAnalytics;
