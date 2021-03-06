import * as functions from "firebase-functions";
import { HttpsError } from "firebase-functions/lib/providers/https";
import moment from "moment";

import * as GeneralUtils from "../utils/generalUtils";
import admin from "firebase-admin";
import { Transaction } from "../types/Transaction";
import * as UserService from "../services/UserService";
import { CategoryMap, Category } from "../types";

const db = admin.firestore();

export const getAllTaxDeductibleItems = functions.https.onCall(
  async (data, context) => {
    const start = data.start;

    if (!GeneralUtils.isIsoDate(start)) {
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
    const transactions: Transaction[] = [];

    // const startTimestamp: admin.firestore.Timestamp = admin.firestore.Timestamp.fromDate(
    //   startMoment.toDate()
    // );
    await db
      .collection(`/users/${user}/budget`)
      .where("year", ">=", startMoment.year())
      .where("year", "<", startMoment.year() + 1)
      .get()
      .then(monthSnapshot => {
        monthSnapshot.docs.forEach(doc => {
          return doc.ref
            .collection("transactions")
            .where("type", "==", "income")
            .where("taxDeductible", "==", true)
            .get()
            .then(transactionSnapshot => {
              transactionSnapshot.docs.forEach(transactionDoc => {
                const docData = transactionDoc.data();

                const category: Category =
                  categoryMap.expense[docData.category];

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
                  recurringDays: docData.recurringDays
                };

                transactions.push(transaction);
                return true;
              });
            });
        });
      });

    return transactions;
  }
);
