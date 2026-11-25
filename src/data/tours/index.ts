import projectPermissionsTour from './project-permissions.json';
import responseAccessTour from './response-access.json';

export interface TourHotspot {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TourStep {
  id: string;
  title: string;
  description: string;
  image: string;
  alt: string;
  actionLabel?: string;
  hotspot?: TourHotspot;
}

export interface TourData {
  id: string;
  title: string;
  steps: TourStep[];
}

/**
 * Add new tours by creating `src/data/tours/<id>.json` and registering it here.
 * Then embed `<InteractiveTour tourId="<id>" />` in MDX without editing the component.
 */
export const TOURS: Record<string, TourData> = {
  'project-permissions': projectPermissionsTour as TourData,
  'response-access': responseAccessTour as TourData,
};

export type TourId = keyof typeof TOURS;
