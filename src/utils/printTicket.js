import { PRIORITY_META } from '../constants/queue.js';

/**
 * Opens a new window with a formatted ticket and triggers the browser print dialog.
 * @param {object} ticket
 * @param {string} ticket.ticket_number
 * @param {string} ticket.name_en
 * @param {string} ticket.name_ar
 * @param {number} ticket.priority
 * @param {string} ticket.destination_en  - clinic or department name (EN)
 * @param {string} ticket.destination_ar  - clinic or department name (AR)
 * @param {string|null} ticket.notes
 */
export function printTicket(ticket) {
  const pm = PRIORITY_META[ticket.priority] || {};
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Queue Ticket ${ticket.ticket_number}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      background: #fff;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      padding: 20px;
    }
    .ticket {
      width: 80mm;
      border: 2px solid #222;
      border-radius: 8px;
      overflow: hidden;
      page-break-inside: avoid;
    }
    .ticket-header {
      background: #1a1a2e;
      color: #fff;
      text-align: center;
      padding: 12px 8px 10px;
    }
    .hospital-icon { font-size: 22px; }
    .hospital-name-en { font-size: 13px; font-weight: 700; letter-spacing: 0.5px; margin-top: 4px; }
    .hospital-name-ar { font-size: 13px; font-weight: 700; direction: rtl; margin-top: 2px; }

    .ticket-number-block {
      text-align: center;
      padding: 18px 8px 14px;
      border-bottom: 1px dashed #ccc;
    }
    .ticket-num-label { font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 1px; }
    .ticket-num { font-size: 48px; font-weight: 900; letter-spacing: 2px; color: #1a1a2e; line-height: 1; }

    .ticket-body { padding: 14px 16px; }

    .patient-names { margin-bottom: 12px; }
    .name-en { font-size: 15px; font-weight: 700; color: #111; }
    .name-ar { font-size: 15px; font-weight: 700; color: #111; direction: rtl; text-align: right; margin-top: 2px; }

    .priority-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      color: #fff;
      font-size: 12px;
      font-weight: 700;
      margin-bottom: 10px;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: #444;
      margin-bottom: 6px;
    }
    .info-label { font-weight: 600; color: #888; }

    .notes-block {
      margin-top: 10px;
      padding: 8px;
      background: #f9f9f9;
      border-radius: 4px;
      font-size: 11px;
      color: #555;
      border-left: 3px solid #ccc;
    }

    .ticket-footer {
      border-top: 1px dashed #ccc;
      text-align: center;
      padding: 10px 8px;
      font-size: 10px;
      color: #999;
    }

    @media print {
      body { padding: 0; }
      .ticket { border: none; }
      @page { size: 80mm auto; margin: 4mm; }
    }
  </style>
</head>
<body>
  <div class="ticket">
    <div class="ticket-header">
      <div class="hospital-icon">🏥</div>
      <div class="hospital-name-en">Hospital Queue System</div>
      <div class="hospital-name-ar">نظام طوابير المستشفى</div>
    </div>

    <div class="ticket-number-block">
      <div class="ticket-num-label">Ticket Number / رقم التذكرة</div>
      <div class="ticket-num">${ticket.ticket_number}</div>
    </div>

    <div class="ticket-body">
      <div class="patient-names">
        <div class="name-en">${ticket.name_en}</div>
        <div class="name-ar">${ticket.name_ar}</div>
      </div>

      <div>
        <span class="priority-badge" style="background:${pm.color || '#666'}">
          ${pm.labelEn || ''} / ${pm.labelAr || ''}
        </span>
      </div>

      <div class="info-row">
        <span class="info-label">Destination / الوجهة</span>
      </div>
      <div class="info-row" style="font-size:13px; font-weight:700; color:#1a1a2e; margin-bottom:10px;">
        <span>${ticket.destination_en}</span>
        <span style="direction:rtl">${ticket.destination_ar}</span>
      </div>

      <div class="info-row">
        <span class="info-label">Date / التاريخ</span>
        <span>${dateStr}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Time / الوقت</span>
        <span>${timeStr}</span>
      </div>

      ${ticket.notes ? `<div class="notes-block">📋 ${ticket.notes}</div>` : ''}
    </div>

    <div class="ticket-footer">
      Please wait until your number is called<br/>
      يرجى الانتظار حتى يُنادى على رقمك
    </div>
  </div>

  <script>
    window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; };
  </script>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=400,height=600');
  win.document.write(html);
  win.document.close();
}
