// Hooks exportados

// AR module hooks
export * from './ar';

// Booking hook (experience reservations — no payments)
export { useCreateBooking, isConcurrencyError } from './useCreateBooking';
export type { ConcurrencyError, UseCreateBookingResult } from './useCreateBooking';

// Other hooks
export { usePullToRefresh } from './usePullToRefresh';
export { default as useSwipe } from './useSwipe';

// Admin dashboard hooks
export {
  useAdminStats,
  useBookingTrends,
  useRegionData,
  useCategoryDistribution,
  useRevenueData,
  useHeatmapData,
  useTopExperiences,
  useTopSellers,
  useRecentBookings,
} from './useAdminStats';

export type {
  AdminStats,
  BookingTrend,
  RegionData,
  CategoryDistribution,
  RevenueData,
  HeatmapData,
  TopExperience,
  TopSeller,
  RecentBooking,
  PeriodFilter,
} from './useAdminStats';
