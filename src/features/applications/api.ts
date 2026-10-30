import { api, query } from "@/lib/api/client";
import { idOf } from "@/lib/api/path";
import type { FestivalDetails, FestivalList, Overview, Seasons } from "@/lib/api/types";
import { param, type SearchParams } from "@/lib/search-params";

// Reading from the API. The filters of the overview are passed on from the URL, the API ignores unknown values.

export function getOverview(sp: SearchParams) {
  const p = (key: string) => param(sp, key);
  return api.get<Overview>(
    `/applications${query({
      season: p("season"),
      q: p("q"),
      status: p("status"),
      state: p("state"),
      month: p("month"),
      deadline: p("deadline"),
      sort: p("sort"),
      inactive: p("inactive") === "1",
    })}`,
  );
}

export function getFestival(id: string) {
  return api.get<FestivalDetails>(`/festivals/${idOf(id)}`);
}

// All festivals with their application in one season, for the CSV export
export function listFestivals(season: string) {
  return api.get<FestivalList>(`/festivals${query({ season })}`);
}

export function getSeasons() {
  return api.get<Seasons>("/seasons");
}
