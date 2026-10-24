import React from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  UtensilsCrossed,
  Leaf,
  Scale,
  Activity,
  HeartHandshake,
  CheckCircle2,
  AlertTriangle,
  IndianRupee,
} from 'lucide-react';
import MetricPodCard from './MetricPodCard';
import { useLanguage } from '../../../store/LanguageContext';

export default function AnalyticsTelemetryHud({
  telemetry = {},
  dietary = {},
  wasteEconomics = {},
  kitchenRations = {},
  onSelectMetric,
}) {
  const { t } = useLanguage();

  const activeCount = telemetry.activeDiners || 0;
  const totalStudents = telemetry.totalEnrolled || 0;
  const participationRate = telemetry.participationRate || 0;
  const optedOut = telemetry.optedOutCount || 0;
  const onLeave = telemetry.onLeaveCount || 0;
  const blocked = telemetry.blockedCount || 0;

  const costSaved = wasteEconomics.totalCostSavedINR || 0;
  const foodSavedKg = wasteEconomics.totalEstimatedFoodSavedKg || 0;

  const standardRatio = dietary.standardRatio || 0;
  const specialDiets = dietary.customDietCount || 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Pod 1: Active Dining Headcount */}
      <MetricPodCard
        title={t('activeDining', 'Active Diners')}
        value={activeCount.toString()}
        subvalue={`${activeCount} / ${totalStudents} Total Enrolled`}
        delta={participationRate > 75 ? '+4.2%' : '-2.1%'}
        isPositiveDelta={participationRate > 75}
        icon={UtensilsCrossed}
        color="emerald"
        badge="Live Headcount"
        progress={participationRate}
        onClick={() => onSelectMetric && onSelectMetric('activeDiners')}
      />

      {/* Pod 2: Participation & Retention Rate */}
      <MetricPodCard
        title={t('participationRate', 'Attendance Ratio')}
        value={`${participationRate}%`}
        subvalue={`${optedOut} Opted Out • ${onLeave} Approved Leave`}
        delta={participationRate >= 80 ? 'Optimal' : 'Low'}
        isPositiveDelta={participationRate >= 80}
        icon={Activity}
        color="indigo"
        badge={`${blocked} Blocked`}
        progress={participationRate}
        onClick={() => onSelectMetric && onSelectMetric('participation')}
      />

      {/* Pod 3: Food Waste Prevention Economics */}
      <MetricPodCard
        title={t('wastePrevention', 'Food Saved (Opt-Outs)')}
        value={`${foodSavedKg} kg`}
        subvalue={`₹${costSaved.toLocaleString('en-IN')} mess budget saved`}
        delta="Eco-Impact"
        isPositiveDelta={true}
        icon={Leaf}
        color="cyan"
        badge="Sustainability"
        progress={Math.min(100, (foodSavedKg / 30) * 100)}
        onClick={() => onSelectMetric && onSelectMetric('waste')}
      />

      {/* Pod 4: Dietary Customization & Diversity */}
      <MetricPodCard
        title={t('dietaryDiversity', 'Dietary Breakdown')}
        value={`${standardRatio}%`}
        subvalue={`${specialDiets} Special diets (${dietary.beefAvoiders || 0} No Beef, ${dietary.fishAvoiders || 0} No Fish)`}
        delta={`${specialDiets} Special`}
        isPositiveDelta={true}
        icon={Scale}
        color="amber"
        badge="Allergen Safe"
        progress={standardRatio}
        onClick={() => onSelectMetric && onSelectMetric('dietary')}
      />
    </div>
  );
}
