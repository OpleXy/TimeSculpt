import { useState } from 'react';

const ExpandableMenu = ({ title, children, defaultExpanded = false }) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="expandable-menu">
      <button 
        className={`expandable-header ${isExpanded ? 'expanded' : ''}`}
        onClick={toggleExpand}
        type="button"
        aria-expanded={isExpanded}
      >
        <span className={`expandable-icon ${isExpanded ? 'expanded' : ''}`}>
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
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </span>
        {title}
      </button>
      
      {isExpanded && (
        <div className="expandable-content">
          {children}
        </div>
      )}
    </div>
  );
};

export default ExpandableMenu;