import * as functions from "firebase-functions";
import admin from "firebase-admin";

export const onCreateMonthlyTransactions = functions.firestore
  .document("users/{userId}/budget/{month}")
  .onCreate(async (change, context) => {
    const db = admin.firestore();

    const month = context.params.month;

    await db
      .collection("users")
      .doc(context.params.userId)
      .collection("budget")
      .doc(context.params.month)
      .update({
        year: month.split("-")[0],
        month: month.split("-")[1],
        expenses: 0,
        income: 0
      });
  });

export const onAddNewTransaction = functions.firestore
  .document("users/{userId}/budget/{month}/transactions/{transaction}")
  .onCreate(async (snapshot, context) => {
    const db = admin.firestore();

    const month = context.params.month;

    // get current month data
    const currentMonth = await db
      .collection("users")
      .doc(context.params.userId)
      .collection("budget")
      .doc(context.params.month)
      .get();

    if (currentMonth.exists) {
      const dataFromCurrentMonth: any = currentMonth.data();

      const transaction: any = snapshot.data();

      if (transaction.type === "expense") {
        await db
          .collection("users")
          .doc(context.params.userId)
          .collection("budget")
          .doc(context.params.month)
          .update({
            year: month.split("-")[0],
            month: month.split("-")[1],
            expenses: dataFromCurrentMonth.expenses + transaction.amount
          });
      } else if (transaction.type === "income") {
        await db
          .collection("users")
          .doc(context.params.userId)
          .collection("budget")
          .doc(context.params.month)
          .update({
            year: month.split("-")[0],
            month: month.split("-")[1],
            income: dataFromCurrentMonth.income + transaction.amount
          });
      }
    }
  });
