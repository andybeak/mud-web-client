// Storage key for custom macros
export const STORAGE_KEY = 'mud-custom-macros';

// Default macro configurations
export const defaultMacros = [
  { name: 'Look', command: 'look', category: 'basic' },
  { name: 'Score', command: 'score', category: 'basic' },
  { name: 'Inventory', command: 'inventory', category: 'basic' },
  { name: 'Equipment', command: 'equipment', category: 'basic' },
  { name: 'Who', command: 'who', category: 'social' },
  { name: 'Time', command: 'time', category: 'basic' },
  { name: 'Weather', command: 'weather', category: 'basic' },
  { name: 'Help', command: 'help', category: 'basic' },
  { name: 'Map', command: 'map', category: 'movement' },
  { name: 'Attack', command: 'kill monster', category: 'combat' },
  { name: 'Flee', command: 'flee', category: 'combat' },
  { name: 'Guide', command: 'guide', category: 'basic' },
  { name: 'Home', command: 'home', category: 'movement' }
];

// Categories for organizing macros
export const macroCategories = {
  BASIC: 'basic',
  COMBAT: 'combat',
  SOCIAL: 'social',
  MOVEMENT: 'movement',
  CUSTOM: 'custom'
};

// Window styling configuration
export const windowStyle = {
  title: 'Macro Buttons',
  css: {
    width: '300px',
    height: 'auto',
    top: '100px',
    right: '100px',
    zIndex: 1000,
    'background-color': '#f0f0f0',
    'border-radius': '8px',
    'border': '1px solid #666'
  }
};

// Button styling configuration
export const buttonStyle = {
  normal: {
    background: '#e6955b',
    border: '1px solid #d4844a',
    color: '#fff'
  },
  hover: {
    background: '#d4844a'
  },
  active: {
    background: '#c27339'
  }
}; 