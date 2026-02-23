import { useNavigate } from 'react-router-dom';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

export default function Register() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleGoogleLogin = () => {
    console.log('Google OAuth would be triggered here');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <RegisterForm onGoogleLogin={handleGoogleLogin} />
    </div>
  );
}
