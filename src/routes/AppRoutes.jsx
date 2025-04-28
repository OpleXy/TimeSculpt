import { Routes, Route, Navigate } from 'react-router-dom';
import App from '../App';
import MineTidslinjer from '../pages/MineTidslinjer';
import Innstillinger from '../pages/Innstillinger';
import MinProfil from '../pages/MinProfil';
import NotFound from '../pages/NotFound';
import AuthCompletion from '../components/auth/AuthCompletion'; // Import the AuthCompletion component
import { AuthProvider } from '../contexts/AuthContext';
import { ThemeProvider } from '../contexts/ThemeContext';

function AppRoutes() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/tidslinjer" element={<MineTidslinjer />} />
          <Route path="/innstillinger" element={<Innstillinger />} />
          <Route path="/profil" element={<MinProfil />} />
          
          {/* Add the auth-complete route to handle email verification links */}
          <Route path="/auth-complete" element={<AuthCompletion />} />
          
          {/* Redirect legacy routes if any */}
          <Route path="/mine-tidslinjer" element={<Navigate to="/tidslinjer" replace />} />
          
          {/* Catch-all route for 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default AppRoutes;