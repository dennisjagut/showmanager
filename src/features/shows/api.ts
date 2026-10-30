import { api, query } from "@/lib/api/client";
import { idOf } from "@/lib/api/path";
import type { ScheduleTemplate, ShowDetails, ShowList } from "@/lib/api/types";
import { param, type SearchParams } from "@/lib/search-params";

// Reading from the API

// The show list; view (upcoming, past, all) and tour come from the URL
export function listShows(sp: SearchParams) {
  return api.get<ShowList>(`/shows${query({ view: param(sp, "view"), tour: param(sp, "tour") })}`);
}

export function getShow(id: string) {
  return api.get<ShowDetails>(`/shows/${idOf(id)}`);
}

// All shows with schedule and guest list, for the CSV export
export function allShowDetails() {
  return api.get<ShowDetails[]>("/shows/details");
}

export function getTours() {
  return api.get<string[]>("/tours");
}

export function getTemplates() {
  return api.get<ScheduleTemplate[]>("/templates");
}
