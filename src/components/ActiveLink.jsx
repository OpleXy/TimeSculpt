import { useLocation, Link } from 'react-router-dom';

// This component wraps React Router's Link and adds active class when the current path matches
function ActiveLink({ to, children, className, exact = false, ...props }) {
  const location = useLocation();
  
  // Determine if the link is active
  const isActive = exact 

  
    ? location.pathname === to 
    : location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
  
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