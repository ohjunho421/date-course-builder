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

export type SelectedPlaces = Record<string, string[]>; // stopId -> [placeName, ...] (ordered)

export type Course = CourseData & {
  slug: string;
  ownerToken?: string;
  userId?: string;
  createdAt?: string;
};

export type CourseSummary = {
  slug: string;
  ownerToken: string;
  title: string;
  stopCount: number;
  responseCount: number;
  createdAt: string;
  role: "owner" | "received"; // 내가 만든 코스 / 받은 코스
};

export type MemoryKind = "image" | "video" | "text";

// 코스에 남기는 추억 기록 (미디어 바이너리는 별도 API로 서빙)
export type CourseMemory = {
  id: string;
  kind: MemoryKind;
  text: string;
  mimeType?: string;
  createdAt: string;
};

export type CourseResponse = {
  id: string;
  name: string;
  message: string;
  picks: Record<string, string[]>; // stopId -> [placeName, ...] (ordered)
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
