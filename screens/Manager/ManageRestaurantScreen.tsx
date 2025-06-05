import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, FlatList, Alert, ActivityIndicator } from 'react-native';
import { useAuth, isAuthenticated, hasRole } from '../../auth/useAuth';
import { supabase } from '../../supabase/client';
import { useNavigation } from '@react-navigation/native';

interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  location: string;
  owner_id: string;
}

interface Event {
  id: string;
  restaurant_id: string;
  name: string;
  date: string;
  time: string;
  description: string;
}

const ManageRestaurant: React.FC = () => {
  const { user, loading } = useAuth();
  const navigation = useNavigation();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [newRestaurant, setNewRestaurant] = useState({ name: '', cuisine: '', location: '' });
  const [newEvent, setNewEvent] = useState({ restaurantId: '', name: '', date: '', time: '', description: '' });
  const [editingRestaurantId, setEditingRestaurantId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fetching, setFetching] = useState(false);

  const fetchData = async () => {
    setFetching(true);
    try {
      const { data: restaurantData, error: restaurantError } = await supabase
        .from('restaurants')
        .select('id, name, cuisine, location, owner_id')
        .eq('owner_id', user?.id);
      if (restaurantError) throw new Error('Failed to fetch restaurants');
      setRestaurants(restaurantData || []);

      const restaurantIds = restaurantData?.map((r) => r.id) || [];
      if (restaurantIds.length > 0) {
        const { data: eventData, error: eventError } = await supabase
          .from('events')
          .select('id, restaurant_id, name, date, time, description')
          .in('restaurant_id', restaurantIds);
        if (eventError) throw new Error('Failed to fetch events');
        setEvents(eventData || []);
      } else {
        setEvents([]);
      }
    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch data');
    }
    setFetching(false);
  };

  useEffect(() => {
    if (!loading && (!isAuthenticated(user) || !hasRole(user, 'business_owner'))) {
      navigation.navigate('Auth' as never);
    }
    if (isAuthenticated(user) && hasRole(user, 'business_owner')) {
      fetchData();
    }
  }, [user, loading, navigation]);

  const handleAddOrUpdateRestaurant = async () => {
    setError(null);
    try {
      if (editingRestaurantId) {
        const { error } = await supabase
          .from('restaurants')
          .update(newRestaurant)
          .eq('id', editingRestaurantId)
          .eq('owner_id', user?.id);
        if (error) throw new Error('Failed to update restaurant');
        setEditingRestaurantId(null);
      } else {
        const { error } = await supabase.from('restaurants').insert({
          ...newRestaurant,
          owner_id: user?.id,
        });
        if (error) throw new Error('Failed to add restaurant');
      }
      setNewRestaurant({ name: '', cuisine: '', location: '' });
      fetchData();
    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : 'Failed to save restaurant');
    }
  };

  const handleEditRestaurant = (restaurant: Restaurant) => {
    if (restaurant.owner_id !== user?.id) {
      setError('You can only edit your own restaurants');
      return;
    }
    setEditingRestaurantId(restaurant.id);
    setNewRestaurant({ name: restaurant.name, cuisine: restaurant.cuisine, location: restaurant.location });
  };

  const handleDeleteRestaurant = async (id: string) => {
    try {
      const { error } = await supabase
        .from('restaurants')
        .delete()
        .eq('id', id)
        .eq('owner_id', user?.id);
      if (error) throw new Error('Failed to delete restaurant');
      fetchData();
    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete restaurant');
    }
  };

  const handleAddEvent = async () => {
    setError(null);
    try {
      const { restaurantId, name, date, time, description } = newEvent;
      if (!restaurants.find((r) => r.id === restaurantId)) {
        throw new Error('You can only add events for your own restaurants');
      }
      const { error } = await supabase.from('events').insert({
        restaurant_id: restaurantId,
        name,
        date,
        time,
        description,
      });
      if (error) throw new Error('Failed to add event');
      setNewEvent({ restaurantId: '', name: '', date: '', time: '', description: '' });
      fetchData();
    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : 'Failed to add event');
    }
  };

  if (loading || fetching) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Manage Restaurants</Text>
      {error && <Text style={styles.error}>{error}</Text>}

      {/* Restaurant Form */}
      <Text style={styles.sectionTitle}>
        {editingRestaurantId ? 'Edit Restaurant' : 'Add Restaurant'}
      </Text>
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Name"
          value={newRestaurant.name}
          onChangeText={(text) => setNewRestaurant({ ...newRestaurant, name: text })}
        />
        <TextInput
          style={styles.input}
          placeholder="Cuisine"
          value={newRestaurant.cuisine}
          onChangeText={(text) => setNewRestaurant({ ...newRestaurant, cuisine: text })}
        />
        <TextInput
          style={styles.input}
          placeholder="Location"
          value={newRestaurant.location}
          onChangeText={(text) => setNewRestaurant({ ...newRestaurant, location: text })}
        />
        <TouchableOpacity style={styles.button} onPress={handleAddOrUpdateRestaurant}>
          <Text style={styles.buttonText}>
            {editingRestaurantId ? 'Update Restaurant' : 'Add Restaurant'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Event Form */}
      <Text style={styles.sectionTitle}>Add Event</Text>
      <View style={styles.form}>
        <Text style={styles.label}>Restaurant</Text>
        <ScrollView horizontal style={{ marginBottom: 8 }}>
          {restaurants.map((restaurant) => (
            <TouchableOpacity
              key={restaurant.id}
              style={[
                styles.restaurantSelect,
                newEvent.restaurantId === restaurant.id && styles.restaurantSelectActive,
              ]}
              onPress={() => setNewEvent({ ...newEvent, restaurantId: restaurant.id })}
            >
              <Text>{restaurant.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <TextInput
          style={styles.input}
          placeholder="Event Name"
          value={newEvent.name}
          onChangeText={(text) => setNewEvent({ ...newEvent, name: text })}
        />
        <TextInput
          style={styles.input}
          placeholder="Date (YYYY-MM-DD)"
          value={newEvent.date}
          onChangeText={(text) => setNewEvent({ ...newEvent, date: text })}
        />
        <TextInput
          style={styles.input}
          placeholder="Time (HH:MM)"
          value={newEvent.time}
          onChangeText={(text) => setNewEvent({ ...newEvent, time: text })}
        />
        <TextInput
          style={[styles.input, { height: 60 }]}
          placeholder="Description"
          value={newEvent.description}
          onChangeText={(text) => setNewEvent({ ...newEvent, description: text })}
          multiline
        />
        <TouchableOpacity style={styles.button} onPress={handleAddEvent}>
          <Text style={styles.buttonText}>Add Event</Text>
        </TouchableOpacity>
      </View>

      {/* Restaurant List */}
      <Text style={styles.sectionTitle}>Your Restaurants</Text>
      <FlatList
        data={restaurants}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.listItem}>
            <Text>
              {item.name} - {item.cuisine} ({item.location})
            </Text>
            <View style={styles.listActions}>
              <TouchableOpacity onPress={() => handleEditRestaurant(item)}>
                <Text style={styles.editText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDeleteRestaurant(item.id)}>
                <Text style={styles.deleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No restaurants found.</Text>}
      />

      {/* Event List */}
      <Text style={styles.sectionTitle}>Your Events</Text>
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const restaurant = restaurants.find((r) => r.id === item.restaurant_id);
          return (
            <View style={styles.listItem}>
              <Text>
                {item.name} at {restaurant?.name || 'Unknown'} - {item.date} {item.time}: {item.description}
              </Text>
            </View>
          );
        }}
        ListEmptyComponent={<Text style={styles.emptyText}>No events found.</Text>}
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 24,
    marginBottom: 8,
  },
  form: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 10,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    marginBottom: 8,
  },
  button: {
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  error: {
    color: 'red',
    marginBottom: 12,
    textAlign: 'center',
  },
  restaurantSelect: {
    padding: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    marginRight: 8,
    backgroundColor: '#f9f9f9',
  },
  restaurantSelectActive: {
    backgroundColor: '#cce5ff',
    borderColor: '#007bff',
  },
  listItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editText: {
    color: '#007bff',
    marginRight: 16,
  },
  deleteText: {
    color: '#dc3545',
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    marginVertical: 8,
  },
});

export default ManageRestaurant;
