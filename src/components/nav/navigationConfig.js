import {
  Home,
  UtensilsCrossed,
  UserCheck,
  ChefHat,
  Printer,
  FileText,
  Sliders,
  Users,
  Utensils,
  Bell,
  HeartHandshake,
  Activity,
  ShieldCheck,
  HelpCircle,
  Share2,
  LogIn,
  CreditCard,
  Layers,
  Clock,
  Sparkles,
} from 'lucide-react';
import { ROLES, hasRole } from '../../utils/rbac';

/**
 * Categorized Navigation Group Definitions
 */
export const NAV_CATEGORIES = {
  DINING: {
    id: 'dining',
    labelEn: 'Campus Dining',
    labelMl: 'കാമ്പസ് ഡൈനിംഗ്',
    descriptionEn: 'Daily meal tracking, interactive keycap board & dining portal',
    descriptionMl: 'പ്രതിദിന ഭക്ഷണ വിവരങ്ങളും ടോക്കൺ പോർട്ടലും',
    color: 'emerald',
  },
  KITCHEN: {
    id: 'kitchen',
    labelEn: 'Kitchen & Manifests',
    labelMl: 'അടുക്കള & സപ്ലൈ',
    descriptionEn: 'Live preparation counters, supply sheets & dietary avoiders list',
    descriptionMl: 'തത്സമയ പാചക വിവരങ്ങളും ഒഴിവാക്കൽ ലിസ്റ്റും',
    color: 'amber',
  },
  ADMIN: {
    id: 'admin',
    labelEn: 'Admin Command',
    labelMl: 'അഡ്മിൻ കൺസോൾ',
    descriptionEn: 'Operational authority, student enrollment, menus & security radar',
    descriptionMl: 'വിദ്യാർത്ഥി മാനേജ്‌മെന്റും സുരക്ഷാ നിയന്ത്രണങ്ങളും',
    color: 'indigo',
  },
  HELP: {
    id: 'help',
    labelEn: 'Help & Community',
    labelMl: 'സഹായം & കെയർ',
    descriptionEn: 'Interactive system manual, campus concierge & share studio',
    descriptionMl: 'യൂസർ ഗൈഡും കെയർ ഹെൽപ്പ്‌ഡെസ്കും',
    color: 'teal',
  },
};

/**
 * Master Registry of all System Pages, Routes, and Capabilities
 */
export const NAV_ITEMS = [
  // ================= 1. CAMPUS DINING =================
  {
    id: 'home',
    path: '/',
    aliases: ['/home'],
    labelEn: 'Home',
    labelMl: 'ഹോം',
    shortLabelEn: 'Home',
    shortLabelMl: 'ഹോം',
    category: NAV_CATEGORIES.DINING.id,
    icon: Home,
    descriptionEn: 'Campus meal spotlight, announcements & dining summary',
    descriptionMl: 'തത്സമയ ഭക്ഷണ വിവരങ്ങളും അറിയിപ്പുകളും',
    isPublic: true,
    showInDesktopBar: true,
    showInBottomDock: true,
    keywords: ['home', 'dashboard', 'spotlight', 'today', 'meal', 'ഹോം', 'ഭക്ഷണം'],
  },
  {
    id: 'food_menu',
    path: '/menu',
    aliases: ['/fmenu'],
    labelEn: 'Food Menu',
    labelMl: 'ഭക്ഷണ മെനു',
    shortLabelEn: 'Menu',
    shortLabelMl: 'മെനു',
    category: NAV_CATEGORIES.DINING.id,
    icon: UtensilsCrossed,
    descriptionEn: 'Weekly breakfast & lunch menu, daily specials & meal timings',
    descriptionMl: 'പ്രതിവാര ഭക്ഷണ മെനുവും ദിവസേനയുള്ള സ്പെഷ്യലുകളും',
    isPublic: true,
    showInDesktopBar: true,
    showInBottomDock: true,
    keywords: ['menu', 'food', 'breakfast', 'lunch', 'dishes', 'മെനു', 'ഭക്ഷണം'],
  },
  {
    id: 'adab_maidah',
    path: '/adab',
    aliases: ['/ethics', '/dining-ethics', '/adab-al-maidah'],
    labelEn: 'Dining Ethics & Adab',
    labelMl: 'ആദാബുൽ മാഇദ (അദബ്)',
    shortLabelEn: 'Adab',
    shortLabelMl: 'അദബ്',
    category: NAV_CATEGORIES.DINING.id,
    icon: Sparkles,
    descriptionEn: 'Sacred dining ethics, Prophetic Sunnah, 1/3 belly balance & Dars traditions',
    descriptionMl: 'അന്നത്തിന്റെ ആത്മീയത, തിരുസുന്നത്ത്, 1/3 വയറിന്റെ മിതത്വം, ദർസ് അദബുകൾ',
    isPublic: true,
    showInDesktopBar: true,
    showInBottomDock: false,
    badgeTextEn: 'Sacred',
    badgeTextMl: 'പുണ്യം',
    keywords: ['adab', 'ethics', 'sunnah', 'food manners', 'dars', 'waste', 'അദബ്', 'മര്യാദകൾ', 'സുന്നത്ത്'],
  },
  {
    id: 'student_portal',
    path: '/student',
    aliases: ['/student-portal'],
    labelEn: 'Student Portal',
    labelMl: 'വിദ്യാർത്ഥി പോർട്ടൽ',
    shortLabelEn: 'Student',
    shortLabelMl: 'പോർട്ടൽ',
    category: NAV_CATEGORIES.DINING.id,
    icon: UserCheck,
    descriptionEn: 'Meal routine, date overrides, and dietary preferences',
    descriptionMl: 'ഭക്ഷണ ക്രമീകരണങ്ങളും ഡയറ്ററി മാറ്റങ്ങളും',
    isPublic: false,
    requiresAuth: true,
    studentOnly: true,
    showInDesktopBar: true,
    showInBottomDock: true,
    badgeTextEn: 'My Dining',
    badgeTextMl: 'എന്റെ ടോക്കൺ',
    keywords: ['student', 'portal', 'token', 'routine', 'വിദ്യാർത്ഥി', 'പോർട്ടൽ'],
  },

  // ================= 2. KITCHEN & MANIFESTS =================
  {
    id: 'kitchen_kds',
    path: '/kitchen',
    aliases: ['/kds', '/cook-portal'],
    labelEn: 'Kitchen KDS',
    labelMl: 'അടുക്കള കൺസോൾ',
    shortLabelEn: 'Kitchen',
    shortLabelMl: 'അടുക്കള',
    category: NAV_CATEGORIES.KITCHEN.id,
    icon: ChefHat,
    descriptionEn: 'Real-time kitchen display, preparation counters & headcounts',
    descriptionMl: 'തത്സമയ പാചക തയ്യാറെടുപ്പുകളും ഓർഡർ കൗണ്ടറും',
    allowedRoles: [
      ROLES.COOK,
      ROLES.CANTEEN_COMMITTEE,
      ROLES.CENTRAL_COMMITTEE,
      ROLES.DEVELOPER,
    ],
    showInDesktopBar: true, // Visible when authorized staff
    keywords: ['kitchen', 'kds', 'cook', 'chef', 'preparation', 'അടുക്കള', 'പാചകം'],
  },
  {
    id: 'supply_manifest',
    path: '/breakfast',
    aliases: ['/lunch', '/supply', '/manifest'],
    labelEn: 'Supply Manifest',
    labelMl: 'സപ്ലൈ ഷീറ്റ്',
    shortLabelEn: 'Supply',
    shortLabelMl: 'സപ്ലൈ',
    category: NAV_CATEGORIES.KITCHEN.id,
    icon: Printer,
    descriptionEn: 'Consolidated breakfast & lunch kitchen distribution sheet',
    descriptionMl: 'പ്രാതൽ, ഉച്ചഭക്ഷണ വിതരണ പ്രിന്റബിൾ ഷീറ്റ്',
    isPublic: true,
    showInDesktopBar: false,
    keywords: ['supply', 'manifest', 'print', 'breakfast', 'lunch', 'സപ്ലൈ'],
  },
  {
    id: 'dietary_avoiders_list',
    path: '/list',
    aliases: [],
    labelEn: 'Avoiders List',
    labelMl: 'ഒഴിവാക്കൽ ലിസ്റ്റ്',
    shortLabelEn: 'Avoiders',
    shortLabelMl: 'ഒഴിവാക്കൽ',
    category: NAV_CATEGORIES.KITCHEN.id,
    icon: FileText,
    descriptionEn: 'Detailed matrix of students avoiding specific foods & allergens',
    descriptionMl: 'പ്രത്യേക ഭക്ഷണങ്ങൾ ഒഴിവാക്കുന്ന വിദ്യാർത്ഥികളുടെ പട്ടിക',
    isPublic: true,
    showInDesktopBar: false,
    keywords: ['avoiders', 'dietary', 'allergies', 'rejections', 'list', 'ലിസ്റ്റ്'],
  },

  // ================= 3. ADMIN COMMAND =================
  {
    id: 'master_board',
    path: '/admin',
    aliases: ['/master-board'],
    labelEn: 'Master Board',
    labelMl: 'മാസ്റ്റർ ബോർഡ്',
    shortLabelEn: 'Master Board',
    shortLabelMl: 'മാസ്റ്റർ',
    category: NAV_CATEGORIES.ADMIN.id,
    icon: Sliders,
    descriptionEn: 'Multi-student token attendance matrix & bulk overrides',
    descriptionMl: 'എല്ലാ വിദ്യാർത്ഥികളുടെയും ടോക്കൺ നിയന്ത്രണ ബോർഡ്',
    allowedRoles: [
      ROLES.CANTEEN_COMMITTEE,
      ROLES.CENTRAL_COMMITTEE,
      ROLES.DEVELOPER,
    ],
    showInDesktopBar: true,
    keywords: ['admin', 'master', 'board', 'all tokens', 'മാസ്റ്റർ', 'ബോർഡ്'],
  },
  {
    id: 'student_management',
    path: '/student-management',
    aliases: [],
    labelEn: 'Student Directory',
    labelMl: 'വിദ്യാർത്ഥി മാനേജ്‌മെന്റ്',
    shortLabelEn: 'Students',
    shortLabelMl: 'വിദ്യാർത്ഥികൾ',
    category: NAV_CATEGORIES.ADMIN.id,
    icon: Users,
    descriptionEn: 'Enrollment, batch assignment, password reset & token allocation',
    descriptionMl: 'വിദ്യാർത്ഥികളുടെ രജിസ്ട്രേഷനും ടോക്കൺ വിതരണവും',
    allowedRoles: [
      ROLES.CANTEEN_COMMITTEE,
      ROLES.CENTRAL_COMMITTEE,
      ROLES.DEVELOPER,
    ],
    showInDesktopBar: false,
    keywords: ['students', 'directory', 'enrollment', 'passwords', 'വിദ്യാർത്ഥികൾ'],
  },
  {
    id: 'menu_management',
    path: '/admin/menu',
    aliases: ['/menu-management'],
    labelEn: 'Menu Studio',
    labelMl: 'മെനു സ്റ്റുഡിയോ',
    shortLabelEn: 'Menu Studio',
    shortLabelMl: 'മെനു',
    category: NAV_CATEGORIES.ADMIN.id,
    icon: Utensils,
    descriptionEn: 'Weekly meal schedule builder, dishes & calendar date overrides',
    descriptionMl: 'പ്രതിവാര മെനു മാറ്റങ്ങളും പുതിയ വിഭവങ്ങളും',
    allowedRoles: [
      ROLES.CANTEEN_COMMITTEE,
      ROLES.CENTRAL_COMMITTEE,
      ROLES.DEVELOPER,
    ],
    showInDesktopBar: false,
    keywords: ['menu studio', 'recipes', 'dishes', 'schedule', 'മെനു എഡിറ്റ്'],
  },
  {
    id: 'dietary_management',
    path: '/admin/dietary',
    aliases: ['/dietary-management', '/admin/avoiders'],
    labelEn: 'Dietary Console',
    labelMl: 'ഡയറ്ററി കൺസോൾ',
    shortLabelEn: 'Dietary',
    shortLabelMl: 'ഡയറ്ററി',
    category: NAV_CATEGORIES.ADMIN.id,
    icon: UtensilsCrossed,
    descriptionEn: 'Manage food categories, student avoidance approvals & rules',
    descriptionMl: 'ഡയറ്ററി മാറ്റങ്ങൾ അംഗീകരിക്കാനും നിയന്ത്രിക്കാനും',
    allowedRoles: [
      ROLES.CANTEEN_COMMITTEE,
      ROLES.CENTRAL_COMMITTEE,
      ROLES.DEVELOPER,
    ],
    showInDesktopBar: false,
    keywords: ['dietary console', 'avoidance approval', 'categories', 'ഡയറ്ററി'],
  },
  {
    id: 'notification_manager',
    path: '/admin/notifications',
    aliases: ['/notifications'],
    labelEn: 'Broadcast Studio',
    labelMl: 'അറിയിപ്പ് സ്റ്റുഡിയോ',
    shortLabelEn: 'Notices',
    shortLabelMl: 'അറിയിപ്പ്',
    category: NAV_CATEGORIES.ADMIN.id,
    icon: Bell,
    descriptionEn: 'Emergency banners, campus ticker announcements & alerts',
    descriptionMl: 'കാമ്പസ് അറിയിപ്പുകളും അടിയന്തിര ബുള്ളറ്റിനുകളും',
    allowedRoles: [
      ROLES.CANTEEN_COMMITTEE,
      ROLES.CENTRAL_COMMITTEE,
      ROLES.DEVELOPER,
    ],
    showInDesktopBar: false,
    keywords: ['broadcast', 'notices', 'announcements', 'emergency', 'അറിയിപ്പ്'],
  },
  {
    id: 'support_center',
    path: '/admin/support',
    aliases: ['/admin/feedback'],
    labelEn: 'Support Center',
    labelMl: 'സപ്പോർട്ട് ഡെസ്ക്',
    shortLabelEn: 'Support Desk',
    shortLabelMl: 'സപ്പോർട്ട്',
    category: NAV_CATEGORIES.ADMIN.id,
    icon: HeartHandshake,
    descriptionEn: 'Student inquiries, complaints, token unblock requests & resolution',
    descriptionMl: 'പരാതികളും ടോക്കൺ അൺബ്ലോക്ക് അപേക്ഷകളും പരിഹരിക്കാൻ',
    allowedRoles: [
      ROLES.CANTEEN_COMMITTEE,
      ROLES.CENTRAL_COMMITTEE,
      ROLES.DEVELOPER,
      ROLES.COOK,
    ],
    showInDesktopBar: false,
    keywords: ['support center', 'tickets', 'unblock requests', 'helpdesk', 'സഹായം'],
  },
  {
    id: 'audit_logs',
    path: '/admin/audit-logs',
    aliases: ['/admin/audit', '/audit-logs'],
    labelEn: 'Audit Logs',
    labelMl: 'ഓഡിറ്റ് ലോഗുകൾ',
    shortLabelEn: 'Audit',
    shortLabelMl: 'ഓഡിറ്റ്',
    category: NAV_CATEGORIES.ADMIN.id,
    icon: Activity,
    descriptionEn: 'Immutable security telemetry, token changes & activity logs',
    descriptionMl: 'സിസ്റ്റത്തിലെ എല്ലാ മാറ്റങ്ങളുടെയും സുതാര്യമായ ലോഗുകൾ',
    allowedRoles: [
      ROLES.CENTRAL_COMMITTEE,
      ROLES.DEVELOPER,
    ],
    showInDesktopBar: false,
    keywords: ['audit logs', 'telemetry', 'history', 'security', 'ഓഡിറ്റ്'],
  },
  {
    id: 'staff_roles_modal',
    action: 'open_staff_modal',
    labelEn: 'Staff Roles & Access',
    labelMl: 'സ്റ്റാഫ് റോളുകൾ',
    shortLabelEn: 'Staff Roles',
    shortLabelMl: 'റോളുകൾ',
    category: NAV_CATEGORIES.ADMIN.id,
    icon: ShieldCheck,
    descriptionEn: 'Assign committee permissions, cook roles & access credentials',
    descriptionMl: 'കമ്മിറ്റി ഭാരവാഹികൾക്ക് റോളുകൾ നൽകാൻ',
    allowedRoles: [
      ROLES.CENTRAL_COMMITTEE,
      ROLES.DEVELOPER,
    ],
    isModalAction: true,
    keywords: ['staff roles', 'permissions', 'rbac', 'delegation', 'റോളുകൾ'],
  },

  // ================= 4. HELP & COMMUNITY =================
  {
    id: 'user_guide',
    path: '/guide',
    aliases: [],
    labelEn: 'User Guide',
    labelMl: 'യൂസർ ഗൈഡ്',
    shortLabelEn: 'Guide',
    shortLabelMl: 'ഗൈഡ്',
    category: NAV_CATEGORIES.HELP.id,
    icon: HelpCircle,
    descriptionEn: 'Comprehensive visual manual, color conventions & interactive tour',
    descriptionMl: 'ടോക്കൺ ബോർഡ് ഉപയോഗിക്കുന്നതിനുള്ള സമഗ്ര ഗൈഡ്',
    isPublic: true,
    showInDesktopBar: true,
    keywords: ['guide', 'manual', 'help', 'tutorial', 'tour', 'ഗൈഡ്'],
  },
  {
    id: 'care_hub',
    path: '/support',
    aliases: ['/feedback', '/contact'],
    labelEn: 'Care Hub',
    labelMl: 'കെയർ ഹബ്ബ്',
    shortLabelEn: 'Care Hub',
    shortLabelMl: 'കെയർ',
    category: NAV_CATEGORIES.HELP.id,
    icon: HeartHandshake,
    descriptionEn: 'Campus concierge, verified committee contacts & instant feedback',
    descriptionMl: 'കമ്മിറ്റി ഹോട്ട്ലൈൻ നമ്പറുകളും ഫീഡ്‌ബാക്കും',
    isPublic: true,
    showInDesktopBar: false,
    keywords: ['care', 'support', 'contact', 'whatsapp', 'phone', 'ഹെൽപ്പ്'],
  },
  {
    id: 'share_card_modal',
    action: 'open_share_modal',
    labelEn: 'Share System',
    labelMl: 'ഷെയർ ചെയ്യുക',
    shortLabelEn: 'Share',
    shortLabelMl: 'ഷെയർ',
    category: NAV_CATEGORIES.HELP.id,
    icon: Share2,
    descriptionEn: 'Generate visual social card & share link via WhatsApp or Telegram',
    descriptionMl: 'വാട്സാപ്പിലും ടെലിഗ്രാമിലും ലിങ്ക് ഷെയർ ചെയ്യാൻ',
    isPublic: true,
    isModalAction: true,
    keywords: ['share', 'social', 'whatsapp', 'telegram', 'qr', 'ഷെയർ'],
  },
];

/**
 * Filter items by user role and authentication state
 */
export function getVisibleNavItems(userRole, isStudent = false) {
  return NAV_ITEMS.filter((item) => {
    // Student-only items
    if (item.studentOnly) {
      return isStudent;
    }

    // Role-protected items
    if (item.allowedRoles && item.allowedRoles.length > 0) {
      return hasRole(userRole, item.allowedRoles);
    }

    // Public items
    return true;
  });
}

/**
 * Group visible navigation items by Category
 */
export function getGroupedNavItems(userRole, isStudent = false) {
  const visible = getVisibleNavItems(userRole, isStudent);
  const groups = {};

  Object.values(NAV_CATEGORIES).forEach((cat) => {
    const items = visible.filter((item) => item.category === cat.id);
    if (items.length > 0) {
      groups[cat.id] = {
        category: cat,
        items,
      };
    }
  });

  return groups;
}

/**
 * Real-time search filter across all pages, manifests, and tools
 */
export function searchNavItems(query, userRole, isStudent = false) {
  if (!query || !query.trim()) return [];
  const q = query.toLowerCase().trim();
  const visible = getVisibleNavItems(userRole, isStudent);

  return visible.filter((item) => {
    const nameEn = (item.labelEn || '').toLowerCase();
    const nameMl = (item.labelMl || '').toLowerCase();
    const descEn = (item.descriptionEn || '').toLowerCase();
    const path = (item.path || '').toLowerCase();
    const keywords = (item.keywords || []).join(' ').toLowerCase();

    return (
      nameEn.includes(q) ||
      nameMl.includes(q) ||
      descEn.includes(q) ||
      path.includes(q) ||
      keywords.includes(q)
    );
  });
}
