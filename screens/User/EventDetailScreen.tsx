import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth, isAuthenticated } from '../../auth/useAuth';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { supabase } from '../../supabase/client';

interface Booking {
  id: string;
  restaurant_id: string;
  customer_id: string;
  reservation_time: string;
  party_size: number;
  status: string;
  created_at?: string;
  updated_at?: string;
}

type RootStackParamList = {
  EventDetails: { id: string };
};

const EventDetails: React.FC = () => {
  const { user, loading } = useAuth();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'EventDetails'>>();
  const { id } = route.params;
  const [booking, setBooking] = useState<Booking | null>(null);

  useEffect(() => {
    if (!loading && !isAuthenticated(user)) {
      navigation.navigate('Auth' as never);
    }

    const fetchBooking = async () => {
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select('id, restaurant_id, customer_id, reservation_time, party_size, status, created_at, updated_at')
          .eq('id', id)
          .eq('customer_id', user?.id)
          .single();
        if (error) throw new Error('Failed to fetch booking');
        setBooking(data);
      } catch (error) {
        console.error('Error:', error);
      }
    };

    if (isAuthenticated(user)) {
      fetchBooking();
    }
  }, [user, loading, id, navigation]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text>Loading...</Text>
      </View>
    );
  }
  if (!booking) {
    return (
      <View style={styles.centered}>
        <Text>Booking not found</Text>
      </View>
    );
  }

  // Format reservation_time for display
  const reservationDate = booking.reservation_time
    ? new Date(booking.reservation_time).toLocaleDateString()
    : '';
  const reservationTime = booking.reservation_time
    ? new Date(booking.reservation_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Event Details</Text>
      <Text style={styles.detail}><Text style={styles.label}>Restaurant ID:</Text> {booking.restaurant_id}</Text>
      <Text style={styles.detail}><Text style={styles.label}>Date:</Text> {reservationDate}</Text>
      <Text style={styles.detail}><Text style={styles.label}>Time:</Text> {reservationTime}</Text>
      <Text style={styles.detail}><Text style={styles.label}>Party Size:</Text> {booking.party_size}</Text>
      <Text style={styles.detail}><Text style={styles.label}>Status:</Text> {booking.status}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff',
    maxWidth: 400,
    alignSelf: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  detail: {
    fontSize: 18,
    marginBottom: 10,
  },
  label: {
    fontWeight: 'bold',
  },
});

export default EventDetails;