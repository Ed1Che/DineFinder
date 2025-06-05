import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useAuth, isAuthenticated } from '../../auth/useAuth';
import { supabase } from '../../supabase/client';
import { useNavigation, useroute, RouteProp } from '@react-navigation/native';

interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  location: string;
}

type RootStackParamList = {
  RestaurantDetail: { id: string };
};

const RestaurantDetailScreen: React.FC = () => {
  const { user, loading } = useAuth();
  const navigation = useNavigation();
  const route = useroute<RouteProp<RootStackParamList, 'RestaurantDetail'>>();
  const { id } = route.params;
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [partySize, setPartySize] = useState('1');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated(user)) {
      navigation.navigate('Auth' as never);
    }

    const fetchRestaurant = async () => {
      try {
        const { data, error } = await supabase
          .from('restaurants')
          .select('id, name, cuisine, location')
          .eq('id', id)
          .single();
        if (error) throw new Error('Failed to fetch restaurant');
        setRestaurant(data);
      } catch (error) {
        console.error('Error:', error);
      }
    };

    if (isAuthenticated(user)) {
      fetchRestaurant();
    }
  }, [user, loading, id, navigation]);

  const handleBooking = async () => {
    if (!bookingDate || !bookingTime || !partySize) {
      Alert.alert('Error', 'Please fill in all booking fields.');
      return;
    }
    setSubmitting(true);
    try {
      // Combine date and time into ISO string for reservation_time
      const reservation_time = `${bookingDate}T${bookingTime}:00Z`;
      const { error } = await supabase.from('bookings').insert({
        customer_id: user?.id,
        restaurant_id: id,
        reservation_time,
        party_size: Number(partySize),
      });
      if (error) throw new Error('Failed to create booking');
      setBookingDate('');
      setBookingTime('');
      setPartySize('1');
      Alert.alert('Success', 'Booking created!');
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Failed to create booking');
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text>Loading...</Text>
      </View>
    );
  }
  if (!restaurant) {
    return (
      <View style={styles.centered}>
        <Text>Restaurant not found</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{restaurant.name}</Text>
      <Text style={styles.detail}><Text style={styles.label}>Cuisine:</Text> {restaurant.cuisine}</Text>
      <Text style={styles.detail}><Text style={styles.label}>Location:</Text> {restaurant.location}</Text>

      <View style={styles.form}>
        <Text style={styles.formTitle}>Book a Table</Text>
        <Text style={styles.label}>Date</Text>
        <TextInput
          style={styles.input}
          value={bookingDate}
          onChangeText={setBookingDate}
          placeholder="YYYY-MM-DD"
        />
        <Text style={styles.label}>Time</Text>
        <TextInput
          style={styles.input}
          value={bookingTime}
          onChangeText={setBookingTime}
          placeholder="HH:MM"
        />
        <Text style={styles.label}>Party Size</Text>
        <TextInput
          style={styles.input}
          value={partySize}
          onChangeText={setPartySize}
          keyboardType="numeric"
          placeholder="Number of people"
        />
        <TouchableOpacity style={styles.submitButton} onPress={handleBooking} disabled={submitting}>
          <Text style={styles.submitButtonText}>{submitting ? 'Booking...' : 'Book Now'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#fff',
    flexGrow: 1,
    alignItems: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  detail: {
    fontSize: 18,
    marginBottom: 8,
  },
  label: {
    fontWeight: 'bold',
  },
  form: {
    width: '100%',
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 8,
    marginTop: 24,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 10,
    fontSize: 16,
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  submitButton: {
    backgroundColor: '#007bff',
    padding: 14,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
});

export default RestaurantDetailScreen;