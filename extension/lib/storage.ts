// ─── Storage helpers for Clipper chrome.storage.local ───

declare const chrome: any;

export interface Destination {
  type: 'google_sheets' | 'notion' | 'airtable' | string;
  name: string;
  tableId: string;
  tableName: string;
  icon?: string;
}

export interface NotionDatabase {
  id: string;
  name: string;
}

export interface AirtableTable {
  baseId: string;
  baseName: string;
  tableId: string;
  tableName: string;
}

export const DEFAULT_SHEETS_DESTINATION: Destination = {
  type: 'google_sheets',
  name: 'Google Sheets',
  tableId: 'default_sheet',
  tableName: 'My Clips',
  icon: '📊',
};

export async function getDefaultDestination(): Promise<Destination> {
  return new Promise((resolve) => {
    if (typeof chrome === 'undefined' || !chrome.storage?.local) {
      resolve(DEFAULT_SHEETS_DESTINATION);
      return;
    }
    chrome.storage.local.get(['default_destination'], (res: any) => {
      resolve(res.default_destination || DEFAULT_SHEETS_DESTINATION);
    });
  });
}

export async function setDefaultDestination(dest: Destination): Promise<void> {
  return new Promise((resolve) => {
    if (typeof chrome === 'undefined' || !chrome.storage?.local) {
      resolve();
      return;
    }
    chrome.storage.local.set({ default_destination: dest }, resolve);
  });
}

export async function getConnectedDestinations(): Promise<Destination[]> {
  return new Promise((resolve) => {
    if (typeof chrome === 'undefined' || !chrome.storage?.local) {
      resolve([DEFAULT_SHEETS_DESTINATION]);
      return;
    }
    chrome.storage.local.get(['connected_destinations'], (res: any) => {
      const list = res.connected_destinations || [];
      if (list.length === 0) {
        resolve([DEFAULT_SHEETS_DESTINATION]);
      } else {
        resolve(list);
      }
    });
  });
}

export async function getNotionDatabases(): Promise<NotionDatabase[]> {
  return new Promise((resolve) => {
    if (typeof chrome === 'undefined' || !chrome.storage?.local) {
      resolve([]);
      return;
    }
    chrome.storage.local.get(['notion_databases'], (res: any) => {
      resolve(res.notion_databases || []);
    });
  });
}

export async function getAirtableTables(): Promise<AirtableTable[]> {
  return new Promise((resolve) => {
    if (typeof chrome === 'undefined' || !chrome.storage?.local) {
      resolve([]);
      return;
    }
    chrome.storage.local.get(['airtable_tables'], (res: any) => {
      resolve(res.airtable_tables || []);
    });
  });
}
