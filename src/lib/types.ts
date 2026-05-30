export type Place = {
  sourceUrl: string;
  placeId: string;
  placeUrl: string;
  name: string;
  category: string;
  emoji: string;
  address: string;
  lat: number | null;
  lng: number | null;
  hours: string;
  images: string[];
  keywords: string[];
  micro: string;
  menu: string[];
  visitor: string;
  blog: string;
};

export type Stop = {
  id: string;
  label: string;
  emoji: string;
  places: Place[];
};

export type CourseData = {
  title: string;
  intro: string;
  modes: string[]; // subset of ["walk","car","transit"]
  stops: Stop[];
};

export type Course = CourseData & {
  slug: string;
  ownerToken?: string;
  createdAt?: string;
};

export type CourseResponse = {
  id: string;
  name: string;
  message: string;
  picks: Record<string, string>; // stopId -> placeName
  createdAt: string;
};

export const MODE_LABEL: Record<string, string> = {
  walk: "도보",
  car: "차량",
  transit: "대중교통",
};

export const MODE_EMOJI: Record<string, string> = {
  walk: "🚶",
  car: "🚗",
  transit: "🚇",
};
