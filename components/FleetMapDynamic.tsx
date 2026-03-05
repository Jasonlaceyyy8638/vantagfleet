'use client';

import dynamic from 'next/dynamic';
import type { FleetMapLocation } from './FleetMap';

const FleetMap = dynamic(
  () => import('./FleetMap').then((m) => ({ default: m.FleetMap })),
  { ssr: false }
);

type Props = {
  accessToken: string;
  organizationId?: string | null;
  initialLocations?: FleetMapLocation[];
  height?: string;
  className?: string;
};

export function FleetMapDynamic(props: Props) {
  return <FleetMap {...props} />;
}
