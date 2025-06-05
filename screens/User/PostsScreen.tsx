import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { useAuth, isAuthenticated } from '../../auth/useAuth';
import { supabase } from '../../supabase/client';
import { useNavigation } from '@react-navigation/native';

interface Post {
  id: string;
  content: string;
  image_url?: string | null;
}

const PostsScreen: React.FC = () => {
  const { user, loading } = useAuth();
  const navigation = useNavigation();
  const [posts, setPosts] = useState<Post[]>([]);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated(user)) {
      navigation.navigate('Auth' as never);
    }

    const fetchPosts = async () => {
      setFetching(true);
      try {
        const { data } = await supabase
          .from('posts')
          .select('id, content, image_url')
          .eq('user_id', user?.id);
        setPosts(data || []);
      } catch (error) {
        console.error('Error:', error);
      }
      setFetching(false);
    };

    if (isAuthenticated(user)) {
      fetchPosts();
    }
  }, [user, loading]); // <-- navigation removed from dependencies

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
      <Text style={styles.header}>My Posts</Text>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.postItem}>
            {item.image_url ? (
              <Image source={{ uri: item.image_url }} style={styles.image} />
            ) : null}
            <Text style={styles.content}>{item.content}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No posts found.</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  postItem: { marginBottom: 16, borderBottomWidth: 1, borderColor: '#eee', paddingBottom: 12 },
  content: { fontSize: 16 },
  image: { width: '100%', height: 180, borderRadius: 8, marginBottom: 8 },
  empty: { color: '#888', textAlign: 'center', marginVertical: 8 },
});

export default PostsScreen;