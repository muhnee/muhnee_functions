import * as functions from "firebase-functions";
import moment from "moment";
import admin from "firebase-admin";

const db = admin.firestore();

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

    const userDoc = await db
      .collection("users")
      .doc(context.params.userId)
      .get();

    if (currentMonth.exists) {
      const dataFromCurrentMonth: any = currentMonth.data();

      const transaction: any = snapshot.data();

      const transactionType = transaction.type.toLowerCase();
      if (transactionType === "expense") {
        await db
          .collection("users")
          .doc(context.params.userId)
          .collection("budget")
          .doc(context.params.month)
          .update({
            expenses: dataFromCurrentMonth.expenses + transaction.amount
          });
      } else if (transactionType === "income") {
        await db
          .collection("users")
          .doc(context.params.userId)
          .collection("budget")
          .doc(context.params.month)
          .update({
            income: dataFromCurrentMonth.income + transaction.amount
          });
      }
    } else {
      // we create the month then add the transaction
      const { month } = context.params;
      const transaction: any = snapshot.data();

      const userDocument: any = userDoc.data();

      await db
        .collection("users")
        .doc(context.params.userId)
        .collection("budget")
        .doc(context.params.month)
        .set({
          year: month.split("-")[0],
          month: month.split("-")[1],
          expenses: transaction.type === "expense" ? transaction.amount : 0,
          income: transaction.type === "income" ? transaction.amount : 0,
          savingsGoal: userDocument.monthlySavingsGoal || 0,
          timestamp: admin.firestore.Timestamp.fromDate(
            moment(month, "YYYY-MM")
              .startOf("month")
              .toDate()
          )
        });
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
        if (previousValue.type === "expense" && newValue.type === "expense") {
          await db
            .collection("users")
            .doc(context.params.userId)
            .collection("budget")
            .doc(context.params.month)
            .update({
              expenses:
                dataFromCurrentMonth.expenses -
                previousValue.amount +
                newValue.amount
            });
        }

        if (previousValue.type === "income" && newValue.type === "income") {
          await db
            .collection("users")
            .doc(context.params.userId)
            .collection("budget")
            .doc(context.params.month)
            .update({
              income:
                dataFromCurrentMonth.income -
                previousValue.amount +
                newValue.amount
            });
        }

        if (previousValue.type === "expense" && newValue.type === "income") {
          await db
            .collection("users")
            .doc(context.params.userId)
            .collection("budget")
            .doc(context.params.month)
            .update({
              expenses: dataFromCurrentMonth.expenses - previousValue.amount,
              income: dataFromCurrentMonth.income + newValue.amount
            });
        }

        if (previousValue.type === "income" && newValue.type === "expense") {
          await db
            .collection("users")
            .doc(context.params.userId)
            .collection("budget")
            .doc(context.params.month)
            .update({
              income: dataFromCurrentMonth.income - previousValue.amount,
              expenses: dataFromCurrentMonth.expenses + newValue.amount
            });
        }
      }
    }
  });

export const onDeleteTransaction = functions.firestore
  .document("users/{userId}/budget/{month}/transactions/{transaction}")
  .onDelete(async (snap, context) => {
    console.log(snap);
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
            expenses: dataFromCurrentMonth.expenses - deletedValue.amount
          });
      }

      if (deletedValue.type === "income") {
        await db
          .collection("users")
          .doc(context.params.userId)
          .collection("budget")
          .doc(context.params.month)
          .update({
            income: dataFromCurrentMonth.income - deletedValue.amount
          });
      }
    }
  });
