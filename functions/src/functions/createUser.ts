import * as functions from "firebase-functions";
import admin from "firebase-admin";

import moment from "moment";

admin.initializeApp(functions.config().firebase);

export const createUser = functions.auth.user().onCreate(async user => {
  const db = admin.firestore();

  const { uid, email, displayName, emailVerified, photoURL } = user;
  await db
    .collection("users")
    .doc(user.uid)
    .set({
      uid,
      email,
      displayName,
      emailVerified,
      photoURL,
      onboarded: false
    });

  await db
    .collection("users")
    .doc(user.uid)
    .collection("budget")
    .doc(
      `${moment()
        .year()
        .toString()}-${moment()
        .month()
        .toString()}`
    )
    .set({ year: moment().year(), month: moment().month() });

  await db
    .collection("users")
    .doc(user.uid)
    .collection("categories")
    .doc("expense")
    .collection("types")
    .add({ name: "Food" });

  await db
    .collection("users")
    .doc(user.uid)
    .collection("categories")
    .doc("expense")
    .collection("types")
    .add({ name: "Bills" });

  await db
    .collection("users")
    .doc(user.uid)
    .collection("categories")
    .doc("income")
    .collection("types")
    .add({ name: "Income" });
});
