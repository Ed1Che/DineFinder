import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, FlatList } from 'react-native';
import { useAuth, isAuthenticated } from '../../auth/useAuth';
import { supabase } from '../../supabase/client';
import { useNavigation } from '@react-navigation/native';

interface Restaurant {
  id: string;
  name: string;
  description?: string | null;
  address: string;
  latitude: number;
  longitude: number;
}

const RestaurantScreen: React.FC = () => {
  const { user, loading } = useAuth();
  const navigation = useNavigation();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [fetching, setFetching] = useState(false);

  // Redirect unauthenticated users
  useEffect(() => {
    if (!loading && !isAuthenticated(user)) {
      navigation.navigate('Auth' as never);
    }
  }, [user, loading]);

  // Memoized fetch function
  const fetchRestaurants = useCallback(async () => {
    setFetching(true);
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('id, name, description, address, latitude, longitude');
      if (error) throw new Error('Failed to fetch restaurants');
      setRestaurants(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setFetching(false);
    }
  }, []);

  // Fetch restaurants only when authenticated
  useEffect(() => {
    if (!loading && isAuthenticated(user)) {
      fetchRestaurants();
    }
  }, [user, loading, fetchRestaurants]);

  if (loading || fetching) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Restaurants</Text>
      <FlatList
        data={restaurants}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.restaurantItem}
            onPress={() => navigation.navigate('RestaurantDetail' as never, { id: item.id } as never)}
          >
            <Text style={styles.restaurantName}>{item.name}</Text>
            {item.description ? (
              <Text style={styles.restaurantDesc}>{item.description}</Text>
            ) : null}
            <Text style={styles.restaurantInfo}>{item.address}</Text>
            <Text style={styles.restaurantInfo}>
              Lat: {item.latitude}, Lng: {item.longitude}
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No restaurants found.</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
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
  restaurantItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  restaurantName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  restaurantDesc: {
    fontSize: 15,
    color: '#666',
    marginBottom: 4,
  },
  restaurantInfo: {
    fontSize: 16,
    color: '#555',
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    marginVertical: 16,
  },
});

export default RestaurantScreen;