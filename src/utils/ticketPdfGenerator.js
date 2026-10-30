import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';

/**
 * Generates and downloads a luxury Ticket Mahal PDF Ticket Pass.
 * Exactly matches the reference e-ticket structure:
 * 1. Top Branding: Ticket Mahal
 * 2. Event artwork banner preserving existing poster
 * 3. Physical ticket shaped body: burgundy border, notched perforations, left event info + right QR
 * 4. Second Bordered Panel: This is your E-Ticket + Important Information
 * 5. Minimal Ticket Mahal footer
 */
export async function downloadTicketPdf({ ticket, booking, user }) {
  if (!ticket) return;

  const event = ticket.events || {};
  const ticketNumber = ticket.ticket_number || 'TM-PASS';
  const bookingRef = ticket.booking_reference || booking?.booking_number || 'TM-REF';
  const eventTitle = event.event_name || event.title || 'Event Admission';
  const venue = event.venue_name || event.venue || 'Ticket Mahal Main Stage';
  const city = event.city || 'Dubai';
  const showtime = event.start_time || booking?.showtime || '07:30 PM';
  const eventDate = event.event_date || event.date || 'Upcoming';
  const ticketType = ticket.ticket_type || 'Standard Admission';
  const holderName = ticket.customer_name || 
    booking?.customer_name ||
    (user?.user_metadata?.first_name ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ''}`.trim() : null) || 
    'Valued Guest';

  const isDemo = ticket.payment_mode === 'demo' || 
                 booking?.payment_mode === 'demo' || 
                 ticket.booking_reference?.startsWith('DEMO');

  // Portrait A4: 210 x 297 mm
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 18;
  const contentWidth = pageWidth - (margin * 2); // 174 mm

  // Background: Clean Warm Ivory
  doc.setFillColor(253, 251, 247); // #FDFBF7
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Outer Ticket Container (White Card with Fine Burgundy Border)
  const cardY = 14;
  const cardHeight = 270;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(122, 31, 43); // #7A1F2B
  doc.setLineWidth(0.8);
  doc.roundedRect(margin, cardY, contentWidth, cardHeight, 4, 4, 'FD');

  // 1. TOP BRANDING AREA
  let y = cardY + 12;
  doc.setTextColor(122, 31, 43);
  doc.setFont('times', 'bold');
  doc.setFontSize(22);
  doc.text('TICKET MAHAL', margin + 10, y);

  if (isDemo) {
    doc.setFillColor(254, 243, 199);
    doc.setDrawColor(245, 163, 0);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin + contentWidth - 44, y - 6, 34, 7, 2, 2, 'FD');
    doc.setTextColor(146, 64, 14);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('DEMO BOOKING', margin + contentWidth - 27, y - 1.5, { align: 'center' });
  } else {
    doc.setTextColor(143, 135, 124);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('OFFICIAL DIGITAL PASS', margin + contentWidth - 10, y - 1, { align: 'right' });
  }

  // Thin separator under brand header
  y += 6;
  doc.setDrawColor(238, 230, 219);
  doc.setLineWidth(0.3);
  doc.line(margin + 10, y, margin + contentWidth - 10, y);

  // 2. ORIGINAL EVENT POSTER BANNER
  y += 5;
  const bannerWidth = contentWidth - 20; // 154 mm
  const bannerHeight = 52;
  const bannerX = margin + 10;
  const bannerY = y;

  // Placeholder background if image fails to load
  doc.setFillColor(30, 20, 24);
  doc.roundedRect(bannerX, bannerY, bannerWidth, bannerHeight, 2, 2, 'F');

  if (event.event_image || event.image) {
    try {
      const imgUrl = event.event_image || event.image;
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
        img.src = imgUrl;
      });

      if (img.width && img.height) {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        doc.addImage(dataUrl, 'JPEG', bannerX, bannerY, bannerWidth, bannerHeight);
      }
    } catch (_) {}
  }

  // 3. PHYSICAL-TICKET SHAPED MAIN BODY
  y = bannerY + bannerHeight + 7;
  const ticketBodyY = y;
  const ticketBodyHeight = 84;
  const ticketBodyWidth = contentWidth - 20;
  const ticketBodyX = margin + 10;

  // Ticket outline: Burgundy border
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(122, 31, 43);
  doc.setLineWidth(0.6);
  doc.roundedRect(ticketBodyX, ticketBodyY, ticketBodyWidth, ticketBodyHeight, 3, 3, 'FD');

  // Left 65% width vs Right 35%
  const leftWidth = ticketBodyWidth * 0.65;
  const rightWidth = ticketBodyWidth * 0.35;
  const dividerX = ticketBodyX + leftWidth;

  // Perforation dashed divider
  doc.setDrawColor(122, 31, 43);
  doc.setLineDashPattern([1.5, 1.5], 0);
  doc.line(dividerX, ticketBodyY, dividerX, ticketBodyY + ticketBodyHeight);
  doc.setLineDashPattern([], 0);

  // Left Event Information
  let infoY = ticketBodyY + 10;
  doc.setTextColor(122, 31, 43);
  doc.setFont('times', 'bold');
  doc.setFontSize(14);
  const titleLines = doc.splitTextToSize(eventTitle, leftWidth - 14);
  doc.text(titleLines, ticketBodyX + 8, infoY);
  infoY += (titleLines.length * 5) + 3;

  doc.setTextColor(143, 135, 124);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('OUR DEAR GUEST', ticketBodyX + 8, infoY);
  infoY += 4.5;

  doc.setTextColor(28, 28, 28);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(holderName, ticketBodyX + 8, infoY);
  infoY += 8;

  // Metadata Grid inside ticket
  doc.setDrawColor(240, 235, 225);
  doc.line(ticketBodyX + 8, infoY - 2, dividerX - 8, infoY - 2);

  const drawCol = (label, val, colX, colY) => {
    doc.setTextColor(143, 135, 124);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.text(label, colX, colY);
    doc.setTextColor(28, 28, 28);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(val, colX, colY + 4.5);
  };

  const col1X = ticketBodyX + 8;
  const col2X = ticketBodyX + 38;
  const col3X = ticketBodyX + 68;

  if (ticket.row) {
    drawCol('DOOR', `Door ${ticket.row}`, col1X, infoY + 2);
  } else {
    drawCol('CATEGORY', ticketType, col1X, infoY + 2);
  }

  drawCol('SECTION', ticketType, col2X, infoY + 2);

  // Highlighted Seat
  doc.setTextColor(143, 135, 124);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.text('SEAT', col3X, infoY + 2);
  doc.setTextColor(122, 31, 43);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text(ticket.seat || 'General', col3X, infoY + 6.5);

  infoY += 16;
  drawCol('DATE & TIME', `${eventDate} · ${showtime}`, col1X, infoY);
  drawCol('PRICE', `AED ${ticket.price || booking?.total_amount || 0}`, col3X, infoY);

  // Right Side: QR Code Area
  const qrCenterX = dividerX + (rightWidth / 2);
  let qrY = ticketBodyY + 7;

  // Category Pill
  doc.setFillColor(122, 31, 43);
  doc.roundedRect(qrCenterX - 18, qrY, 36, 5.5, 1.5, 1.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text(ticketType.toUpperCase(), qrCenterX, qrY + 3.8, { align: 'center' });

  // Generate QR
  qrY += 9;
  const qrPayload = ticket.qr_token || `https://ticketmahal.ae/verify-ticket/${ticketNumber}`;
  try {
    const qrDataUrl = await QRCode.toDataURL(qrPayload, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 256,
      color: { dark: '#1C1C1C', light: '#FFFFFF' }
    });
    doc.addImage(qrDataUrl, 'PNG', qrCenterX - 18, qrY, 36, 36);
  } catch (_) {
    doc.setFillColor(245, 245, 245);
    doc.rect(qrCenterX - 18, qrY, 36, 36, 'F');
  }

  // Ticket ID below QR
  qrY += 40;
  doc.setTextColor(143, 135, 124);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.text('TICKET ID', qrCenterX, qrY, { align: 'center' });
  doc.setTextColor(122, 31, 43);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(ticketNumber, qrCenterX, qrY + 4, { align: 'center' });

  // 4. SECOND BORDERED INFORMATION PANEL
  y = ticketBodyY + ticketBodyHeight + 7;
  const panel2Y = y;
  const panel2Height = 65;
  const panel2Width = contentWidth - 20;
  const panel2X = margin + 10;

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(122, 31, 43);
  doc.setLineWidth(0.6);
  doc.roundedRect(panel2X, panel2Y, panel2Width, panel2Height, 3, 3, 'FD');

  // Left side of panel 2: This is your E-Ticket
  const p2LeftX = panel2X + 8;
  let p2LeftY = panel2Y + 8;

  doc.setFillColor(122, 31, 43);
  doc.roundedRect(p2LeftX, p2LeftY - 3, 40, 5, 1, 1, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.text('THIS IS YOUR E-TICKET', p2LeftX + 20, p2LeftY + 0.5, { align: 'center' });

  p2LeftY += 8;
  doc.setTextColor(28, 28, 28);
  doc.setFont('times', 'bold');
  doc.setFontSize(11);
  doc.text('Event Information', p2LeftX, p2LeftY);

  p2LeftY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(60, 60, 60);
  doc.text(`• Venue: ${venue}, ${city}`, p2LeftX, p2LeftY);
  p2LeftY += 4.5;
  doc.text(`• Schedule: ${eventDate} | ${showtime}`, p2LeftX, p2LeftY);
  p2LeftY += 4.5;
  doc.text(`• Booking Ref: #${bookingRef}`, p2LeftX, p2LeftY);
  if (ticket.seat) {
    p2LeftY += 4.5;
    doc.text(`• Assigned Seat: ${ticket.seat} (${ticketType})`, p2LeftX, p2LeftY);
  }

  // Right side of panel 2: Important Information
  const p2DividerX = panel2X + (panel2Width * 0.5);
  doc.setDrawColor(240, 235, 225);
  doc.line(p2DividerX, panel2Y + 5, p2DividerX, panel2Y + panel2Height - 5);

  const p2RightX = p2DividerX + 8;
  let p2RightY = panel2Y + 8;

  doc.setTextColor(122, 31, 43);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('Important Information', p2RightX, p2RightY);

  p2RightY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(65, 65, 65);
  const instructions = [
    '• Arrive at least 30 minutes before the scheduled start time.',
    '• Present this valid digital or printed E-Ticket for entry.',
    '• Valid photo ID matching ticket holder name may be required.',
    '• Tickets are non-transferable and subject to event conditions.',
    '• Late entry is strictly governed by venue auditorium rules.'
  ];
  for (const inst of instructions) {
    doc.text(inst, p2RightX, p2RightY);
    p2RightY += 4;
  }
  p2RightY += 2;
  doc.setTextColor(122, 31, 43);
  doc.setFont('helvetica', 'bold');
  doc.text('View Ticket Mahal Terms & Conditions → ticketmahal.ae/terms', p2RightX, p2RightY);

  // 5. MINIMAL TICKET MAHAL FOOTER
  y = cardY + cardHeight - 12;
  doc.setTextColor(122, 31, 43);
  doc.setFont('times', 'bold');
  doc.setFontSize(11);
  doc.text('TICKET MAHAL', pageWidth / 2, y, { align: 'center' });
  doc.setTextColor(143, 135, 124);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('Your Ticket. Your Experience. • ticketmahal.ae', pageWidth / 2, y + 4.5, { align: 'center' });

  // Save PDF
  doc.save(`TicketMahal-${ticketNumber}.pdf`);
  return doc;
}
