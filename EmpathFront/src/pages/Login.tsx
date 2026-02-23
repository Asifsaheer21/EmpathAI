import { useNavigate } from 'react-router-dom';
import { LoginForm } from '@/components/auth/LoginForm';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

export default function Login() {
  const navigate = useNavigate();
  const { isAuthenticated, loginWithGoogle } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleGoogleLogin = () => {
    // In production, this would trigger Google OAuth flow
    // For now, show a message that backend needs to handle this
    console.log('Google OAuth would be triggered here');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <LoginForm onGoogleLogin={handleGoogleLogin} />
    </div>
  );
}
