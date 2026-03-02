import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getDashboardOrgId } from '@/lib/admin';
import { cookies } from 'next/headers';
import archiver from 'archiver';
import sgMail from '@sendgrid/mail';

const BUCKET = 'dq-documents';
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL ?? 'info@vantagfleet.com';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const cookieStore = await cookies();
  const orgId = await getDashboardOrgId(supabase, cookieStore);

  if (!orgId) {
    return NextResponse.redirect(
      new URL('/driver/roadside-shield?error=' + encodeURIComponent('Not authorized'), request.url)
    );
  }

  let officerEmail: string;
  try {
    const formData = await request.formData();
    officerEmail = (formData.get('officerEmail') as string)?.trim() ?? '';
  } catch {
    officerEmail = '';
  }
  if (!officerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(officerEmail)) {
    return NextResponse.redirect(
      new URL('/driver/roadside-shield?error=' + encodeURIComponent('Invalid email'), request.url)
    );
  }

  const admin = createAdminClient();
  const { data: docs } = await supabase
    .from('compliance_docs')
    .select('id, doc_type, file_path')
    .eq('org_id', orgId);

  if (!docs?.length) {
    return NextResponse.redirect(
      new URL('/driver/roadside-shield?error=' + encodeURIComponent('No documents to send'), request.url)
    );
  }

  const archive = archiver('zip', { store: true });
  const chunks: Buffer[] = [];
  archive.on('data', (chunk: Buffer) => chunks.push(chunk));
  const archiveDone = new Promise<void>((resolve, reject) => {
    archive.on('end', () => resolve());
    archive.on('error', reject);
  });

  for (let i = 0; i < docs.length; i++) {
    const doc = docs[i];
    const { data: blob, error } = await admin.storage.from(BUCKET).download(doc.file_path);
    if (error || !blob) continue;
    const ext = doc.file_path.split('.').pop() || 'bin';
    const safeName = `${doc.doc_type.replace(/[^a-zA-Z0-9-_]/g, '_')}_${i + 1}.${ext}`;
    archive.append(Buffer.from(await blob.arrayBuffer()), { name: safeName });
  }

  archive.finalize();
  await archiveDone;
  const zipBuffer = Buffer.concat(chunks);
  const zipBase64 = zipBuffer.toString('base64');

  const key = process.env.SENDGRID_API_KEY?.trim();
  if (!key) {
    return NextResponse.redirect(
      new URL('/driver/roadside-shield?error=1', request.url)
    );
  }

  sgMail.setApiKey(key);
  try {
    await sgMail.send({
      to: officerEmail,
      from: FROM_EMAIL,
      subject: 'VantagFleet – Compliance documents for inspection',
      text: 'Please find attached the requested compliance documents. This email was sent from VantagFleet Roadside Shield.',
      attachments: [
        {
          content: zipBase64,
          filename: 'vantagfleet-compliance-docs.zip',
          type: 'application/zip',
          disposition: 'attachment',
        },
      ],
    });
  } catch (err) {
    console.error('[roadside-shield share] SendGrid error:', err);
    return NextResponse.redirect(
      new URL('/driver/roadside-shield?error=1', request.url)
    );
  }

  return NextResponse.redirect(new URL('/driver/roadside-shield?sent=1', request.url));
}
