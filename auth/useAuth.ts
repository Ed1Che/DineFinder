import { useContext } from 'react';
import { AuthContext, AuthContextProps } from './AuthProvider';
import { User, Session } from '@supabase/supabase-js';

/**
 * Custom hook to access authentication context for the DineFinder application.
 * Provides user, session, profile, and authentication methods.
 * Throws an error if used outside of an AuthProvider.
 *
 * @returns {AuthContextProps} Authentication context with user, session, profile, and auth methods
 */
export const useAuth = (): AuthContextProps => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};

/**
 * Type guard to check if a user is authenticated
 * @param user - The user object from the auth context
 * @returns {boolean} True if the user is authenticated
 */
export const isAuthenticated = (user: User | null): user is User => {
  return !!user;
};

/**
 * Type guard to check if a user has a specific role
 * @param user - The user object from the auth context
 * @param role - The role to check ('customer' or 'restaurant_owner')
 * @returns {boolean} True if the user has the specified role
 */
export const hasRole = (
  user: User | null,
  role: 'customer' | 'business_owner' | 'admin'
): boolean => {
  return isAuthenticated(user) && user.user_metadata?.role === role;
};

// Re-export types for convenience
export type { AuthContextProps, Profile } from './AuthProvider';
export type { User , Session } from '@supabase/supabase-js';