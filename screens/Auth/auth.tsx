import React, { useState } from 'react';
import { View, Text, TextInput, Button, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '../../auth/useAuth';
import { useNavigation } from '@react-navigation/native';

const Auth: React.FC = () => {
  const { signin, signup } = useAuth();
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'customer' | 'business_owner'>('customer');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    try {
      if (isSignUp) {
        const { success, error } = await signup(email, password, role, fullName);
        if (!success) throw new Error(error);
      } else {
        const { success, error } = await signin(email, password);
        if (!success) throw new Error(error);
      }
      navigation.navigate(role === 'business_owner' ? 'BusinessOwner' : 'Dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
      Alert.alert('Error', err instanceof Error ? err.message : 'Authentication failed');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isSignUp ? 'Sign Up' : 'Sign In'}</Text>
      <View style={styles.formGroup}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="Email"
        />
      </View>
      <View style={styles.formGroup}>
        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="Password"
        />
      </View>
      {isSignUp && (
        <>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Full Name"
            />
          </View>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Role</Text>
            <Picker
              selectedValue={role}
              onValueChange={(itemValue) => setRole(itemValue as 'customer' | 'business_owner')}
              style={styles.picker}
            >
              <Picker.Item label="Customer" value="customer" />
              <Picker.Item label="Restaurant Owner" value="business_owner" />
            </Picker>
          </View>
        </>
      )}
      {error && <Text style={styles.error}>{error}</Text>}
      <Button title={isSignUp ? 'Sign Up' : 'Sign In'} onPress={handleSubmit} />
      <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)}>
        <Text style={styles.switchText}>
          {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  formGroup: {
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
  },
  picker: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    backgroundColor: '#f9f9f9',
  },
  error: {
    color: 'red',
    marginBottom: 12,
    textAlign: 'center',
  },
  switchText: {
    color: '#007bff',
    marginTop: 20,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
});

export default Auth;