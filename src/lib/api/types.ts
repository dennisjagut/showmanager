import type { components } from "./schema";

// The data types of the API, generated from backend/ with `npm run api:types`
type Schemas = components["schemas"];

export type Festival = Schemas["Festival"];
export type Application = Schemas["Application"];
export type ApplicationWithDeadline = Schemas["ApplicationWithDeadline"];
export type Deadline = Schemas["Deadline"];
export type Overview = Schemas["Overview"];
export type FestivalDetails = Schemas["FestivalDetails"];
export type FestivalList = Schemas["FestivalList"];
export type Seasons = Schemas["Seasons"];

export type Show = Schemas["Show"];
export type ScheduleItem = Schemas["ScheduleItem"];
export type Guest = Schemas["Guest"];
export type ScheduleTemplate = Schemas["ScheduleTemplate"];
export type ShowDetails = Schemas["ShowDetails"];
export type ShowList = Schemas["ShowList"];

export type CalculatorItem = Schemas["CalculatorItem"];
export type CalculatorInquiry = Schemas["CalculatorInquiry"];
export type CalculatorData = Schemas["CalculatorData"];

export type AuthStatus = Schemas["AuthStatus"];
export type CurrentUser = Schemas["CurrentUser"];
export type LoginOut = Schemas["LoginOut"];
export type User = Schemas["UserOut"];
export type Created = Schemas["Created"];
