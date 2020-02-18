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
    let transactions: Transaction[] = [];

    // const startTimestamp: admin.firestore.Timestamp = admin.firestore.Timestamp.fromDate(
    //   startMoment.toDate()
    // );
    const monthSnapshot = await db
      .collection(`/users/${user}/budget`)
      .where(
        "timestamp",
        ">=",
        admin.firestore.Timestamp.fromDate(startMoment.toDate())
      )
      .where(
        "timestamp",
        "<",
        admin.firestore.Timestamp.fromDate(startMoment.add(1, "year").toDate())
      )
      .get();

    const months = monthSnapshot.docs.map(doc => doc);

    await months.forEach(async monthDoc => {
      console.log(monthDoc.id);
      await monthDoc.ref
        .collection("transactions")
        .where("type", "==", "expense")
        .where("taxDeductible", "==", true)
        .get()
        .then(transactionSnapshot => {
          console.log(transactionSnapshot.size);
          const monthTransactions = transactionSnapshot.docs.map(
            transactionDoc => {
              const docData = transactionDoc.data();

              const category: Category = categoryMap.expense[docData.category];

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
                id: transactionDoc.id,
                recurringDays: docData.recurringDays
              };
              return transaction;
            }
          );
          transactions = [...transactions, ...monthTransactions];
        })
        .catch(err => {
          console.error(err);
        });
    });
    console.log("done!");

    return transactions;
  }
);
