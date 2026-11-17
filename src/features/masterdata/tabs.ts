// The tabs of the master data. A new kind of master data (e.g. bands) is a new entry here plus its pages under
// /masterdata/<path>. The label is in the messages under "masterdata.tabs.<id>". Contacts are a module of their own.
export const MASTERDATA_TABS = [{ id: "packingLists", href: "/masterdata/packing-lists" }] as const;

export type MasterdataTab = (typeof MASTERDATA_TABS)[number];
