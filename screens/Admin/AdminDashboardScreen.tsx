import React, { useEffect, useState } from 'react';
import { SafeAreaView, View, Text, FlatList, StyleSheet } from 'react-native';
import { useAuth, isAuthenticated, hasRole } from '../../auth/useAuth';
import { supabase } from '../../supabase/client';
import { useNavigation } from '@react-navigation/native';

interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  location: string;
}

interface user {
  id: string;
  email: string;
  role: string;
}

const Admin: React.FC = () => {
  const { user, loading } = useAuth();
  const navigation = useNavigation();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [users, setusers] = useState<user[]>([]);

  useEffect(() => {
    if (!loading && (!isAuthenticated(user) || !hasRole(user, 'admin'))) {
      navigation.navigate('Auth' as never);
    }

    const fetchData = async () => {
      try {
        const { data: restaurantData, error: restaurantError } = await supabase
          .from('restaurants')
          .select('id, name, cuisine, location');
        if (restaurantError) throw new Error('Failed to fetch restaurants');
        setRestaurants(restaurantData || []);

        const { data: userData, error: userError } = await supabase
          .from('user')
          .select('id, email, role');
        if (userError) throw new Error('Failed to fetch users');
        setusers(userData || []);
      } catch (error) {
        console.error('Error:', error);
      }
    };

    if (isAuthenticated(user) && hasRole(user, 'admin')) {
      fetchData();
    }
  }, [user, loading, navigation]);

  if (loading) return <Text style={styles.loading}>Loading...</Text>;

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Admin Dashboard</Text>

      <Text style={styles.sectionTitle}>Restaurants</Text>
      <FlatList
        data={restaurants}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.listItem}>
            <Text>{item.name} - {item.cuisine} ({item.location})</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No restaurants found.</Text>}
        showsVerticalScrollIndicator={false}
      />

      <Text style={styles.sectionTitle}>users</Text>
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.listItem}>
            <Text>{item.email} - {item.role}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No users found.</Text>}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    marginVertical: 16,
  },
  listItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },
  emptyText: {
    textAlign: 'center',
    padding: 16,
    color: '#888',
  },
  loading: {
    textAlign: 'center',
    marginTop: 32,
  },
});

export default Admin;
