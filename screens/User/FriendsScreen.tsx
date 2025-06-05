import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useAuth, isAuthenticated } from '../../auth/useAuth';
import { supabase } from '../../supabase/client';
import { useNavigation } from '@react-navigation/native';

interface Friend {
  id: string;
  email: string;
}

const FriendsScreen: React.FC = () => {
  const { user, loading } = useAuth();
  const navigation = useNavigation();
  const [follows, setFollows] = useState<Friend[]>([]);
  const [followers, setFollowers] = useState<Friend[]>([]);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated(user)) {
      navigation.navigate('Auth' as never);
    }

    const fetchFriends = async () => {
      setFetching(true);
      try {
        // users you follow
        const { data: followsData } = await supabase
          .from('follows')
          .select('id, followed:followed_id (id, email)')
          .eq('follower_id', user?.id);
        setFollows((followsData || []).map((f: any) => ({
          id: f.followed.id,
          email: f.followed.email,
        })));

        // users who follow you
        const { data: followersData } = await supabase
          .from('follows')
          .select('id, follower:follower_id (id, email)')
          .eq('followed_id', user?.id);
        setFollowers((followersData || []).map((f: any) => ({
          id: f.follower.id,
          email: f.follower.email,
        })));
      } catch (error) {
        console.error('Error:', error);
      }
      setFetching(false);
    };

    if (isAuthenticated(user)) {
      fetchFriends();
    }
  }, [user, loading]);

  // Add follower by email (for demo, you can use a modal or prompt for real UX)
  const handleAddFollower = async () => {
    // For demo, prompt for email (replace with a modal or search in production)
    const email = prompt('Enter the email of the user to follow:');
    if (!email) return;
    try {
      // Find user by email
      const { data: users } = await supabase
        .from('user')
        .select('id')
        .eq('email', email)
        .single();
      if (!users) {
        Alert.alert('user not found');
        return;
      }
      // Insert follow
      const { error } = await supabase.from('follows').insert({
        follower_id: user?.id,
        followed_id: users.id,
      });
      if (error) throw error;
      Alert.alert('Success', 'You are now following this user.');
      // Refresh list
      setFollows((prev) => [...prev, { id: users.id, email }]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add follower');
    }
  };

  // Remove follower
  const handleRemoveFollower = async (followedId: string) => {
    try {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user?.id)
        .eq('followed_id', followedId);
      if (error) throw error;
      setFollows((prev) => prev.filter((f) => f.id !== followedId));
      Alert.alert('Removed', 'You have unfollowed this user.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to remove follower');
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
    <View style={styles.container}>
      {/* Following Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.header}>Following</Text>
          <TouchableOpacity style={styles.addButton} onPress={handleAddFollower}>
            <Text style={styles.addButtonText}>+ Follow</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={follows}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.friendRow}>
              <Text style={styles.item}>{item.email}</Text>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemoveFollower(item.id)}
              >
                <Text style={styles.removeButtonText}>Unfollow</Text>
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.empty}>You are not following anyone.</Text>}
        />
      </View>

      {/* Divider */}
      <View style={styles.divider}>
        <Text style={styles.dividerText}>──  Friends & Followers  ──</Text>
      </View>

      {/* Followers Section */}
      <View style={styles.section}>
        <Text style={styles.header}>Followers</Text>
        <FlatList
          data={followers}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.friendRow}>
              <Text style={styles.item}>{item.email}</Text>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No one is following you yet.</Text>}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  header: { fontSize: 22, fontWeight: 'bold' },
  friendRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderColor: '#eee' },
  item: { fontSize: 16 },
  addButton: { backgroundColor: '#007bff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  addButtonText: { color: '#fff', fontWeight: 'bold' },
  removeButton: { backgroundColor: '#e57373', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  removeButtonText: { color: '#fff', fontWeight: 'bold' },
  divider: { alignItems: 'center', marginVertical: 8 },
  dividerText: { color: '#aaa', fontSize: 14 },
  empty: { color: '#888', textAlign: 'center', marginVertical: 8 },
});

export default FriendsScreen;