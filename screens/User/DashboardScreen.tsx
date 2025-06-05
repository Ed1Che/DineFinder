import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useAuth, isAuthenticated } from '../../auth/useAuth';
import { useNavigation } from '@react-navigation/native';

const Dashboard: React.FC = () => {
  const { user, loading } = useAuth();
  const navigation = useNavigation<any>(); // If you're using TypeScript + stack types, replace `any` with proper typing

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
      <Text style={styles.header}>Customer Dashboard</Text>

      {/* 🔗 Navigation Links as Cards */}
      <View style={styles.cardLinks}>
        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Profile')}>
          <Text style={styles.cardTitle}>Profile</Text>
          <Text style={styles.cardDesc}>View and edit your profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('EventDetails', { id: '1' })}>
          <Text style={styles.cardTitle}>Booking Details</Text>
          <Text style={styles.cardDesc}>See your booking details</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Restaurant', { id: '1' })}>
          <Text style={styles.cardTitle}>Restaurants</Text>
          <Text style={styles.cardDesc}>Browse and book restaurants</Text>
        </TouchableOpacity>
      </View>
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
  cardLinks: {
    marginBottom: 24,
    paddingHorizontal: 10,
    flexDirection: 'column',
    gap: 16,
  },
  card: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 18,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e90ff',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 14,
    color: '#555',
  },
});

export default Dashboard;
