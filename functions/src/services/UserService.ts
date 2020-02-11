import admin from "firebase-admin";
import moment from "moment";

import { DateRange } from "../utils/generalUtils";

import { TransactionTypes, Transaction } from "../types/Transaction";

/**
 * get's a users Categories defined for the budget app
 *
 * @param db The firestore instance
 * @param uid The user's uid (via context.auth.uid)
 * @param type (the type of transaction income/expense)
 */
export const getUserCategories = (
  db: admin.firestore.Firestore,
  uid: string,
  type: TransactionTypes
): Promise<admin.firestore.QuerySnapshot> => {
  return db.collection(`/users/${uid}/categories/${type}/types`).get();
};

/**
 * get's a users Categories defined for the budget app
 *
 * @param db The firestore instance (DO NOT PASS A FIRESTORE REFERENCE)
 * @param uid The user's uid (via context.auth.uid)
 * @param type (the type of transaction income/expense)
 * @param date - date object
 * @param dateRange the range see DateRange type
 */
export const getUserTransactions = (
  db: admin.firestore.Firestore,
  uid: string,
  type: TransactionTypes | null = null,
  date: moment.Moment = moment(),
  dateRange: DateRange
): Promise<admin.firestore.QuerySnapshot> => {
  const firestoreMonth = `${date.year()}-${date.month() + 1}`;
  const { startDate, endDate } = dateRange;

  if (type === null) {
    return db
      .collection(`/users/${uid}/budget/${firestoreMonth}/transactions`)
      .where(
        "timestamp",
        ">",
        admin.firestore.Timestamp.fromDate(startDate.toDate())
      )
      .where(
        "timestamp",
        "<",
        admin.firestore.Timestamp.fromDate(endDate.toDate())
      )
      .orderBy("timestamp", "desc")
      .get();
  }
  return db
    .collection(`/users/${uid}/budget/${firestoreMonth}/transactions`)
    .where(
      "timestamp",
      ">",
      admin.firestore.Timestamp.fromDate(startDate.toDate())
    )
    .where(
      "timestamp",
      "<",
      admin.firestore.Timestamp.fromDate(endDate.toDate())
    )
    .where("type", "==", type)
    .orderBy("timestamp", "desc")
    .get();
};

export const createTransaction = (
  db: admin.firestore.Firestore,
  uid: string,
  transaction: Transaction
) => {
  let timestamp: moment.Moment;
  if (typeof transaction.timestamp === "string") {
    timestamp = moment(transaction.timestamp);
  } else {
    timestamp = moment(transaction.timestamp.toDate());
  }

  const firestoreMonth = `${timestamp.year()}-${timestamp.month() + 1}`;

  return db
    .collection(`/users/${uid}/budget/${firestoreMonth}/transactions`)
    .add({
      category:
        typeof transaction.category === "string"
          ? transaction.category
          : transaction.category.id,
      amount: transaction.amount,
      description: transaction.description,
      taxDeductible: transaction.taxDeductible,
      type: transaction.type,
      receipt: transaction.receipt,
      recurringDays: transaction.recurringDays,
      timestamp: admin.firestore.Timestamp.fromDate(timestamp.toDate())
    });
};

export default { createTransaction, getUserCategories, getUserTransactions };
