import type { components } from "./schema";

// The data types of the API, generated from backend/ with `npm run api:types`
type Schemas = components["schemas"];

export type Festival = Schemas["Festival"];
export type Application = Schemas["Application"];
export type ApplicationWithDeadline = Schemas["ApplicationWithDeadline"];
export type Deadline = Schemas["Deadline"];
export type Overview = Schemas["Overview"];
export type FestivalDetails = Schemas["FestivalDetails"];
export type FestivalSave = Schemas["FestivalSaveIn"];
export type FestivalList = Schemas["FestivalList"];
export type Seasons = Schemas["Seasons"];

export type Show = Schemas["Show"];
export type ScheduleItem = Schemas["ScheduleItem"];
export type Guest = Schemas["Guest"];
export type ScheduleTemplate = Schemas["ScheduleTemplate"];
export type TemplatesSave = Schemas["TemplatesSaveIn"];
export type ShowDetails = Schemas["ShowDetails"];
export type ShowList = Schemas["ShowList"];
export type ShowPacking = Schemas["ShowPacking"];
export type ShowContact = Schemas["ShowContact"];
export type ShowContacts = Schemas["ShowContactsIn"];
export type ContactShow = Schemas["ContactShow"];

export type Contact = Schemas["Contact"];
export type ContactRef = Schemas["ContactRef"];
export type ContactLink = Schemas["ContactLink"];
export type ContactDetails = Schemas["ContactDetails"];
export type ContactList = Schemas["ContactList"];
export type ContactCreate = Schemas["ContactIn"];
export type ContactSave = Schemas["ContactSaveIn"];

export type PackingList = Schemas["PackingList"];
export type PackingListCategory = Schemas["PackingListCategory"];
export type PackingListItem = Schemas["PackingListItem"];
export type PackingListGroup = Schemas["PackingListGroup"];
export type PackingListSummary = Schemas["PackingListSummary"];
export type PackingListDetails = Schemas["PackingListDetails"];
export type PackingListSave = Schemas["PackingListSaveIn"];

export type CalculatorItem = Schemas["CalculatorItem"];
export type CalculatorInquiry = Schemas["CalculatorInquiry"];
export type CalculatorData = Schemas["CalculatorData"];

export type AuthStatus = Schemas["AuthStatus"];
export type CurrentUser = Schemas["CurrentUser"];
export type LoginOut = Schemas["LoginOut"];
export type User = Schemas["UserOut"];
export type Created = Schemas["Created"];
