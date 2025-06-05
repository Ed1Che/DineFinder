import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useAuth, isAuthenticated } from '../../auth/useAuth';
import { useNavigation } from '@react-navigation/native';

const Profile: React.FC = () => {
  const { user, profile, loading, updateProfile } = useAuth();
  const navigation = useNavigation();
  const [fullName, setFullName] = useState(profile?.username || '');
  const [preferences, setPreferences] = useState<string[]>(profile?.preferences || []);

  const handleUpdateProfile = async () => {
    const { success, error } = await updateProfile({ username: fullName, preferences });
    if (!success) Alert.alert('Error', error);
    else Alert.alert('Success', 'Profile updated!');
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
      <View style={styles.form}>
        <Text style={styles.header}>Profile</Text>
        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={styles.input}
          value={fullName}
          onChangeText={setFullName}
          placeholder="Full Name"
        />
        <Text style={styles.label}>Preferences (comma separated)</Text>
        <TextInput
          style={styles.input}
          value={preferences.join(', ')}
          onChangeText={(text) => setPreferences(text.split(',').map((p) => p.trim()))}
          placeholder="e.g. Italian, Vegan"
        />
        <TouchableOpacity style={styles.button} onPress={handleUpdateProfile}>
          <Text style={styles.buttonText}>Update Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Navigation buttons to new screens */}
      <TouchableOpacity
        style={styles.navButton}
        onPress={() => navigation.navigate('FriendsScreen' as never)}
      >
        <Text style={styles.navButtonText}>View Friends</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.navButton}
        onPress={() => navigation.navigate('PostsScreen' as never)}
      >
        <Text style={styles.navButtonText}>View Posts</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.navButton}
        onPress={() => navigation.navigate('ReviewsScreen' as never)}
      >
        <Text style={styles.navButtonText}>View Reviews</Text>
      </TouchableOpacity>
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
  form: {
    marginBottom: 24,
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 8,
  },
  label: {
    fontSize: 16,
    marginBottom: 4,
    fontWeight: '500',
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
  navButton: {
    backgroundColor: '#e0e0e0',
    padding: 14,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 12,
  },
  navButtonText: {
    color: '#007bff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default Profile;