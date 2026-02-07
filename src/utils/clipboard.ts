/**
 * Copy text to clipboard with fallback for environments where Clipboard API is blocked
 * @param text - Text to copy
 * @returns Promise that resolves to true if successful, false otherwise
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  // Try modern Clipboard API first
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn('Clipboard API failed, trying fallback method:', err);
      // Fall through to fallback method
    }
  }

  // Fallback method using deprecated execCommand (still works in most browsers)
  try {
    // Create a temporary textarea element
    const textarea = document.createElement('textarea');
    textarea.value = text;
    
    // Make it invisible and non-interactive
    textarea.style.position = 'fixed';
    textarea.style.left = '-999999px';
    textarea.style.top = '-999999px';
    textarea.setAttribute('readonly', '');
    
    document.body.appendChild(textarea);
    
    // Select the text
    textarea.select();
    textarea.setSelectionRange(0, text.length);
    
    // Copy using execCommand
    const successful = document.execCommand('copy');
    
    // Clean up
    document.body.removeChild(textarea);
    
    if (successful) {
      return true;
    } else {
      console.error('execCommand copy failed');
      return false;
    }
  } catch (err) {
    console.error('Fallback copy method failed:', err);
    return false;
  }
};

/**
 * Check if clipboard is available
 */
export const isClipboardAvailable = (): boolean => {
  return !!(navigator.clipboard && navigator.clipboard.writeText) || 
         document.queryCommandSupported?.('copy');
};
