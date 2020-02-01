import firebase from "firebase-admin";
import { Category } from ".";
export type TransactionTypes = "expense" | "income";

export type RecurringDays = 0 | 1 | 2 | 5 | 7 | 14 | 21 | 32;

export interface Transaction {
  /**
   * The category of transaction
   * the category is a UID to the doc found in the collection
   * `/users/{uid}/categories/{type}/types/`
   */
  category: string | Category;

  categoryName?: string;

  /**
   * The amount of the transaction
   */
  amount: number;

  /**
   * The Description of the transaction
   */
  description?: string;

  /**
   * Timestamp
   */
  timestamp: firebase.firestore.Timestamp | string;

  /**
   * Whether or not the item is tax deductable
   */
  taxDeductible: boolean;

  /**
   * The type of transaction
   */
  type: TransactionTypes;

  /**
   * The Firestore Storage Link to the Upload
   */
  receipt?: string | null;

  /**
   * Firestore ID (used in some places)
   */
  id?: string;

  /**
   * How many days does the transaction repeat itself
   */
  recurringDays?: RecurringDays;
}
