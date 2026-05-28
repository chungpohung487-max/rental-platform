// 享租 Oink! design tokens — matches the web app's globals.css
export const Colors = {
  // Brand
  pink500: '#EC6788',
  pink600: '#D54B70',
  pink700: '#B33458',
  pink100: '#FFE4EA',
  pink50:  '#FFF5F7',
  pink200: '#FFC9D6',

  // Warm ink neutrals
  ink900: '#1F1A1C',
  ink700: '#4A3F44',
  ink500: '#8C7D83',
  ink400: '#B0A3A8',
  ink300: '#D2C8CC',
  ink200: '#E8E1E3',
  ink100: '#F4EFF0',
  ink50:  '#FBF8F8',

  // Semantic
  success: '#2F9460',
  warning: '#D98C2A',
  danger:  '#D14343',

  // Category
  catSky:      '#A8D0E6',
  catLeaf:     '#9BC68A',
  catCream:    '#FBE7B6',
  catLavender: '#C7B3DE',
  catClay:     '#D49880',

  white: '#FFFFFF',
  black: '#000000',
};

// Shadows (warm pink-tinted)
export const Shadows = {
  sm: {
    shadowColor: '#4C1426',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  md: {
    shadowColor: '#4C1426',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
  lg: {
    shadowColor: '#4C1426',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.10,
    shadowRadius: 32,
    elevation: 16,
  },
  brand: {
    shadowColor: '#EC6788',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.32,
    shadowRadius: 20,
    elevation: 10,
  },
};
