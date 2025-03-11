import { useEffect, useState } from 'react';
import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = () => {
  const { user, verifyAuth } = useAuth();
  const [isVerified, setIsVerified] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const isAuthenticated = await verifyAuth();
      if (!isAuthenticated) navigate('/auth');
      setIsVerified(true);
    };

    if (!user) checkAuth();
    else setIsVerified(true);
  }, [user, verifyAuth, navigate]);

  if (!isVerified) return <div className="loading">Verifying session...</div>;

  return user ? <Outlet /> : <Navigate to="/auth" replace />;
};

export default ProtectedRoute;