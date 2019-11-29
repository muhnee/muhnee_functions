import * as functions from "firebase-functions";
import admin from "firebase-admin";

const db = admin.firestore();

export const onCreateMonthlyTransactions = functions.firestore
  .document("users/{userId}/budget/{month}")
  .onCreate(async (change, context) => {
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
            expenses: dataFromCurrentMonth.expenses + transaction.amount
          });
      } else if (transaction.type === "income") {
        await db
          .collection("users")
          .doc(context.params.userId)
          .collection("budget")
          .doc(context.params.month)
          .update({
            income: dataFromCurrentMonth.income + transaction.amount
          });
      }
    }
  });

export const onUpdateTransaction = functions.firestore
  .document("users/{userId}/budget/{month}/transactions/{transaction}")
  .onUpdate(async (change, context) => {
    const previousValue = change.before.data();
    const newValue = change.after.data();

    // get current month data
    const currentMonth = await db
      .collection("users")
      .doc(context.params.userId)
      .collection("budget")
      .doc(context.params.month)
      .get();

    if (currentMonth.exists) {
      const dataFromCurrentMonth: any = currentMonth.data();
      if (previousValue && newValue) {
        if (previousValue.type === "expense") {
          await db
            .collection("users")
            .doc(context.params.userId)
            .collection("budget")
            .doc(context.params.month)
            .update({
              expenses: dataFromCurrentMonth.expense - previousValue.expense
            });
        }

        if (previousValue.type === "income") {
          await db
            .collection("users")
            .doc(context.params.userId)
            .collection("budget")
            .doc(context.params.month)
            .update({
              expenses: dataFromCurrentMonth.income - previousValue.income
            });
        }

        if (newValue.type === "expense") {
          await db
            .collection("users")
            .doc(context.params.userId)
            .collection("budget")
            .doc(context.params.month)
            .update({
              expenses: dataFromCurrentMonth.expense + newValue.expense
            });
        }

        if (newValue.type === "income") {
          await db
            .collection("users")
            .doc(context.params.userId)
            .collection("budget")
            .doc(context.params.month)
            .update({
              expenses: dataFromCurrentMonth.income + newValue.income
            });
        }
      }
    }
  });

export const onDeleteTransaction = functions.firestore
  .document("users/{userId}/budget/{month}/transactions/{transaction}")
  .onDelete(async (snap, context) => {
    const deletedValue = snap.data();

    // get current month data
    const currentMonth = await db
      .collection("users")
      .doc(context.params.userId)
      .collection("budget")
      .doc(context.params.month)
      .get();

    if (currentMonth.exists && deletedValue) {
      const dataFromCurrentMonth: any = currentMonth.data();
      if (deletedValue.type === "expense") {
        await db
          .collection("users")
          .doc(context.params.userId)
          .collection("budget")
          .doc(context.params.month)
          .update({
            expenses: dataFromCurrentMonth.expense - deletedValue.expense
          });
      }

      if (deletedValue.type === "income") {
        await db
          .collection("users")
          .doc(context.params.userId)
          .collection("budget")
          .doc(context.params.month)
          .update({
            expenses: dataFromCurrentMonth.income - deletedValue.income
          });
      }
    }
  });
