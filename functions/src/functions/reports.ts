import * as functions from "firebase-functions";
import { HttpsError } from "firebase-functions/lib/providers/https";
import moment from "moment";

import admin from "firebase-admin";
import { Transaction } from "../types/Transaction";
import * as UserService from "../services/UserService";
import { CategoryMap, Category } from "../types";
import { ReportResponse } from "../types/response";

const db = admin.firestore();

export const getAllTaxDeductibleItem = functions.https.onCall(
  async (data, context) => {
    const start = data.start;

    if (!moment(start, moment.ISO_8601).isValid()) {
      throw new HttpsError("invalid-argument", "year must be a number");
    }

    if (!context.auth) {
      throw new HttpsError("unauthenticated", "User unauthenticated");
    }

    const user = context.auth.uid;

    const expenseCategories: FirebaseFirestore.QuerySnapshot = await UserService.getUserCategories(
      db,
      context.auth.uid,
      "expense"
    );

    const categoryMap: CategoryMap = { income: {}, expense: {} };

    expenseCategories.docs.forEach(doc => {
      const docData = doc.data();

      categoryMap.expense[doc.id] = {
        id: doc.id,
        name: docData.name,
        icon: docData.icon
      };
    });

    const startMoment = moment(start);

    const startTimestamp: admin.firestore.Timestamp = admin.firestore.Timestamp.fromDate(
      startMoment.toDate()
    );
    const endTimestamp: admin.firestore.Timestamp = admin.firestore.Timestamp.fromDate(
      startMoment.add(1, "year").toDate()
    );

    const transactions = await db
      .collection(`/users/${user}/budget`)
      .where("timestamp", ">=", startTimestamp)
      .where("timestamp", "<", endTimestamp)
      .get()
      .then(monthSnapshots => monthSnapshots.docs.map(snap => snap.ref))
      .then(months => {
        return Promise.all(
          months.map(monthSnap =>
            monthSnap
              .collection("transactions")
              .where("type", "==", "expense")
              .where("taxDeductible", "==", true)
              .get()
              .then(doc => doc.docs)
          )
        );
      })
      .then(res => Promise.all(res))
      .then(docs =>
        ([] as FirebaseFirestore.QueryDocumentSnapshot[]).concat(...docs)
      )
      .then(trans => {
        return trans.map((doc: admin.firestore.QueryDocumentSnapshot) => {
          const docData = doc.data();
          const category: Category =
            docData.type === "expense"
              ? categoryMap.expense[docData.category]
              : categoryMap.income[docData.category];
          const firestoreTimestamp: admin.firestore.Timestamp =
            docData.timestamp;
          const transaction: Transaction = {
            type: docData.type,
            amount: docData.amount,
            description: docData.description,
            category: category,
            categoryName: category.name,
            taxDeductible: docData.taxDeductible,
            timestamp: moment(firestoreTimestamp.toDate()).toISOString(),
            id: doc.id,
            recurringDays: docData.recurringDays,
            receipt: docData.receipt
          };
          return transaction;
        });
      });

    const resp: ReportResponse<Transaction[]> = {
      timestamp: moment().toISOString(),
      data: transactions
    };
    return resp;
  }
);
