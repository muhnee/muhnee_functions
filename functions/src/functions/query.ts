import * as functions from "firebase-functions";
import moment from "moment";
import admin from "firebase-admin";
import { HttpsError } from "firebase-functions/lib/providers/https";
import { CategoryMap } from "../types";
import { Transaction } from "../types/Transaction";

const db = admin.firestore();

export const getSummary = functions.https.onCall(async (data, context) => {
  const month = data.month;

  if (context.auth) {
    // Cannot run this locally as
    // Emulation of context.auth is currently unavailable.
    const user = context.auth.uid;

    const userRef = db.collection("users").doc(user);

    const categoryMap: CategoryMap = { income: {}, expense: {} };

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

    expenseCategories.docs.forEach(doc => {
      let docData = doc.data();
      categoryMap.expense[doc.id] = {
        id: doc.id,
        name: docData.name,
        icon: docData.icon,
        amount: 0
      };
    });

    incomeCategories.docs.forEach(doc => {
      let docData = doc.data();
      categoryMap.income[doc.id] = {
        id: doc.id,
        name: docData.name,
        icon: docData.icon,
        amount: 0
      };
    });

    const transactionDocs: FirebaseFirestore.QuerySnapshot = await userRef
      .collection("budget")
      .doc(month)
      .collection("transactions")
      .get();

    transactionDocs.docs.forEach(doc => {
      let docData = doc.data();

      const amount: number = parseFloat(docData.amount);
      const category = docData.category;

      if (docData.type === "expense" && categoryMap.expense[category]) {
        categoryMap.expense[category].amount += amount;
      } else if (docData.type === "income" && categoryMap.income[category]) {
        categoryMap.income[category].amount += amount;
      }
    });

    return categoryMap;
  }
  throw new HttpsError("unauthenticated", "User unauthenticated");
});

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
        [id: string]: {
          id: string;
          name: string;
          icon: string;
          amount: number;
          transactions: Transaction[];
        };
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

      console.log(firestoreMonth, transactionType);

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
      console.log(transactionDocs);

      transactionDocs.docs.forEach(doc => {
        let docData = doc.data();

        const transaction: Transaction = {
          type: docData.type,
          amount: docData.amount,
          description: docData.description,
          category: docData.category,
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

      return categoryMap;
    }
    throw new HttpsError("unauthenticated", "User unauthenticated");
  }
);
