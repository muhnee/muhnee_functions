import * as functions from "firebase-functions";
import * as utils from "../utils/deleteCollection";
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
      onboarded: false,
      monthlySavingsGoal: 250
    });

  await db
    .collection("users")
    .doc(user.uid)
    .collection("budget")
    .doc(`${moment().year()}-${moment().month() + 1}`)
    .set({ year: moment().year(), month: moment().month() });
});

export const onDeleteUser = functions.auth.user().onDelete(async user => {
  const db = admin.firestore();

  await db
    .collection("users")
    .doc(user.uid)
    .delete();
  const storage = admin.storage();

  await utils.deleteCollection(
    db,
    `/users/${user.uid}/categories/expense/types`,
    20
  );
  await utils.deleteCollection(
    db,
    `/users/${user.uid}/categories/income/types`,
    20
  );
  await utils.deleteCollection(db, `/users/${user.uid}/categories`, 20);
  await utils.deleteCollection(db, `/users/${user.uid}/budget`, 20);

  await storage.bucket().deleteFiles({ prefix: `users/${user.uid}` });
  await db
    .collection("users")
    .doc(user.uid)
    .delete();
});
