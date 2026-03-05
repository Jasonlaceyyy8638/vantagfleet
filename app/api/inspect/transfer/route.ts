import { NextRequest, NextResponse } from 'next/server';
import { getInspectSession } from '@/app/actions/inspect';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { getFromEmail } from '@/lib/email-addresses';
import sgMail from '@sendgrid/mail';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const token = (body?.token ?? '').trim();
  const officerEmail = (body?.officerEmail ?? '').trim();
  const transferCode = (body?.transferCode ?? '').trim();

  if (!token) return NextResponse.json({ error: 'Token required' }, { status: 400 });
  if (!officerEmail && !transferCode) return NextResponse.json({ error: 'Email or transfer code required' }, { status: 400 });

  const session = await getInspectSession(token);
  if (!session.ok) return NextResponse.json({ error: 'Invalid or expired session' }, { status: 400 });

  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const margin = 40;
  let y = 750;
  const lineH = 14;
  let page = doc.addPage([612, 792]);

  page.drawText('VantagFleet — Officer Inspection Log', {
    x: margin,
    y,
    size: 14,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.15),
  });
  y -= 20;

  page.drawText(`Carrier: ${session.orgName}  |  USDOT: ${session.usdot ?? '—'}  |  VIN: ${session.vin ?? '—'}  |  Plate: ${session.plate ?? '—'}`, {
    x: margin,
    y,
    size: 9,
    font: font,
    color: rgb(0.3, 0.3, 0.35),
  });
  y -= 24;

  for (const day of session.hosLogs) {
    page.drawText(`Date: ${day.date}`, { x: margin, y, size: 11, font: fontBold, color: rgb(0.2, 0.2, 0.25) });
    y -= lineH;
    for (const ev of day.events) {
      const line = `${ev.startTime ?? ''} – ${ev.endTime ?? ''}  ${ev.type.replace('_', ' ')}  ${ev.location ?? ''}  ${ev.notes ?? ''}`.trim();
      if (y < 80) {
        page = doc.addPage([612, 792]);
        y = 750;
      }
      page.drawText(line.slice(0, 100), { x: margin + 10, y, size: 8, font: font, color: rgb(0.25, 0.25, 0.3) });
      y -= 12;
    }
    y -= 8;
  }

  page = doc.getPage(doc.getPageCount() - 1);
  page.drawText('Certified by VantagFleet — Generated for DOT inspection.', {
    x: margin,
    y: 50,
    size: 8,
    font: font,
    color: rgb(0.5, 0.5, 0.55),
  });

  const pdfBytes = await doc.save();
  const key = process.env.SENDGRID_API_KEY?.trim();
  if (!key) return NextResponse.json({ error: 'Email not configured' }, { status: 500 });

  const toEmail = officerEmail;
  if (!toEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(toEmail)) return NextResponse.json({ error: 'Valid officer email required to send PDF' }, { status: 400 });

  sgMail.setApiKey(key);
  try {
    await sgMail.send({
      to: toEmail,
      from: getFromEmail('APP_NOTIFICATION_SUPPORT'),
      subject: `VantagFleet HOS Log — ${session.orgName} (USDOT ${session.usdot ?? '—'})`,
      text: `8-day HOS log for ${session.orgName}, USDOT ${session.usdot ?? '—'}. See attached PDF.`,
      attachments: [
        {
          content: Buffer.from(pdfBytes).toString('base64'),
          filename: `VantagFleet_HOS_Log_${session.usdot ?? 'carrier'}.pdf`,
          type: 'application/pdf',
          disposition: 'attachment',
        },
      ],
    });
  } catch (err) {
    console.error('[inspect/transfer] SendGrid error:', err);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
