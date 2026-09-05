import React from 'react';
import { AuthPage } from './AuthPage';

interface LoginPageProps {
  onNavigate: (page: string, params?: Record<string, any>) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  return <AuthPage onNavigate={onNavigate} initialMode="login" />;
};
