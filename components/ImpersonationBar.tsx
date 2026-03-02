'use client';

const IMPERSONATE_COOKIE = 'impersonated_org_id';

export function ImpersonationBar({ carrierName }: { carrierName: string }) {
  const exit = () => {
    document.cookie = `${IMPERSONATE_COOKIE}=; path=/; max-age=0`;
    window.location.href = '/admin';
  };

  return (
    <div className="sticky top-0 z-30 w-full bg-cyber-amber/15 border-b border-cyber-amber/40 px-4 py-2 flex items-center justify-center gap-2 text-sm text-soft-cloud">
      <span>Currently viewing as <strong>{carrierName}</strong>.</span>
      <button
        type="button"
        onClick={exit}
        className="font-semibold text-cyber-amber hover:text-cyber-amber/90 underline"
      >
        Click here to return to Admin
      </button>
    </div>
  );
}
