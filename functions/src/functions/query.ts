import * as functions from "firebase-functions";
import moment from "moment";
import admin from "firebase-admin";
import { HttpsError } from "firebase-functions/lib/providers/https";
import { Transaction } from "../types/Transaction";
import { CategoryMap, Category } from "../types";

const db = admin.firestore();

type CategorySummary = {
  id: string;
  name: string;
  icon?: string;
  amount: number;
  transactions: Transaction[];
};

export const getCurrentTransactionSummary = functions.https.onCall(
  async (data, context) => {
    const summaryType = data.summaryType;
    const transactionType = data.transactionType;

    const date = data.date ? moment(data.date) : moment();

    const summaryTypes = ["week", "month", "year"];

    const transactionTypes = ["income", "expense"];

    const firestoreMonth = `${date.year()}-${date.month() + 1}`;
    if (context.auth) {
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
        .collection("categories")
        .doc(transactionType)
        .collection("types")
        .get();

      const categoryMap: {
        [id: string]: CategorySummary;
      } = {};

      categories.docs.forEach(doc => {
        let docData = doc.data();
        categoryMap[doc.id] = {
          id: doc.id,
          name: docData.name,
          icon: docData.icon,
          amount: 0,
          transactions: []
        };
      });

      let startDate = moment().startOf("week");
      let endDate = moment().endOf("week");

      if (summaryType === "week") {
        startDate = moment().startOf("week");
        endDate = moment().endOf("week");
      }
      if (summaryType === "month") {
        startDate = moment().startOf("month");
        endDate = moment().endOf("month");
      }
      if (summaryType === "year") {
        startDate = moment().startOf("year");
        endDate = moment().endOf("year");
      }

      const transactionDocs: FirebaseFirestore.QuerySnapshot = await db
        .collection("users")
        .doc(user)
        .collection("budget")
        .doc(firestoreMonth)
        .collection("transactions")
        .where("type", "==", transactionType)
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

      transactionDocs.docs.forEach(doc => {
        let docData = doc.data();

        let category: Category = {
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
    throw new HttpsError("unauthenticated", "User unauthenticated");
  }
);

export const getTransactions = functions.https.onCall(async (data, context) => {
  const summaryType = data.summaryType;
  const summaryTypes = ["week", "month"];
  const date: moment.Moment = data.date ? moment(data.date) : moment();

  if (context.auth) {
    const firestoreMonth = `${date.year()}-${date.month() + 1}`;

    if (!summaryTypes.includes(summaryType)) {
      throw new HttpsError(
        "invalid-argument",
        `summaryType must one of ${JSON.stringify(summaryTypes)}`
      );
    }
    const userRef = db.collection("users").doc(context.auth.uid);

    const expenseCategories: FirebaseFirestore.QuerySnapshot = await userRef
      .collection("categories")
      .doc("expense")
      .collection("types")
      .get();

    const incomeCategories: FirebaseFirestore.QuerySnapshot = await userRef
      .collection("categories")
      .doc("income")
      .collection("types")
      .get();

    const categoryMap: CategoryMap = { income: {}, expense: {} };

    incomeCategories.docs.forEach(doc => {
      let docData = doc.data();

      categoryMap.income[doc.id] = {
        id: doc.id,
        name: docData.name,
        icon: docData.icon
      };
    });

    expenseCategories.docs.forEach(doc => {
      let docData = doc.data();

      categoryMap.expense[doc.id] = {
        id: doc.id,
        name: docData.name,
        icon: docData.icon
      };
    });

    let startDate = moment().startOf("week");
    let endDate = moment().endOf("week");

    if (summaryType === "week") {
      startDate = moment().startOf("week");
      endDate = moment().endOf("week");
    }
    if (summaryType === "month") {
      startDate = moment().startOf("month");
      endDate = moment().endOf("month");
    }

    const transactionDocs: FirebaseFirestore.QuerySnapshot = await userRef
      .collection("budget")
      .doc(firestoreMonth)
      .collection("transactions")
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

    const result: Transaction[] = [];

    transactionDocs.forEach(doc => {
      let docData = doc.data();

      let category: Category =
        docData.type === "expense"
          ? categoryMap.expense[docData.category]
          : categoryMap.income[docData.category];

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

      result.push(transaction);
    });

    return result;
  }
  throw new HttpsError("unauthenticated", "User unauthenticated");
});
