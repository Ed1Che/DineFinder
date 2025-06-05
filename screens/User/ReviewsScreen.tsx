import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth, isAuthenticated } from '../../auth/useAuth';
import { supabase } from '../../supabase/client';
import { useNavigation } from '@react-navigation/native';

interface Review {
  id: string;
  restaurant_id: string;
  rating: number;
  comment: string;
}

const ReviewsScreen: React.FC = () => {
  const { user, loading } = useAuth();
  const navigation = useNavigation();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated(user)) {
      navigation.navigate('Auth' as never);
    }

    const fetchReviews = async () => {
      setFetching(true);
      try {
        const { data } = await supabase
          .from('reviews')
          .select('id, restaurant_id, rating, comment')
          .eq('customer_id', user?.id);
        setReviews(data || []);
      } catch (error) {
        console.error('Error:', error);
      }
      setFetching(false);
    };

    if (isAuthenticated(user)) {
      fetchReviews();
    }
  }, [user, loading, navigation]);

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
      <Text style={styles.header}>My Reviews</Text>
      <FlatList
        data={reviews}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.reviewItem}>
            <Text style={styles.rating}>Rating: {item.rating}/5</Text>
            <Text style={styles.comment}>{item.comment}</Text>
            <Text style={styles.restaurantId}>Restaurant ID: {item.restaurant_id}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No reviews found.</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  reviewItem: { marginBottom: 16, borderBottomWidth: 1, borderColor: '#eee', paddingBottom: 12 },
  rating: { fontSize: 16, fontWeight: 'bold' },
  comment: { fontSize: 16 },
  restaurantId: { fontSize: 12, color: '#888', marginTop: 4 },
  empty: { color: '#888', textAlign: 'center', marginVertical: 8 },
});

export default ReviewsScreen;