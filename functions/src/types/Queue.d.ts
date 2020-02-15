import admin from "firebase-admin";
import { Transaction } from "./Transaction";

export interface QueueItem {
  /**
   * the timestamp of the item
   */
  timestamp: admin.firestore.Timestamp;

  /**
   * The transaction item
   */
  transaction?: Transaction;
}

export interface QueueItemResponse {
  id?: string;
  timestamp: string;
  transaction?: Transaction;
}

export default QueueItem;
