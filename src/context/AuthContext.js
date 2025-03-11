import { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const verifyAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return false;
  
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/auth/verify`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setUser({
        id: res.data.id,
        firstName: res.data.firstName || res.data.email?.split('@')[0] || 'User',
        lastName: res.data.lastName || '',
        email: res.data.email
      });
      return true;
    } catch (err) {
      localStorage.removeItem('token');
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    navigate('/auth');
  };

  return (
    <AuthContext.Provider value={{ user, verifyAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);