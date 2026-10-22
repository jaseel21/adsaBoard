import jsPDF from 'jspdf';
import 'jspdf-autotable';
import Papa from 'papaparse';
import { getEffectiveStudentMealStatus } from './studentExceptionService';
import { getCachedCanteenConfig } from './canteenConfigService';

const BATCH_NAMES = ['Batch 1', 'Batch 2', 'Batch 3', 'Batch 4', 'Batch 5', 'Batch 6', 'Batch 7'];

/**
 * Sorts an array of student documents by token number in ascending or descending order.
 */
export function sortDocuments(documents = [], sortOrder = 'ascending') {
  return [...documents].sort((a, b) => {
    const tokenA = Number(a.tokenNo) || 0;
    const tokenB = Number(b.tokenNo) || 0;
    return sortOrder === 'descending' ? tokenB - tokenA : tokenA - tokenB;
  });
}

/**
 * Sorts an array of token numbers (e.g. [1, 25, 4]) in ascending or descending order.
 */
export function sortTokenList(tokens = [], sortOrder = 'ascending') {
  return [...tokens].sort((a, b) => {
    const numA = Number(a) || 0;
    const numB = Number(b) || 0;
    return sortOrder === 'descending' ? numB - numA : numA - numB;
  });
}

/**
 * Formats tokens for table rows.
 * Smart A4 Space Utilization:
 * If tokens.length <= maxAllowedRows, DO NOT PAIR. Each token is rendered individually
 * on its own row to fully utilize the vertical A4 sheet with maximum readability.
 * Tokens are strictly paired into pairs of 2 ONLY IF the count exceeds maxAllowedRows
 * to prevent spilling onto a second page.
 */
function packTokensForTable(tokens = [], maxAllowedRows = 30) {
  if (!tokens || tokens.length === 0) return ['-'];

  // If items fit within the vertical height budget, keep 1 token per row!
  if (tokens.length <= maxAllowedRows) {
    return tokens.map((t) => (String(t).startsWith('#') ? t : `#${t}`));
  }

  // Content would exceed available page height: dynamically pair tokens
  const rows = [];
  for (let i = 0; i < tokens.length; i += 2) {
    const t1 = String(tokens[i]).startsWith('#') ? tokens[i] : `#${tokens[i]}`;
    if (i + 1 < tokens.length) {
      const t2 = String(tokens[i + 1]).startsWith('#') ? tokens[i + 1] : `#${tokens[i + 1]}`;
      rows.push(`${t1}, ${t2}`);
    } else {
      rows.push(`${t1}`);
    }
  }

  // If still exceeding after pairing, group into triplets as extreme fallback
  if (rows.length > maxAllowedRows) {
    const condensed = [];
    for (let i = 0; i < tokens.length; i += 3) {
      const chunk = tokens.slice(i, i + 3).map((t) => (String(t).startsWith('#') ? t : `#${t}`));
      condensed.push(chunk.join(', '));
    }
    return condensed;
  }

  return rows;
}

/**
 * Computes section-by-section breakdown (numeric chunks of tokens, e.g. 1-25, 26-50).
 * Chunk size is fetched dynamically from admin database configuration.
 */
export function computeSectionsBreakdown({
  documents = [],
  targetDateIST,
  dayKey,
  meal,
  chunkSize = null,
  sortOrder = 'ascending',
  statusFilter = 'canceled_only',
}) {
  const sorted = sortDocuments(documents, sortOrder);
  const activeChunkSize = chunkSize || getCachedCanteenConfig().sectionChunkSize || 25;
  const size = Math.max(Number(activeChunkSize) || 25, 5);
  const totalSections = Math.ceil(sorted.length / size);
  const sections = [];

  for (let i = 0; i < totalSections; i++) {
    const start = i * size;
    const end = Math.min((i + 1) * size, sorted.length);
    const slice = sorted.slice(start, end);

    const rawCanceled = slice
      .filter((d) => !getEffectiveStudentMealStatus(d, targetDateIST, dayKey, meal))
      .map((d) => d.tokenNo);

    const rawActive = slice
      .filter((d) => getEffectiveStudentMealStatus(d, targetDateIST, dayKey, meal))
      .map((d) => d.tokenNo);

    const canceledTokens = sortTokenList(rawCanceled, sortOrder);
    const activeTokens = sortTokenList(rawActive, sortOrder);

    const rangeStr =
      slice.length > 0 ? `${slice[0].tokenNo} - ${slice[slice.length - 1].tokenNo}` : '-';

    let tokensToDisplay = canceledTokens;
    if (statusFilter === 'active_only') {
      tokensToDisplay = activeTokens;
    } else if (statusFilter === 'all') {
      tokensToDisplay = slice.map(
        (d) => `${d.tokenNo}${getEffectiveStudentMealStatus(d, targetDateIST, dayKey, meal) ? '✓' : '✗'}`
      );
    }

    sections.push({
      id: i + 1,
      name: `Sec ${i + 1}`,
      fullName: `Section ${i + 1}`,
      range: rangeStr,
      total: slice.length,
      activeCount: activeTokens.length,
      canceledTokens,
      activeTokens,
      tokensToDisplay,
    });
  }

  return sections;
}

/**
 * Computes batch-by-batch student attendance and canceled tokens for a given meal.
 */
export function computeBatchBreakdown({
  documents = [],
  targetDateIST,
  dayKey,
  meal,
  sortOrder = 'ascending',
  statusFilter = 'canceled_only',
  selectedBatches = null,
}) {
  const batchesToUse = selectedBatches && selectedBatches.length > 0 ? selectedBatches : BATCH_NAMES;

  return batchesToUse.map((bName, idx) => {
    let slice = documents.filter((d) => d.batch === bName);
    slice = sortDocuments(slice, sortOrder);

    const rawCanceled = slice
      .filter((d) => !getEffectiveStudentMealStatus(d, targetDateIST, dayKey, meal))
      .map((d) => d.tokenNo);

    const rawActive = slice
      .filter((d) => getEffectiveStudentMealStatus(d, targetDateIST, dayKey, meal))
      .map((d) => d.tokenNo);

    const canceledTokens = sortTokenList(rawCanceled, sortOrder);
    const activeTokens = sortTokenList(rawActive, sortOrder);

    const rangeStr =
      slice.length > 0 ? `${slice[0].tokenNo} - ${slice[slice.length - 1].tokenNo}` : '-';

    let tokensToDisplay = canceledTokens;
    if (statusFilter === 'active_only') {
      tokensToDisplay = activeTokens;
    } else if (statusFilter === 'all') {
      tokensToDisplay = slice.map(
        (d) => `${d.tokenNo}${getEffectiveStudentMealStatus(d, targetDateIST, dayKey, meal) ? '✓' : '✗'}`
      );
    }

    return {
      id: idx + 1,
      name: bName.replace('Batch ', 'B'),
      fullName: bName,
      range: rangeStr,
      canceledTokens,
      activeTokens,
      tokensToDisplay,
      total: slice.length,
      activeCount: activeTokens.length,
    };
  });
}

/**
 * Generates an official, strictly SINGLE-PAGE combined kitchen supply manifest PDF.
 * Uses smart vertical budgeting:
 *  - Calculates available page height (~247mm).
 *  - Renders single tokens per row by default to utilize page space.
 *  - Only pairs tokens when total height would exceed single page boundary.
 */
export function generateSinglePageCombinedManifestDoc({
  targetDateIST,
  dayKey,
  dayFull,
  documents = [],
  category = 'sections',
  sort = 'ascending',
  chunkSize = null,
  mealFilter = 'both',
  statusFilter = 'canceled_only',
  selectedBatches = null,
  revision = 1,
  printedByName = null,
  printedAt = null,
  deltaNotes = null,
  isReprint = false,
}) {
  const doc = new jsPDF('p', 'mm', 'a4'); // 210mm x 297mm
  const breakfastColor = [217, 119, 6]; // Warm Amber
  const lunchColor = [5, 150, 105];     // Deep Emerald

  const activeChunkSize = chunkSize || getCachedCanteenConfig().sectionChunkSize || 25;

  // Helper to get breakdown based on category
  const getBreakdown = (meal) => {
    if (category === 'batches') {
      return computeBatchBreakdown({
        documents,
        targetDateIST,
        dayKey,
        meal,
        sortOrder: sort,
        statusFilter,
        selectedBatches,
      });
    }
    return computeSectionsBreakdown({
      documents,
      targetDateIST,
      dayKey,
      meal,
      chunkSize: activeChunkSize,
      sortOrder: sort,
      statusFilter,
    });
  };

  const breakfastColumnsData = getBreakdown('breakfast');
  const lunchColumnsData = getBreakdown('lunch');

  const totalBreakfastActive = breakfastColumnsData.reduce((acc, b) => acc + b.activeCount, 0);
  const totalLunchActive = lunchColumnsData.reduce((acc, b) => acc + b.activeCount, 0);

  const numCols = Math.max(breakfastColumnsData.length, lunchColumnsData.length, 1);
  const fontSizeByCols = numCols > 8 ? 6.5 : numCols > 6 ? 7 : 7.5;
  const paddingByCols = numCols > 8 ? 0.9 : 1.2;

  // 1. TOP HEADER BANNER (y: 0 to 22mm)
  doc.setFillColor(6, 78, 59); // Deep Emerald
  doc.rect(0, 0, 210, 22, 'F');

  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('ALATHURPADI DARS — DAILY KITCHEN SUPPLY MANIFEST', 14, 8.5);

  // Revision Pill Badge in top right corner
  const revPillText = `REV ${revision}${isReprint ? ' (REPRINT)' : ''}`;
  if (revision > 1) {
    doc.setFillColor(225, 29, 72); // Rose-600
  } else {
    doc.setFillColor(16, 185, 129); // Emerald-500
  }
  doc.roundedRect(154, 4.5, 42, 6.5, 1.5, 1.5, 'F');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(revPillText, 175, 9, { align: 'center' });

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  const sortLabel = sort === 'descending' ? 'DESC (200 → 1)' : 'ASC (1 → 200)';
  const catLabel = category === 'batches' ? 'Batches 1–7' : `Sections (${activeChunkSize} tokens/sec)`;
  const adminLabel = printedByName ? `  |  Admin: ${printedByName}` : '';
  doc.text(
    `Service Date: ${targetDateIST} (${(dayFull || dayKey || '').toUpperCase()})  |  Grouping: ${catLabel}  |  Sort: ${sortLabel}${adminLabel}`,
    14,
    14.5
  );

  doc.setFontSize(6.5);
  doc.setTextColor(200, 230, 220);
  doc.text(
    `Timestamp: ${printedAt || new Date().toLocaleString('en-IN')}  |  Kitchen Master Sheet`,
    14,
    19
  );

  // 2. OPERATIONAL SUMMARY STRIP (y: 24 to 33mm)
  doc.setFillColor(243, 246, 244);
  doc.roundedRect(14, 24, 182, 8.5, 2, 2, 'F');

  doc.setFontSize(7.5);
  doc.setTextColor(70, 70, 70);
  doc.setFont('helvetica', 'normal');
  doc.text(`Enrolled Diners: ${documents.length}`, 18, 29.5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...breakfastColor);
  doc.text(`Breakfast Prep: ${totalBreakfastActive} Meals`, 68, 29.5);

  doc.setTextColor(...lunchColor);
  doc.text(`Lunch Prep: ${totalLunchActive} Meals`, 128, 29.5);

  let currentY = 35;

  // Optional: Highlighted Delta Alert Strip when Revision > 1 or delta notes exist
  if (deltaNotes) {
    doc.setFillColor(254, 242, 242);
    doc.setDrawColor(248, 113, 113);
    doc.roundedRect(14, 34, 182, 6, 1.5, 1.5, 'FD');
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(185, 28, 28);
    doc.text(`⚠️ REV ${revision} UPDATE NOTE: ${String(deltaNotes).slice(0, 110)}`, 18, 38.2);
    currentY = 42;
  }

  // -------------------------------------------------------------
  // SMART VERTICAL SPACE BUDGETING & PAIRING DECISION ENGINE
  // -------------------------------------------------------------
  // Available vertical content window: y = 35mm to y = 282mm (Total: 247mm)
  // Check un-paired row counts:
  const bRawMax = Math.max(...breakfastColumnsData.map((col) => col.tokensToDisplay.length), 1);
  const lRawMax = Math.max(...lunchColumnsData.map((col) => col.tokensToDisplay.length), 1);

  let maxAllowedRowsB = 35;
  let maxAllowedRowsL = 35;

  if (mealFilter === 'both') {
    // Both tables combined:
    // Overhead = Banner 1 (6mm) + Table 1 Head (8mm) + Gap & Banner 2 (12mm) + Table 2 Head (8mm) = ~34mm.
    // Usable row height = 247mm - 34mm = ~213mm.
    // At ~4.1mm per table row, up to ~50 total rows fit comfortably across both meals without pairing!
    const totalRawRows = bRawMax + lRawMax;
    if (totalRawRows <= 48) {
      // PLENTY OF SPACE: DO NOT PAIR! Render single tokens per row.
      maxAllowedRowsB = bRawMax + 5;
      maxAllowedRowsL = lRawMax + 5;
    } else {
      // Overflow risk: Allocate proportional row budget to each meal
      const budgetB = Math.max(Math.floor((bRawMax / totalRawRows) * 44), 10);
      const budgetL = Math.max(44 - budgetB, 10);
      maxAllowedRowsB = budgetB;
      maxAllowedRowsL = budgetL;
    }
  } else {
    // Single meal: up to 55 individual rows fit on page 1 without pairing!
    maxAllowedRowsB = 55;
    maxAllowedRowsL = 55;
  }

  // Status descriptor for section table banners
  const statusNote =
    statusFilter === 'active_only'
      ? 'Lists Attending Diners'
      : statusFilter === 'all'
      ? 'Roster Status (✓ Served / ✗ Skip)'
      : 'Numbers inside columns represent canceled/skipped tokens';

  // 3. SECTION 1: BREAKFAST SUPPLY MANIFEST
  if (mealFilter === 'both' || mealFilter === 'breakfast') {
    doc.setFillColor(...breakfastColor);
    doc.roundedRect(14, currentY, 182, 5.5, 1.5, 1.5, 'F');

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(
      `1. BREAKFAST SUPPLY BREAKDOWN  •  Total To Prepare: ${totalBreakfastActive} Meals  (${statusNote})`,
      18,
      currentY + 3.8
    );

    const bColumns = breakfastColumnsData.map((col) => ({
      header: `${col.fullName || col.name}\n${col.activeCount}/${col.total} Served\n[${col.range}]`,
      dataKey: `col_${col.id}`,
    }));

    const bPackedRows = breakfastColumnsData.map((col) =>
      packTokensForTable(col.tokensToDisplay, maxAllowedRowsB)
    );
    const bMaxRows = Math.max(...bPackedRows.map((r) => r.length), 1);

    const bTableBody = Array.from({ length: bMaxRows }).map((_, rIdx) => {
      const row = {};
      breakfastColumnsData.forEach((col, cIdx) => {
        row[`col_${col.id}`] = bPackedRows[cIdx][rIdx] !== undefined ? bPackedRows[cIdx][rIdx] : '-';
      });
      return row;
    });

    doc.autoTable({
      columns: bColumns,
      body: bTableBody,
      startY: currentY + 7,
      margin: { left: 14, right: 14 },
      theme: 'grid',
      pageBreak: 'avoid',
      styles: {
        fontSize: fontSizeByCols,
        halign: 'center',
        valign: 'middle',
        cellPadding: paddingByCols,
        lineColor: [220, 220, 220],
        lineWidth: 0.15,
      },
      headStyles: {
        fillColor: breakfastColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center',
        fontSize: fontSizeByCols - 0.5,
        cellPadding: paddingByCols,
      },
      alternateRowStyles: {
        fillColor: [254, 251, 246],
      },
    });

    currentY = (doc.lastAutoTable?.finalY || 120) + 5;
  }

  // 4. SECTION 2: LUNCH SUPPLY MANIFEST
  if (mealFilter === 'both' || mealFilter === 'lunch') {
    doc.setFillColor(...lunchColor);
    doc.roundedRect(14, currentY, 182, 5.5, 1.5, 1.5, 'F');

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(
      `${mealFilter === 'both' ? '2' : '1'}. LUNCH SUPPLY BREAKDOWN  •  Total To Prepare: ${totalLunchActive} Meals  (${statusNote})`,
      18,
      currentY + 3.8
    );

    const lColumns = lunchColumnsData.map((col) => ({
      header: `${col.fullName || col.name}\n${col.activeCount}/${col.total} Served\n[${col.range}]`,
      dataKey: `col_${col.id}`,
    }));

    const lPackedRows = lunchColumnsData.map((col) =>
      packTokensForTable(col.tokensToDisplay, maxAllowedRowsL)
    );
    const lMaxRows = Math.max(...lPackedRows.map((r) => r.length), 1);

    const lTableBody = Array.from({ length: lMaxRows }).map((_, rIdx) => {
      const row = {};
      lunchColumnsData.forEach((col, cIdx) => {
        row[`col_${col.id}`] = lPackedRows[cIdx][rIdx] !== undefined ? lPackedRows[cIdx][rIdx] : '-';
      });
      return row;
    });

    doc.autoTable({
      columns: lColumns,
      body: lTableBody,
      startY: currentY + 7,
      margin: { left: 14, right: 14 },
      theme: 'grid',
      pageBreak: 'avoid',
      styles: {
        fontSize: fontSizeByCols,
        halign: 'center',
        valign: 'middle',
        cellPadding: paddingByCols,
        lineColor: [220, 220, 220],
        lineWidth: 0.15,
      },
      headStyles: {
        fillColor: lunchColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center',
        fontSize: fontSizeByCols - 0.5,
        cellPadding: paddingByCols,
      },
      alternateRowStyles: {
        fillColor: [248, 252, 250],
      },
    });
  }

  // 5. FOOTER VERIFICATION (Bottom of single page)
  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  doc.setFont('helvetica', 'italic');
  doc.text(
    `Alathurpadi Dars Food Management System • Official Single-Page Kitchen Master Sheet • Rev ${revision} • Printed ${printedAt || new Date().toLocaleString('en-IN')}`,
    14,
    290
  );

  // STRICT GUARANTEE: Delete any trailing page if created by accident
  while (doc.getNumberOfPages() > 1) {
    doc.deletePage(doc.getNumberOfPages());
  }

  const fileSlug = `ADSA_Kitchen_Supply_Manifest_${targetDateIST}_${category}_${sort}_Rev${revision}.pdf`;
  return {
    doc,
    filename: fileSlug,
    title: `Kitchen Supply Manifest (Rev ${revision})`,
    subtitle: `${targetDateIST} (${(dayFull || dayKey || '').toUpperCase()}) • Rev ${revision} • ${category} • ${sort}`,
  };
}

/**
 * Downloads single-page combined kitchen supply manifest PDF
 */
export function exportSinglePageCombinedManifestPDF(params) {
  const { doc, filename } = generateSinglePageCombinedManifestDoc(params);
  doc.save(filename);
  return true;
}

/**
 * Backward compatible export function for legacy callers
 */
export function exportKitchenSupplyPDF(params) {
  return exportSinglePageCombinedManifestPDF(params);
}

/**
 * Generates an institutional Dietary & Avoiders Matrix PDF for mess cooks and food suppliers.
 * Displays which token numbers avoid specific dietary categories (e.g. Fish, Beef, Chicken, Egg).
 * Strictly anonymized with zero student personal data.
 */
export function generateDietaryAvoidersDoc({
  preferences = [],
  documents = [],
  rejectionsByPref = {},
  sort = 'ascending',
  selectedCategories = null,
}) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const brandColor = [5, 150, 105]; // Emerald

  // Filter active preferences
  let activePrefs = preferences.filter((p) => p.isActive !== false);
  if (selectedCategories && selectedCategories.length > 0) {
    activePrefs = activePrefs.filter((p) => selectedCategories.includes(p.id));
  }

  // Compute rejections if not pre-provided
  const rejections = { ...rejectionsByPref };
  activePrefs.forEach((p) => {
    if (!rejections[p.id]) {
      const tokens = documents
        .filter((d) => d.obj2 && d.obj2[p.id] === false)
        .map((d) => d.tokenNo);
      rejections[p.id] = sortTokenList(tokens, sort);
    } else {
      rejections[p.id] = sortTokenList(rejections[p.id], sort);
    }
  });

  // Header Banner
  doc.setFillColor(...brandColor);
  doc.rect(0, 0, 210, 21, 'F');

  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('ALATHURPADI DARS — DIETARY AVOIDERS & SPECIAL EXCLUSIONS', 14, 9.5);

  const sortLabel = sort === 'descending' ? 'DESC (200 → 1)' : 'ASC (1 → 200)';
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Official Kitchen Reference  |  Date: ${new Date().toLocaleDateString('en-GB')}  |  Sort: ${sortLabel}  |  Total Enrolled: ${documents.length}`,
    14,
    15.5
  );

  // Summary Row Box
  doc.setFillColor(243, 246, 244);
  doc.roundedRect(14, 23, 182, 9, 2, 2, 'F');

  let summaryText = 'Active Exclusions: ';
  activePrefs.forEach((p, idx) => {
    const count = (rejections[p.id] || []).length;
    summaryText += `${p.labelEn}: ${count}${idx < activePrefs.length - 1 ? '  |  ' : ''}`;
  });

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(60, 60, 60);
  doc.text(summaryText, 18, 28.5);

  // Construct Columns
  const columns = activePrefs.map((p) => ({
    header: `${p.labelEn}\n(${p.labelMl || ''})\n[${(rejections[p.id] || []).length} Avoiders]`,
    dataKey: p.id,
  }));

  const maxRows = Math.max(...activePrefs.map((p) => (rejections[p.id] || []).length), 1);
  const tableBody = Array.from({ length: maxRows }).map((_, rIdx) => {
    const row = {};
    activePrefs.forEach((p) => {
      const list = rejections[p.id] || [];
      row[p.id] = rIdx < list.length ? `#${list[rIdx]}` : '-';
    });
    return row;
  });

  doc.autoTable({
    columns,
    body: tableBody,
    startY: 35,
    margin: { left: 14, right: 14 },
    theme: 'grid',
    styles: {
      fontSize: 8,
      halign: 'center',
      cellPadding: 1.8,
    },
    headStyles: {
      fillColor: brandColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
      fontSize: 7.5,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 249],
    },
  });

  const finalY = doc.lastAutoTable?.finalY || 200;
  doc.setFontSize(7);
  doc.setTextColor(130, 130, 130);
  doc.setFont('helvetica', 'italic');
  doc.text(
    'Alathurpadi Dars Food Management System • Tokens listed are strictly excluded from receiving the specified dietary item.',
    14,
    Math.min(finalY + 8, 290)
  );

  const dateSlug = new Date().toISOString().slice(0, 10);
  const filename = `ADSA_Dietary_Avoiders_${dateSlug}_${sort}.pdf`;
  return {
    doc,
    filename,
    title: 'Dietary Avoiders Matrix',
    subtitle: `Kitchen Dietary Matrix (${sort})`,
  };
}

/**
 * Downloads Dietary Avoiders Matrix PDF
 */
export function exportDietaryAvoidersPDF(params) {
  const { doc, filename } = generateDietaryAvoidersDoc(params);
  doc.save(filename);
  return true;
}

/**
 * Generates and downloads a clean CSV spreadsheet of the Kitchen Supply Manifest
 * with UTF-8 BOM encoding for seamless opening in Excel or Google Sheets.
 */
export function generateManifestCSVData({
  targetDateIST,
  dayKey,
  dayFull,
  documents = [],
  sortOrder = 'ascending',
  chunkSize = null,
  category = 'sections',
}) {
  const sorted = sortDocuments(documents, sortOrder);
  const activeChunkSize = chunkSize || getCachedCanteenConfig().sectionChunkSize || 25;
  const size = Math.max(Number(activeChunkSize) || 25, 5);

  const rows = sorted.map((doc, idx) => {
    const sectionIndex = Math.floor(idx / size) + 1;
    const isBreakfastActive = getEffectiveStudentMealStatus(doc, targetDateIST, dayKey, 'breakfast');
    const isLunchActive = getEffectiveStudentMealStatus(doc, targetDateIST, dayKey, 'lunch');

    return {
      'Token No': doc.tokenNo,
      'Batch': doc.batch || 'Unassigned',
      'Section': `Section ${sectionIndex}`,
      'Service Date': targetDateIST,
      'Day': (dayFull || dayKey || '').toUpperCase(),
      'Breakfast Status': isBreakfastActive ? 'SERVED' : 'CANCELED',
      'Lunch Status': isLunchActive ? 'SERVED' : 'CANCELED',
    };
  });

  const csv = Papa.unparse(rows);
  const filename = `ADSA_Kitchen_Supply_Manifest_${targetDateIST}_${category}_${sortOrder}.csv`;
  return {
    csv,
    rows,
    filename,
    title: 'Kitchen Supply Manifest (CSV)',
    subtitle: `${targetDateIST} • ${category} • ${sortOrder}`,
  };
}

export function exportManifestCSV(params) {
  const { csv, filename } = generateManifestCSVData(params);
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return true;
}

/**
 * Generates and downloads a CSV spreadsheet of the Dietary Avoiders Matrix.
 */
export function generateDietaryCSVData({
  preferences = [],
  documents = [],
  rejectionsByPref = {},
  sortOrder = 'ascending',
  selectedCategories = null,
}) {
  let activePrefs = preferences.filter((p) => p.isActive !== false);
  if (selectedCategories && selectedCategories.length > 0) {
    activePrefs = activePrefs.filter((p) => selectedCategories.includes(p.id));
  }

  const rejections = { ...rejectionsByPref };
  activePrefs.forEach((p) => {
    if (!rejections[p.id]) {
      const tokens = documents
        .filter((d) => d.obj2 && d.obj2[p.id] === false)
        .map((d) => d.tokenNo);
      rejections[p.id] = sortTokenList(tokens, sortOrder);
    }
  });

  const sorted = sortDocuments(documents, sortOrder);
  const rows = sorted
    .filter((d) => activePrefs.some((p) => (rejections[p.id] || []).includes(d.tokenNo)))
    .map((doc) => {
      const avoidedItems = activePrefs
        .filter((p) => (rejections[p.id] || []).includes(doc.tokenNo))
        .map((p) => p.labelEn)
        .join(', ');

      const row = {
        'Token No': doc.tokenNo,
        'Batch': doc.batch || 'Unassigned',
        'Avoided Items': avoidedItems,
      };

      activePrefs.forEach((p) => {
        row[p.labelEn] = (rejections[p.id] || []).includes(doc.tokenNo) ? 'AVOID' : 'REGULAR';
      });

      return row;
    });

  const csv = Papa.unparse(rows);
  const dateSlug = new Date().toISOString().slice(0, 10);
  const filename = `ADSA_Dietary_Avoiders_${dateSlug}_${sortOrder}.csv`;
  return {
    csv,
    rows,
    filename,
    title: 'Dietary Avoiders Matrix (CSV)',
    subtitle: `Dietary Matrix (${sortOrder})`,
  };
}

export function exportDietaryCSV(params) {
  const { csv, filename } = generateDietaryCSVData(params);
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return true;
}
