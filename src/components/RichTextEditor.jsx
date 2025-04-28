import { useRef, useEffect } from 'react';

function RichTextEditor({ value, onChange, placeholder, minHeight = '80px' }) {
  const editorRef = useRef(null);
  
  // Initialize the editor with the current value
  useEffect(() => {
    if (editorRef.current) {
      // Only set content if different to avoid cursor jumping
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value;
      }
    }
  }, [value]);

  // Handle content changes
  const handleContentChange = () => {
    if (editorRef.current) {
      // Get content from editor
      let content = editorRef.current.innerHTML;
      
      // Update content via the onChange callback
      onChange(content);
    }
  };

  // Handle formatting commands
  const formatText = (command, value = null) => {
    document.execCommand(command, false, value);
    handleContentChange();
    // Focus back on the editor after command execution
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  // Handle pasting as plain text
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const handlePaste = (e) => {
      // Prevent the default paste behavior
      e.preventDefault();
      
      // Get plain text from clipboard
      const text = e.clipboardData.getData('text/plain');
      
      // Insert text at cursor position
      document.execCommand('insertText', false, text);
    };

    editor.addEventListener('paste', handlePaste);
    
    return () => {
      editor.removeEventListener('paste', handlePaste);
    };
  }, []);

  return (
    <div className="rich-text-editor">
      {/* Formatting toolbar - Always visible */}
      <div className="editor-toolbar active">
        <button 
          type="button"
          onClick={() => formatText('bold')}
          className="format-btn"
          title="Bold"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="14" 
            height="14" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
            <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
          </svg>
        </button>
        
        <button 
          type="button"
          onClick={() => formatText('italic')}
          className="format-btn"
          title="Italic"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="14" 
            height="14" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <line x1="19" y1="4" x2="10" y2="4"></line>
            <line x1="14" y1="20" x2="5" y2="20"></line>
            <line x1="15" y1="4" x2="9" y2="20"></line>
          </svg>
        </button>
        
        <button 
          type="button"
          onClick={() => formatText('underline')}
          className="format-btn"
          title="Underline"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="14" 
            height="14" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"></path>
            <line x1="4" y1="21" x2="20" y2="21"></line>
          </svg>
        </button>
        
        <button 
          type="button"
          onClick={() => formatText('removeFormat')}
          className="format-btn"
          title="Remove Formatting"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="14" 
            height="14" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <line x1="3" y1="3" x2="21" y2="21"></line>
            <path d="M17 17H8a5 5 0 0 1-5-5V7"></path>
            <path d="M11.5 11.5L16 7"></path>
          </svg>
        </button>
      </div>
      
      {/* The editable content area */}
      <div 
        ref={editorRef}
        className="editor-content"
        contentEditable="true"
        onInput={handleContentChange}
        placeholder={placeholder}
        style={{ minHeight }}
      />
    </div>
  );
}

export default RichTextEditor;