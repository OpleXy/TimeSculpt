import { useLocation, Link } from 'react-router-dom';

// This component wraps React Router's Link and adds active class when the current path matches
function ActiveLink({ to, children, className, ...props }) {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link 
      to={to} 
      className={`${className || ''} ${isActive ? 'active' : ''}`} 
      {...props}
    >
      {children}
    </Link>
  );
}

export default ActiveLink;