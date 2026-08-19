import React from 'react';
import { AuthPage } from './AuthPage';

interface SignUpPageProps {
  onNavigate: (page: string, params?: Record<string, any>) => void;
}

export const SignUpPage: React.FC<SignUpPageProps> = ({ onNavigate }) => {
  return <AuthPage onNavigate={onNavigate} initialMode="signup" />;
};
