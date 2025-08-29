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