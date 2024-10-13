// Creates a toolbox for text formatting
function createToolbox() {
  const toolbox = document.createElement('div');
  toolbox.className = 'linkedin-formatter-toolbox';
  toolbox.id = 'linkedin-formatter-toolbox';

  const tools = [
    { name: 'Bold', icon: '𝐁', action: makeBold },
    { name: 'Uppercase', icon: 'aA', action: makeUppercase },
    { name: 'Lowercase', icon: 'Aa', action: makeLowercase },
  ];

  tools.forEach(tool => {
    const button = document.createElement('button');
    button.textContent = tool.icon;
    button.title = tool.name;
    button.className = `format-button ${tool.name.toLowerCase()}`;
    button.addEventListener('click', () => applyFormatting(tool.action, button));
    toolbox.appendChild(button);
  });

  toolbox.style.cssText = `
    display: flex;
    align-items: center;
    padding: 5px;
  `;

  return toolbox;
}

// Applies the selected formatting to the text
function applyFormatting(formatFunction, button) {
  const postArea = document.querySelector('.share-box-v2__modal .ql-editor');
  if (!postArea) {
    console.error("Post area not found");
    return;
  }

  const selection = window.getSelection();
  if (selection.rangeCount === 0) return;

  const range = selection.getRangeAt(0);
  const selectedText = range.toString();
  if (!selectedText) {
    console.error("No text selected for formatting");
    return;
  }

  const isSelected = button.classList.contains('selected');
  const newText = isSelected ? revertFormatting(selectedText, formatFunction) : formatFunction(selectedText);

  button.classList.toggle('selected', !isSelected);

  const span = document.createElement('span');
  span.textContent = newText;
  range.deleteContents();
  range.insertNode(span);

  selection.removeAllRanges();
  selection.addRange(range);

  checkCurrentFormatting();
}

// Adds event listeners for the post area
function addPostAreaListener() {
  const postArea = document.querySelector('.share-box-v2__modal .ql-editor');
  if (postArea) {
    ['mouseup', 'keyup', 'input', 'keydown'].forEach(event =>
      postArea.addEventListener(event, checkCurrentFormatting)
    );
    postArea.addEventListener('keydown', handleKeyboardShortcuts);
    checkCurrentFormatting();
  }
}

// Handles keyboard shortcuts for formatting
function handleKeyboardShortcuts(event) {
  if (event.ctrlKey || event.metaKey) {
    switch (event.key.toLowerCase()) {
      case 'b':
        event.preventDefault();
        break;
    }
  }
}

// Checks and updates the current formatting state
function checkCurrentFormatting() {
  const selection = window.getSelection();
  if (selection.rangeCount === 0) return;

  const selectedText = selection.getRangeAt(0).toString().trim();
  document.querySelectorAll('.format-button').forEach(button => {
    const isFormatted = button.classList.contains('bold') &&
      [...selectedText].every(char => {
        const code = char.codePointAt(0);
        return (code >= 0x1D400 && code <= 0x1D433); // Bold A-Z or a-z
      });
    button.classList.toggle('selected', isFormatted);
  });
}

// Reverts the formatting applied to the text
function revertFormatting(text, formatFunction) {
  if (formatFunction === makeBold) {
    return [...text].map(char => {
      const code = char.codePointAt(0);
      if (code >= 0x1D400 && code <= 0x1D419) return String.fromCharCode(code - 0x1D400 + 0x41); // Uppercase
      if (code >= 0x1D41A && code <= 0x1D433) return String.fromCharCode(code - 0x1D41A + 0x61); // Lowercase
      return char;
    }).join('');
  }
  return text;
}

// Formats text as bold
function makeBold(text) {
  return getStyledUnicode(text, 0x1D400 - 0x41, 0x1D41A - 0x61);
}

// Formats text as uppercase
function makeUppercase(text) {
  return text.toUpperCase();
}

// Formats text as lowercase
function makeLowercase(text) {
  return text.toLowerCase();
}

// Converts text into Unicode styled text
function getStyledUnicode(text, uppercaseOffset, lowercaseOffset) {
  return text.split('').map(char => {
    const code = char.charCodeAt(0);
    const offset = (code >= 65 && code <= 90) ? uppercaseOffset : (code >= 97 && code <= 122 ? lowercaseOffset : 0);
    return offset ? String.fromCodePoint(code + offset) : char;
  }).join('');
}

// Adds the toolbox to the modal
function addToolbox() {
  const modal = document.querySelector('.share-box-v2__modal');
  if (modal) {
    const postArea = modal.querySelector('.ql-container');
    if (postArea && !document.getElementById('linkedin-formatter-toolbox')) {
      const toolbox = createToolbox();
      postArea.parentNode.insertBefore(toolbox, postArea);
      addPostAreaListener();
    }
  }
}

// Removes the toolbox if present
function removeToolbox() {
  const toolbox = document.getElementById('linkedin-formatter-toolbox');
  if (toolbox) toolbox.remove();
}

// Watches for DOM changes to add/remove toolbox
const observer = new MutationObserver(mutations => {
  mutations.forEach(mutation => {
    if (mutation.type === 'childList') {
      const modal = document.querySelector('.share-box-v2__modal');
      if (modal && window.getComputedStyle(modal).display !== 'none') {
        addToolbox();
      } else {
        removeToolbox();
      }
    }
  });
});

observer.observe(document.body, { childList: true, subtree: true });
