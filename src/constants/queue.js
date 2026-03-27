export const PRIORITY_META = {
  1: { color: '#e53e3e', labelEn: 'Resuscitation', labelAr: 'إنعاش' },
  2: { color: '#dd6b20', labelEn: 'Emergent',      labelAr: 'طارئ'  },
  3: { color: '#d69e2e', labelEn: 'Urgent',        labelAr: 'عاجل'  },
  4: { color: '#38a169', labelEn: 'Semi-urgent',   labelAr: 'شبه عاجل' },
  5: { color: '#3182ce', labelEn: 'Non-urgent',    labelAr: 'غير عاجل' },
};

export const PRIORITY_OPTIONS = [
  { value: 1, ...PRIORITY_META[1], labelEn: '1 — Resuscitation', labelAr: '١ — إنعاش' },
  { value: 2, ...PRIORITY_META[2], labelEn: '2 — Emergent',      labelAr: '٢ — طارئ'  },
  { value: 3, ...PRIORITY_META[3], labelEn: '3 — Urgent',        labelAr: '٣ — عاجل'  },
  { value: 4, ...PRIORITY_META[4], labelEn: '4 — Semi-urgent',   labelAr: '٤ — شبه عاجل' },
  { value: 5, ...PRIORITY_META[5], labelEn: '5 — Non-urgent',    labelAr: '٥ — غير عاجل' },
];

export const STATUS_META = {
  waiting:     { labelEn: 'Waiting',     labelAr: 'انتظار',    cls: 'status-waiting' },
  called:      { labelEn: 'Called',      labelAr: 'تم النداء', cls: 'status-called' },
  in_progress: { labelEn: 'In Progress', labelAr: 'جارٍ',      cls: 'status-progress' },
  done:        { labelEn: 'Done',        labelAr: 'منتهى',     cls: 'status-done' },
  no_show:     { labelEn: 'No-show',     labelAr: 'لم يحضر',  cls: 'status-noshow' },
  transferred: { labelEn: 'Transferred', labelAr: 'محوّل',    cls: 'status-transferred' },
};
