/**
 * Types and utilities for scraping operations
 */

export interface ScrapedRecord {
  [key: string]: any;
}

export interface BatchOperation {
  sql: string;
  args: any[];
}
