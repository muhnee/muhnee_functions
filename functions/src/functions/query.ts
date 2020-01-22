import * as functions from "firebase-functions";
import admin from "firebase-admin";
import { HttpsError } from "firebase-functions/lib/providers/https";
import { CategoryMap } from "../types";

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
