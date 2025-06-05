import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth, isAuthenticated, hasRole } from '../../auth/useAuth';
import { supabase } from '../../supabase/client';
import { useNavigation } from '@react-navigation/native';

interface Booking {
  id: string;
  user_id: string;
  restaurant_id: string;
  date: string;
  time: string;
  party_size: number;
  status: string;
}

const ReservationManager: React.FC = () => {
  const { user, loading } = useAuth();
  const navigation = useNavigation();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [restaurants, setRestaurants] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (!loading && (!isAuthenticated(user) || !hasRole(user, 'business_owner'))) {
      navigation.navigate('Auth' as never);
    }

    const fetchData = async () => {
      try {
        const { data: restaurantData, error: restaurantError } = await supabase
          .from('restaurants')
          .select('id, name')
          .eq('owner_id', user?.id);
        if (restaurantError) throw new Error('Failed to fetch restaurants');
        setRestaurants(restaurantData || []);

        const restaurantIds = restaurantData?.map((r) => r.id) || [];
        if (restaurantIds.length === 0) return;

        const { data: bookingData, error: bookingError } = await supabase
          .from('bookings')
          .select('id, user_id, restaurant_id, date, time, party_size, status')
          .in('restaurant_id', restaurantIds);
        if (bookingError) throw new Error('Failed to fetch bookings');
        setBookings(bookingData || []);
      } catch (error) {
        console.error('Error:', error);
      }
    };

    if (isAuthenticated(user) && hasRole(user, 'business_owner')) {
      fetchData();
    }
  }, [user, loading, navigation]);

  const updateBookingStatus = async (bookingId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', bookingId);
      if (error) throw new Error('Failed to update booking status');
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status } : b))
      );
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Reservation Manager</Text>
      <FlatList
        data={bookings}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const restaurant = restaurants.find((r) => r.id === item.restaurant_id);
          return (
            <View style={styles.listItem}>
              <Text style={styles.bookingText}>
                {restaurant?.name || 'Unknown'} - {item.date} at {item.time} (
                {item.party_size} people, Status: {item.status})
              </Text>
              <View style={styles.actions}>
                <TouchableOpacity
                  onPress={() => updateBookingStatus(item.id, 'confirmed')}
                  disabled={item.status === 'confirmed'}
                >
                  <Text style={[styles.actionText, styles.confirmText, item.status === 'confirmed' && styles.disabledText]}>
                    Confirm
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => updateBookingStatus(item.id, 'cancelled')}
                  disabled={item.status === 'cancelled'}
                >
                  <Text style={[styles.actionText, styles.cancelText, item.status === 'cancelled' && styles.disabledText]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={<Text style={styles.emptyText}>No bookings found.</Text>}
      />
    </View>
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
  listItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bookingText: {
    flex: 1,
    fontSize: 16,
  },
  actions: {
    flexDirection: 'row',
    marginLeft: 8,
  },
  actionText: {
    fontSize: 16,
    marginHorizontal: 8,
    fontWeight: 'bold',
  },
  confirmText: {
    color: '#28a745',
  },
  cancelText: {
    color: '#dc3545',
  },
  disabledText: {
    color: '#ccc',
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    marginVertical: 16,
  },
});

export default ReservationManager;