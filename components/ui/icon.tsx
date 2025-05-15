import React from 'react';
import { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { 
  Ionicons, 
  FontAwesome5, 
  MaterialIcons, 
  MaterialCommunityIcons,
  FontAwesome,
  AntDesign,
  Feather
} from '@expo/vector-icons';

// Icon mapping to help transition from Lucide to Expo Vector Icons
const iconMap: Record<string, { family: string; name: string }> = {
  // General UI
  check: { family: 'Ionicons', name: 'checkmark' },
  x: { family: 'Ionicons', name: 'close' },
  chevronDown: { family: 'Ionicons', name: 'chevron-down' },
  chevronUp: { family: 'Ionicons', name: 'chevron-up' },
  chevronLeft: { family: 'Ionicons', name: 'chevron-back' },
  chevronRight: { family: 'Ionicons', name: 'chevron-forward' },
  moreHorizontal: { family: 'Feather', name: 'more-horizontal' },
  
  // Navigation and Actions
  home: { family: 'Ionicons', name: 'home' },
  settings: { family: 'Ionicons', name: 'settings' },
  user: { family: 'FontAwesome5', name: 'user' },
  search: { family: 'Ionicons', name: 'search' },
  plus: { family: 'Ionicons', name: 'add' },
  
  // Communication
  mail: { family: 'Ionicons', name: 'mail' },
  messageCircle: { family: 'Ionicons', name: 'chatbubble' },
  
  // Shopping and Commerce
  shoppingBag: { family: 'FontAwesome5', name: 'shopping-bag' },
  package: { family: 'FontAwesome5', name: 'box' },
  
  // Device and Security
  lock: { family: 'Ionicons', name: 'lock-closed' },
  eye: { family: 'Ionicons', name: 'eye' },
  eyeOff: { family: 'Ionicons', name: 'eye-off' },
  camera: { family: 'Ionicons', name: 'camera' },
  
  // Nature and Weather
  sun: { family: 'Ionicons', name: 'sunny' },
  moon: { family: 'Ionicons', name: 'moon' },
  
  // Buildings and Locations
  building: { family: 'FontAwesome5', name: 'building' },
  building2: { family: 'FontAwesome5', name: 'building' },
  mapPin: { family: 'Ionicons', name: 'location' },
  
  // Accommodation
  bed: { family: 'FontAwesome5', name: 'bed' },
  bath: { family: 'FontAwesome5', name: 'bath' },
  sofa: { family: 'MaterialCommunityIcons', name: 'sofa' },
  
  // Clothing
  shirt: { family: 'MaterialCommunityIcons', name: 'tshirt-crew' },
  
  // Misc
  bell: { family: 'Ionicons', name: 'notifications' },
  heart: { family: 'Ionicons', name: 'heart' },
  star: { family: 'Ionicons', name: 'star' },
  send: { family: 'Ionicons', name: 'send' },
  share2: { family: 'Ionicons', name: 'share' },
  trash2: { family: 'Ionicons', name: 'trash' },
  logOut: { family: 'Ionicons', name: 'log-out' },
  upload: { family: 'Ionicons', name: 'cloud-upload' },
  download: { family: 'Ionicons', name: 'cloud-download' },
  arrowLeft: { family: 'Ionicons', name: 'arrow-back' },
  arrowRight: { family: 'Ionicons', name: 'arrow-forward' },
  filter: { family: 'Ionicons', name: 'filter' },
  
  // Commerce categories
  book: { family: 'Ionicons', name: 'book' },
  smartphone: { family: 'Ionicons', name: 'phone-portrait' },
  utensils: { family: 'FontAwesome5', name: 'utensils' },
  briefcase: { family: 'FontAwesome5', name: 'briefcase' },
  
  // Notifications and Status
  checkCircle: { family: 'Ionicons', name: 'checkmark-circle' },
  alertCircle: { family: 'Ionicons', name: 'alert-circle' },
  circle: { family: 'FontAwesome', name: 'circle' },
  clock: { family: 'Ionicons', name: 'time' },
  
  // Miscellaneous
  sparkles: { family: 'Ionicons', name: 'sparkles' },
  panelLeft: { family: 'Feather', name: 'sidebar' },
  users: { family: 'FontAwesome5', name: 'users' },
  calendar: { family: 'Ionicons', name: 'calendar' },
};

interface IconProps {
  name: string;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle | ViewStyle>;
}

export function Icon({ name, size = 24, color = 'black', style }: IconProps) {
  // Convert camelCase to kebab-case for compatibility with Lucide naming
  const kebabName = name.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
  
  // Try to find the icon in our map (try both camelCase and kebab-case)
  const icon = iconMap[name] || iconMap[kebabName] || { family: 'Ionicons', name: 'help-circle' };
  
  switch (icon.family) {
    case 'Ionicons':
      return <Ionicons name={icon.name} size={size} color={color} style={style} />;
    case 'FontAwesome5':
      return <FontAwesome5 name={icon.name} size={size} color={color} style={style} />;
    case 'MaterialIcons':
      return <MaterialIcons name={icon.name} size={size} color={color} style={style} />;
    case 'MaterialCommunityIcons':
      return <MaterialCommunityIcons name={icon.name} size={size} color={color} style={style} />;
    case 'FontAwesome':
      return <FontAwesome name={icon.name} size={size} color={color} style={style} />;
    case 'AntDesign':
      return <AntDesign name={icon.name} size={size} color={color} style={style} />;
    case 'Feather':
      return <Feather name={icon.name} size={size} color={color} style={style} />;
    default:
      return <Ionicons name="help-circle" size={size} color={color} style={style} />;
  }
}

export default Icon; 