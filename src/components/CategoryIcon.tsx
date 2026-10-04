import React from 'react';
import {
  Utensils,
  Home,
  ShoppingBag,
  Car,
  Film,
  Zap,
  HeartPulse,
  GraduationCap,
  Package,
  BadgeDollarSign,
  TrendingUp,
  ShieldCheck,
  Plane,
  Target,
  Gem,
  Baby,
  Compass,
  Building2,
  CreditCard,
  Landmark,
  Banknote,
  Coins,
  Receipt,
  LucideIcon,
} from 'lucide-react';
import { Category } from '../types';

interface CategoryIconProps {
  category?: Category | string;
  iconName?: string;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showBackground?: boolean;
  color?: string;
}

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  'Food & Dining': Utensils,
  'Housing & Rent': Home,
  'Shopping': ShoppingBag,
  'Transportation': Car,
  'Entertainment': Film,
  'Bills & Utilities': Zap,
  'Health & Medical': HeartPulse,
  'Education': GraduationCap,
  'Salary & Income': BadgeDollarSign,
  'Other': Package,
};

const ICON_NAME_MAP: Record<string, LucideIcon> = {
  Utensils,
  Home,
  ShoppingBag,
  Car,
  Film,
  Zap,
  HeartPulse,
  GraduationCap,
  MoreHorizontal: Package,
  Package,
  BadgeDollarSign,
  TrendingUp,
  ShieldCheck,
  Plane,
  Target,
  Gem,
  Baby,
  Compass,
  Building2,
  CreditCard,
  Landmark,
  Banknote,
  Coins,
  Receipt,
  // Fallbacks for previous emoji characters if passed dynamically
  '🍕': Utensils,
  '🏠': Home,
  '🛍️': ShoppingBag,
  '🚗': Car,
  '🎮': Film,
  '⚡': Zap,
  '💊': HeartPulse,
  '📚': GraduationCap,
  '📦': Package,
  '💵': BadgeDollarSign,
  '🏦': Building2,
  '💳': CreditCard,
  '🏛️': Landmark,
  '🛡️': ShieldCheck,
  '✈️': Plane,
  '🚙': Car,
  '🏡': Home,
  '🎓': GraduationCap,
  '🌴': Compass,
  '🎯': Target,
  '💍': Gem,
  '👶': Baby,
};

const SIZE_MAP = {
  xs: 'w-3 h-3',
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
  xl: 'w-6 h-6',
};

const CONTAINER_SIZE_MAP = {
  xs: 'w-5 h-5',
  sm: 'w-7 h-7',
  md: 'w-9 h-9',
  lg: 'w-11 h-11',
  xl: 'w-13 h-13',
};

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  category = 'Other',
  iconName,
  className = '',
  size = 'md',
  showBackground = false,
  color,
}) => {
  let IconComponent = Package;

  if (iconName && ICON_NAME_MAP[iconName]) {
    IconComponent = ICON_NAME_MAP[iconName];
  } else if (CATEGORY_ICONS[category]) {
    IconComponent = CATEGORY_ICONS[category];
  } else if (ICON_NAME_MAP[category]) {
    IconComponent = ICON_NAME_MAP[category];
  }

  const iconClasses = `${SIZE_MAP[size]} shrink-0`;

  if (showBackground) {
    const containerClasses = `${CONTAINER_SIZE_MAP[size]} rounded-xl flex items-center justify-center shrink-0 transition-transform ${className}`;
    const bgStyle = color ? { backgroundColor: `${color}18`, color: color } : undefined;

    return (
      <div
        className={`${containerClasses} ${!color ? 'bg-slate-100 text-slate-700' : ''}`}
        style={bgStyle}
        aria-hidden="true"
      >
        <IconComponent className={iconClasses} />
      </div>
    );
  }

  return <IconComponent className={`${iconClasses} ${className}`} aria-hidden="true" />;
};

export const MilestoneIcon: React.FC<{
  iconKey?: string;
  category?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ iconKey, category, size = 'md', className = '' }) => {
  let Icon = Target;

  const key = iconKey || category || '';
  if (key.includes('Safety') || key.includes('🛡️') || key.includes('Emergency') || key === 'ShieldCheck') {
    Icon = ShieldCheck;
  } else if (key.includes('Vacation') || key.includes('✈️') || key.includes('Travel') || key === 'Plane') {
    Icon = Plane;
  } else if (key.includes('Vehicle') || key.includes('🚙') || key.includes('🚗') || key.includes('Car') || key === 'Car') {
    Icon = Car;
  } else if (key.includes('Home') || key.includes('🏡') || key.includes('House') || key === 'Home') {
    Icon = Home;
  } else if (key.includes('Education') || key.includes('🎓') || key.includes('College') || key === 'GraduationCap') {
    Icon = GraduationCap;
  } else if (key.includes('Freedom') || key.includes('🌴') || key.includes('Retirement') || key === 'Compass') {
    Icon = Compass;
  } else if (key.includes('Wedding') || key.includes('💍') || key === 'Gem') {
    Icon = Gem;
  } else if (key.includes('Baby') || key.includes('👶') || key === 'Baby') {
    Icon = Baby;
  }

  const sizeClass = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5';

  return <Icon className={`${sizeClass} ${className}`} aria-hidden="true" />;
};

export const BankIcon: React.FC<{
  logoKey?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}> = ({ logoKey, className = '', size = 'md' }) => {
  let Icon = Building2;
  const key = (logoKey || '').toLowerCase();

  if (key.includes('card') || key.includes('chase') || key.includes('credit')) {
    Icon = CreditCard;
  } else if (key.includes('state') || key.includes('sbi') || key.includes('landmark') || key.includes('central')) {
    Icon = Landmark;
  } else if (key.includes('cash') || key.includes('pocket')) {
    Icon = Banknote;
  }

  const sizeClass = size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4';

  return <Icon className={`${sizeClass} ${className}`} aria-hidden="true" />;
};
