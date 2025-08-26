import { useRef, useEffect } from 'react';
import '../styles/EventContextMenu.css';

function EventContextMenu({ 
  position, 
  onEdit, 
  onDelete, 
  onClose,
  event 
}) {
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };

    // Close on escape key
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // Position menu within viewport bounds
  const getMenuStyle = () => {
    if (!menuRef.current) return { left: position.x, top: position.y };

    const menu = menuRef.current;
    const rect = menu.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    let left = position.x;
    let top = position.y;

    // Adjust horizontal position if menu would overflow
    if (left + rect.width > viewport.width) {
      left = viewport.width - rect.width - 10;
    }

    // Adjust vertical position if menu would overflow
    if (top + rect.height > viewport.height) {
      top = position.y - rect.height;
    }

    // Ensure menu doesn't go off-screen
    left = Math.max(10, left);
    top = Math.max(10, top);

    return { left, top };
  };

  const handleEdit = () => {
    onEdit(event);
    onClose();
  };

  const handleDelete = () => {
    onDelete(event);
    onClose();
  };

  return (
    <div 
      ref={menuRef}
      className="event-context-menu"
      style={getMenuStyle()}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="context-menu-header">
        <span className="context-menu-title">
          {event.title || 'Hendelse'}
        </span>
      </div>
      
      <div className="context-menu-divider"></div>
      
      <button 
        className="context-menu-item edit-item"
        onClick={handleEdit}
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <path d="M20 14.66V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5.34"/>
          <polygon points="18 2 22 6 12 16 8 16 8 12 18 2"/>
        </svg>
        Rediger hendelse
      </button>
      
      <button 
        className="context-menu-item delete-item"
        onClick={handleDelete}
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          <line x1="10" y1="11" x2="10" y2="17"/>
          <line x1="14" y1="11" x2="14" y2="17"/>
        </svg>
        Slett hendelse
      </button>
    </div>
  );
}

export default EventContextMenu;