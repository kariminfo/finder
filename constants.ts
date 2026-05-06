import { CategoryDefinition } from './types';

export const CATEGORIES: CategoryDefinition[] = [
  {
    id: 'health',
    label: 'الصحة',
    color: 'bg-rose-100',
    textColor: 'text-rose-700',
    iconName: 'HeartPulse',
    services: [
      { id: 'pharmacy', label: 'صيدلية', osmKey: 'amenity', osmValue: 'pharmacy', iconName: 'Pill' },
      { id: 'hospital', label: 'مستشفى', osmKey: 'amenity', osmValue: 'hospital', iconName: 'Hospital' },
      { id: 'clinic', label: 'عيادة', osmKey: 'amenity', osmValue: 'clinic', iconName: 'Stethoscope' },
      { id: 'dentist', label: 'طبيب أسنان', osmKey: 'amenity', osmValue: 'dentist', iconName: 'Smile' },
    ],
  },
  {
    id: 'finance',
    label: 'المالية',
    color: 'bg-blue-100',
    textColor: 'text-blue-700',
    iconName: 'Banknote',
    services: [
      { id: 'atm', label: 'شباك أوتوماتيكي', osmKey: 'amenity', osmValue: 'atm', iconName: 'CreditCard' },
      { id: 'bank', label: 'بنك', osmKey: 'amenity', osmValue: 'bank', iconName: 'Landmark' },
      { id: 'exchange', label: 'صرف / تحويل', osmKey: 'amenity', osmValue: 'bureau_de_change', iconName: 'ArrowRightLeft' },
    ],
  },
  {
    id: 'religion',
    label: 'الدين',
    color: 'bg-emerald-100',
    textColor: 'text-emerald-700',
    iconName: 'MoonStar',
    services: [
      { id: 'mosque', label: 'مسجد', osmKey: 'amenity', osmValue: 'mosque', iconName: 'Moon' },
    ],
  },
  {
    id: 'food',
    label: 'الطعام والتسوق',
    color: 'bg-orange-100',
    textColor: 'text-orange-700',
    iconName: 'ShoppingBag',
    services: [
      { id: 'cafe', label: 'مقهى', osmKey: 'amenity', osmValue: 'cafe', iconName: 'Coffee' },
      { id: 'restaurant', label: 'مطعم', osmKey: 'amenity', osmValue: 'restaurant', iconName: 'UtensilsCrossed' },
      { id: 'fast_food', label: 'أكل سريع', osmKey: 'amenity', osmValue: 'fast_food', iconName: 'Pizza' },
      { id: 'bakery', label: 'مخبزة', osmKey: 'shop', osmValue: 'bakery', iconName: 'Croissant' },
      { id: 'supermarket', label: 'سوبر ماركت', osmKey: 'shop', osmValue: 'supermarket', iconName: 'ShoppingBasket' },
      { id: 'electronics', label: 'إلكترونيات', osmKey: 'shop', osmValue: 'electronics', iconName: 'Monitor' },
      { id: 'clothes', label: 'ملابس', osmKey: 'shop', osmValue: 'clothes', iconName: 'Shirt' },
    ],
  },
  {
    id: 'education',
    label: 'التعليم',
    color: 'bg-amber-100',
    textColor: 'text-amber-700',
    iconName: 'GraduationCap',
    services: [
      { id: 'school', label: 'مدرسة', osmKey: 'amenity', osmValue: 'school', iconName: 'School' },
      { id: 'university', label: 'جامعة', osmKey: 'amenity', osmValue: 'university', iconName: 'Building' },
      { id: 'library', label: 'مكتبة (مطالعة)', osmKey: 'amenity', osmValue: 'library', iconName: 'Library' },
    ],
  },
  {
    id: 'public',
    label: 'مرافق عامة',
    color: 'bg-slate-200',
    textColor: 'text-slate-700',
    iconName: 'Building2',
    services: [
      { id: 'police', label: 'مركز شرطة', osmKey: 'amenity', osmValue: 'police', iconName: 'Siren' },
      { id: 'post', label: 'مكتب بريد', osmKey: 'amenity', osmValue: 'post_office', iconName: 'Mail' },
      { id: 'toilets', label: 'مرحاض عمومي', osmKey: 'amenity', osmValue: 'toilets', iconName: 'UserRound' },
      { id: 'water', label: 'سقاية ماء', osmKey: 'amenity', osmValue: 'drinking_water', iconName: 'Droplets' },
    ],
  },
  {
    id: 'transport',
    label: 'النقل',
    color: 'bg-indigo-100',
    textColor: 'text-indigo-700',
    iconName: 'Car',
    services: [
      { id: 'fuel', label: 'محطة وقود', osmKey: 'amenity', osmValue: 'fuel', iconName: 'Fuel' },
      { id: 'parking', label: 'موقف سيارات', osmKey: 'amenity', osmValue: 'parking', iconName: 'SquareParking' },
      { id: 'taxi', label: 'موقف طاكسي', osmKey: 'amenity', osmValue: 'taxi', iconName: 'CarFront' },
    ],
  },
  {
    id: 'leisure',
    label: 'ترفيه وتنزه',
    color: 'bg-green-100',
    textColor: 'text-green-700',
    iconName: 'Trees',
    services: [
      { id: 'park', label: 'حديقة / منتزه', osmKey: 'leisure', osmValue: 'park', iconName: 'TreePine' },
      { id: 'playground', label: 'ساحة لعب', osmKey: 'leisure', osmValue: 'playground', iconName: 'Gamepad2' },
      { id: 'cinema', label: 'سينما', osmKey: 'amenity', osmValue: 'cinema', iconName: 'Clapperboard' },
    ],
  },
];

export const APP_NAME = "Finder";
export const DEFAULT_RADIUS_METERS = 5000;