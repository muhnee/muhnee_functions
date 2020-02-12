import * as functions from "firebase-functions";
import moment from "moment";
import admin from "firebase-admin";
import { HttpsError } from "firebase-functions/lib/providers/https";
import { Transaction } from "../types/Transaction";
import { CategoryMap, Category, CategorySummary } from "../types";
import { QueueItemResponse } from "../types/Queue";

import * as GeneralUtils from "../utils/generalUtils";
import * as UserService from "../services/UserService";

const db = admin.firestore();

export const getCurrentTransactionSummary = functions.https.onCall(
  async (data, context) => {
    const summaryType = data.summaryType;
    const transactionType = data.transactionType;

    const date = data.date ? moment(data.date) : moment();

    const summaryTypes = ["week", "month", "year"];

    const transactionTypes = ["income", "expense"];

    if (!context.auth) {
      throw new HttpsError("unauthenticated", "User unauthenticated");
    }
    // Cannot run this locally as
    // Emulation of context.auth is currently unavailable.
    const user = context.auth.uid;

    if (!summaryTypes.includes(summaryType)) {
      throw new HttpsError(
        "invalid-argument",
        `summaryType must one of ${JSON.stringify(summaryTypes)}`
      );
    }
    if (!transactionTypes.includes(transactionType)) {
      throw new HttpsError(
        "invalid-argument",
        `transactionType must one of ${JSON.stringify(transactionTypes)}`
      );
    }

    const userRef = db.collection("users").doc(user);

    const categories: FirebaseFirestore.QuerySnapshot = await userRef
      .collection(`/categories/${transactionType}/types`)
      .get();

    const categoryMap: {
      [id: string]: CategorySummary;
    } = {};

    categories.docs.forEach(doc => {
      const docData = doc.data();
      categoryMap[doc.id] = {
        id: doc.id,
        name: docData.name,
        icon: docData.icon,
        amount: 0,
        transactions: []
      };
    });

    const dateRange = GeneralUtils.getDateRange(date, summaryType);

    const transactionDocs: FirebaseFirestore.QuerySnapshot = await UserService.getUserTransactions(
      db,
      context.auth.uid,
      transactionType,
      date,
      dateRange
    );

    transactionDocs.docs.forEach(doc => {
      const docData = doc.data();

      const category: Category = {
        id: categoryMap[docData.category].id,
        name: categoryMap[docData.category].name,
        icon: categoryMap[docData.category].icon
      };

      const transaction: Transaction = {
        type: docData.type,
        amount: docData.amount,
        description: docData.description,
        category: category,
        taxDeductible: docData.taxDeductible,
        timestamp: docData.timestamp,
        id: doc.id,
        recurringDays: docData.recurringDays
      };

      if (transaction.category) {
        categoryMap[docData.category].amount += transaction.amount;
        categoryMap[docData.category].transactions.push(transaction);
      }
    });

    const summary: CategorySummary[] = Object.keys(categoryMap)
      .map(key => categoryMap[key])
      .sort((a, b) => (a.amount > b.amount ? -1 : 1));
    return summary;
  }
);

export const getTransactions = functions.https.onCall(async (data, context) => {
  const summaryType = data.summaryType;
  const summaryTypes = ["week", "month"];
  const date: moment.Moment = data.date ? moment(data.date) : moment();

  if (!context.auth) {
    throw new HttpsError("unauthenticated", "User unauthenticated");
  }

  if (!summaryTypes.includes(summaryType)) {
    throw new HttpsError(
      "invalid-argument",
      `summaryType must one of ${JSON.stringify(summaryTypes)}`
    );
  }

  const expenseCategories: FirebaseFirestore.QuerySnapshot = await UserService.getUserCategories(
    db,
    context.auth.uid,
    "expense"
  );

  const incomeCategories: FirebaseFirestore.QuerySnapshot = await UserService.getUserCategories(
    db,
    context.auth.uid,
    "income"
  );

  const categoryMap: CategoryMap = { income: {}, expense: {} };

  incomeCategories.docs.forEach(doc => {
    const docData = doc.data();

    categoryMap.income[doc.id] = {
      id: doc.id,
      name: docData.name,
      icon: docData.icon
    };
  });

  expenseCategories.docs.forEach(doc => {
    const docData = doc.data();

    categoryMap.expense[doc.id] = {
      id: doc.id,
      name: docData.name,
      icon: docData.icon
    };
  });

  const dateRange = GeneralUtils.getDateRange(date, summaryType);

  const transactionDocs: FirebaseFirestore.QuerySnapshot = await UserService.getUserTransactions(
    db,
    context.auth.uid,
    null,
    date,
    dateRange
  );

  const result: Transaction[] = [];

  transactionDocs.forEach(doc => {
    const docData = doc.data();

    const category: Category =
      docData.type === "expense"
        ? categoryMap.expense[docData.category]
        : categoryMap.income[docData.category];

    const firestoreTimestamp: admin.firestore.Timestamp = docData.timestamp;

    const transaction: Transaction = {
      type: docData.type,
      amount: docData.amount,
      description: docData.description,
      category: category,
      categoryName: category.name,
      taxDeductible: docData.taxDeductible,
      timestamp: moment(firestoreTimestamp.toDate()).toISOString(),
      id: doc.id,
      recurringDays: docData.recurringDays
    };

    result.push(transaction);
  });

  return result;
});

export const getScheduledTransactions = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new HttpsError("unauthenticated", "User unauthenticated");
    }

    const uid = context.auth.uid;

    const userQueue = await db
      .collection(`/users/${uid}/queue`)
      .orderBy("timestamp", "asc")
      .get();

    const result: QueueItemResponse[] = [];

    const expenseCategories: FirebaseFirestore.QuerySnapshot = await UserService.getUserCategories(
      db,
      context.auth.uid,
      "expense"
    );

    const incomeCategories: FirebaseFirestore.QuerySnapshot = await UserService.getUserCategories(
      db,
      context.auth.uid,
      "income"
    );

    const categoryMap: CategoryMap = { income: {}, expense: {} };

    incomeCategories.docs.forEach(doc => {
      const docData = doc.data();

      categoryMap.income[doc.id] = {
        id: doc.id,
        name: docData.name,
        icon: docData.icon
      };
    });

    expenseCategories.docs.forEach(doc => {
      const docData = doc.data();

      categoryMap.expense[doc.id] = {
        id: doc.id,
        name: docData.name,
        icon: docData.icon
      };
    });

    userQueue.forEach(doc => {
      const docData = doc.data();

      const timestamp: admin.firestore.Timestamp = docData.timestamp;

      const createTimestamp = moment(timestamp.toDate()).toISOString();

      const category: Category =
        docData.type === "expense"
          ? categoryMap.expense[docData.transaction.category]
          : categoryMap.income[docData.transaction.category];

      const queueItem: QueueItemResponse = {
        id: doc.id,
        timestamp: createTimestamp,
        transaction: {
          amount: docData.transaction.amount,
          description: docData.transaction.description,
          timestamp: createTimestamp,
          category: category,
          type: docData.transaction.type,
          taxDeductible: docData.transaction.taxDeductible,
          receipt: docData.transaction.receipt,
          recurringDays: docData.transaction.recurringDays
        }
      };

      result.push(queueItem);
    });

    return result;
  }
);
