/**
 * Converts a 2D array of rows into a CSV string and triggers a browser download.
 * @param {(string|number)[][]} rows
 * @param {string} filename
 */
function downloadCsv(rows, filename) {
  const csv = rows
    .map(row =>
      row.map(cell => {
        const val = cell == null ? '' : String(cell);
        // Quote cells that contain commas, quotes, or newlines
        return /[",\n\r]/.test(val) ? `"${val.replace(/"/g, '""')}"` : val;
      }).join(',')
    )
    .join('\r\n');

  const bom = '\uFEFF'; // UTF-8 BOM so Excel opens Arabic correctly
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Exports the queue stats report for a given date as a CSV file.
 * @param {object} stats   - { totals, byPriority, byClinic }
 * @param {string} date    - YYYY-MM-DD
 */
export function exportReportCsv(stats, date) {
  const rows = [];

  // ── Header ──────────────────────────────────────
  rows.push(['Hospital Queue System — Daily Report']);
  rows.push([`Date: ${date}`]);
  rows.push([`Generated: ${new Date().toLocaleString()}`]);
  rows.push([]);

  // ── Section 1: Summary by status ────────────────
  rows.push(['SUMMARY BY STATUS']);
  rows.push(['Status', 'Count']);

  const totalsMap = stats.totals?.reduce((a, r) => ({ ...a, [r.status]: Number(r.cnt) }), {}) || {};
  const statusOrder = ['waiting', 'called', 'in_progress', 'done', 'no_show', 'transferred'];
  const statusLabels = {
    waiting: 'Waiting', called: 'Called', in_progress: 'In Progress',
    done: 'Done', no_show: 'No-show', transferred: 'Transferred',
  };
  let total = 0;
  for (const key of statusOrder) {
    const cnt = totalsMap[key] || 0;
    total += cnt;
    rows.push([statusLabels[key], cnt]);
  }
  rows.push(['Total', total]);
  const noShowRate = total > 0 ? ((totalsMap.no_show || 0) / total * 100).toFixed(1) : '0.0';
  rows.push(['No-show Rate', `${noShowRate}%`]);
  rows.push([]);

  // ── Section 2: By priority ───────────────────────
  rows.push(['PRIORITY BREAKDOWN']);
  rows.push(['Priority', 'Label', 'Count']);
  const priorityLabels = {
    1: 'Resuscitation', 2: 'Emergent', 3: 'Urgent', 4: 'Semi-urgent', 5: 'Non-urgent',
  };
  for (const row of (stats.byPriority || [])) {
    rows.push([row.priority, priorityLabels[row.priority] || row.priority, Number(row.cnt)]);
  }
  rows.push([]);

  // ── Section 3: By clinic / department ───────────
  rows.push(['CLINIC / DEPARTMENT BREAKDOWN']);
  rows.push(['Name (EN)', 'Name (AR)', 'Total', 'Waiting', 'Done', 'Completion %']);
  for (const row of (stats.byClinic || [])) {
    const completion = row.total > 0
      ? ((Number(row.done) / Number(row.total)) * 100).toFixed(1)
      : '0.0';
    rows.push([
      row.name_en || '',
      row.name_ar || '',
      Number(row.total),
      Number(row.waiting) || 0,
      Number(row.done) || 0,
      `${completion}%`,
    ]);
  }

  downloadCsv(rows, `queue-report-${date}.csv`);
}
