import { redirect } from 'next/navigation';

/** Canonical dispatch UI lives at /dispatch; this path matches “dashboard” URL expectations after signup. */
export default function DashboardDispatchAliasPage() {
  redirect('/dispatch');
}
