/**
 * Pre-engineered Broadcast Announcement Templates
 * Allows canteen and central committee officers to draft mission-critical alerts in seconds.
 */

export const NOTIFICATION_PRESETS = [
  {
    id: 'cutoff_extension',
    title: 'Cutoff Extended by 45 Minutes',
    category: 'cutoff',
    severity: 'warning',
    targetAudience: { type: 'students' },
    bannerPinned: true,
    cta: {
      label: 'Update Dining Choices',
      actionType: 'route',
      target: '/student-portal',
    },
    body: 'The evening token adjustment window has been extended until 8:45 PM today. Please update your breakfast and lunch preferences before the updated deadline.',
  },
  {
    id: 'special_feast',
    title: "Special Jum'ah Biryani Feast Planned",
    category: 'feast',
    severity: 'festive',
    targetAudience: { type: 'all' },
    bannerPinned: true,
    cta: {
      label: 'View Food Menu',
      actionType: 'route',
      target: '/menu',
    },
    body: "Tomorrow's lunch features our traditional festive chicken dum biryani, salad, mint chutney, and date dessert. Dining slots begin immediately after Jum'ah prayer.",
  },
  {
    id: 'kitchen_delay',
    title: 'Breakfast Serving Delayed by 15 Mins',
    category: 'urgent',
    severity: 'critical',
    targetAudience: { type: 'all' },
    bannerPinned: true,
    cta: {
      label: 'Token Board',
      actionType: 'route',
      target: '/',
    },
    body: 'Notice from Canteen Chefs: Due to early morning electrical maintenance in the kitchen hall, breakfast counter service will begin at 7:45 AM instead of 7:30 AM.',
  },
  {
    id: 'dietary_verification',
    title: 'Verify Your Dietary & Avoiders List',
    category: 'general',
    severity: 'info',
    targetAudience: { type: 'students' },
    bannerPinned: false,
    cta: {
      label: 'Check Avoiders List',
      actionType: 'route',
      target: '/list',
    },
    body: 'All students with specific dietary exclusions (Fish/Beef/Chicken avoiders) are requested to verify their preferences with the Canteen Sub-Committee before Friday.',
  },
  {
    id: 'cook_memo',
    title: 'Kitchen Memo: Friday Headcount Projection',
    category: 'general',
    severity: 'info',
    targetAudience: { type: 'staff' },
    bannerPinned: false,
    cta: {
      label: 'Open Kitchen KDS',
      actionType: 'route',
      target: '/kitchen',
    },
    body: 'Kitchen Staff Attention: Estimated lunch dining strength is currently 320+ tokens. Please check the Kitchen Display System for live dietary breakdowns.',
  },
];
