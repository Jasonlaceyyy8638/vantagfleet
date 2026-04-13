import { redirect } from 'next/navigation';

/** Alias for /loads under /dashboard/loads for post-signup redirects. */
export default function DashboardLoadsAliasPage() {
  redirect('/loads');
}
