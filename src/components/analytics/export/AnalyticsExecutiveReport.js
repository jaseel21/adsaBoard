/**
 * ADSA T-Board Executive Intelligence PDF Generator
 * Formats high-resolution multi-page analytical summaries for administrative committee records.
 */

import jsPDF from 'jspdf';
import 'jspdf-autotable';

export function generateExecutiveAnalyticsPdf({
  telemetry = {},
  dietary = {},
  batchBenchmarks = [],
  wasteEconomics = {},
  kitchenRations = {},
  meta = {},
}) {
  const doc = new jsPDF('p', 'mm', 'a4');

  // Primary Colors
  const primaryColor = [5, 150, 105]; // Emerald 600
  const darkTextColor = [31, 41, 55]; // Gray 800

  // 1. Header Banner
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 14, 'F');

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkTextColor);
  doc.text('ALATHURPADI DARS STUDENTS ASSOCIATION (ADSA)', 14, 25);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Executive Dining Intelligence & Operational Performance Dossier', 14, 31);

  // Meta info
  doc.setFontSize(9);
  doc.text(`Generated: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} (IST)`, 14, 38);
  doc.text(`Target Date: ${meta.friendlyDate || meta.targetDateIST} | Meal: ${meta.meal?.toUpperCase()}`, 14, 43);

  // Divider
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(14, 46, 196, 46);

  // 2. Executive Key Metrics Table
  const metricsData = [
    ['Total Enrolled Students', telemetry.totalEnrolled || 0],
    ['Active Diners', `${telemetry.activeDiners || 0} (${telemetry.participationRate || 0}%)`],
    ['Opted-Out / Leave', telemetry.optedOutCount || 0],
    ['Blocked Tokens', telemetry.blockedCount || 0],
    ['Estimated Food Saved', `${wasteEconomics.totalEstimatedFoodSavedKg || 0} kg`],
    ['Estimated Budget Saved', `INR ${wasteEconomics.totalCostSavedINR || 0}`],
  ];

  doc.autoTable({
    startY: 50,
    head: [['Executive Telemetry Metric', 'Value']],
    body: metricsData,
    theme: 'striped',
    headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 2.5 },
  });

  // 3. Dietary Avoidance Summary Table
  const dietaryData = [
    ['Standard Full Diet Diners', dietary.fullStandardDiners || 0],
    ['Beef Avoiders (No Beef)', dietary.beefAvoiders || 0],
    ['Fish Avoiders (No Fish)', dietary.fishAvoiders || 0],
    ['Chicken Avoiders (No Chicken)', dietary.chickenAvoiders || 0],
  ];

  doc.autoTable({
    startY: doc.lastAutoTable.finalY + 8,
    head: [['Dietary Requirement Category', 'Headcount']],
    body: dietaryData,
    theme: 'grid',
    headStyles: { fillColor: [79, 70, 229], textColor: 255 }, // Indigo
    styles: { fontSize: 9, cellPadding: 2.5 },
  });

  // 4. Batch Participation Benchmarks Table
  const batchData = batchBenchmarks.map((b) => [
    b.name,
    b.total,
    b.active,
    `${b.rate}%`,
    b.status.toUpperCase(),
  ]);

  doc.autoTable({
    startY: doc.lastAutoTable.finalY + 8,
    head: [['Batch Name', 'Enrolled', 'Active Diners', 'Participation', 'Discipline']],
    body: batchData,
    theme: 'striped',
    headStyles: { fillColor: [16, 185, 129], textColor: 255 },
    styles: { fontSize: 8.5, cellPadding: 2 },
  });

  // 5. Kitchen Ration Preparation Table
  const rationData = [
    ['Grain / Mess Rice', `${kitchenRations.totalRiceKg || 0} kg (${kitchenRations.riceSacks || 0} Sacks)`],
    ['Fresh Beef', `${kitchenRations.totalBeefKg || 0} kg`],
    ['Fresh Fish', `${kitchenRations.totalFishKg || 0} kg`],
    ['Fresh Vegetables', `${kitchenRations.totalVegKg || 0} kg`],
    ['Pulses / Dhal', `${kitchenRations.totalDhalKg || 0} kg`],
    ['Cooking Oil', `${kitchenRations.cookingOilLiters || 0} Liters`],
  ];

  doc.autoTable({
    startY: doc.lastAutoTable.finalY + 8,
    head: [['Kitchen Ingredient', 'Calculated Requirement']],
    body: rationData,
    theme: 'grid',
    headStyles: { fillColor: [245, 158, 11], textColor: 255 }, // Amber
    styles: { fontSize: 8.5, cellPadding: 2 },
  });

  // Footer Sign-off Block
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('Authorized by ADSA Central Canteen Committee & Dars Administration', 14, pageHeight - 12);
  doc.text('Page 1 of 1', 185, pageHeight - 12);

  return doc;
}
