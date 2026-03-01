import { redirect } from 'next/navigation';

/** Refunds are processed on Customer Support. Redirect so bookmarks still work. */
export default function AdminRefundsPage() {
  redirect('/admin/support');
}
