import * as functions from "firebase-functions";
import { HttpsError } from "firebase-functions/lib/providers/https";
import moment from "moment";

import admin from "firebase-admin";

const db = admin.firestore();

export const getUpcomingTransactions = functions.pubsub
  .schedule("0 0 * * *")
  .timeZone("Australia/Melbourne")
  .onRun(async () => {
    const date = moment();

    const startOfDay = moment(date.startOf("day"));
    const endOfDay = moment(date.endOf("day"));

    const firestoreMonth = `${date.year()}-${date.month() + 1}`;

    await db
      .collection("users")
      .get()
      .then(userSnapshot => {
        userSnapshot.forEach(userDoc => {
          const uid = userDoc.id;
          return db
            .collection(`/users/${uid}/queue`)
            .where(
              "timestamp",
              ">=",
              admin.firestore.Timestamp.fromDate(startOfDay.toDate())
            )
            .where(
              "timestamp",
              "<=",
              admin.firestore.Timestamp.fromDate(endOfDay.toDate())
            )
            .get()
            .then(snapshot => {
              snapshot.forEach(doc => {
                return db
                  .collection(
                    `/users/${uid}/budget/${firestoreMonth}/transactions`
                  )
                  .add({
                    ...doc.data().transaction,
                    timestamp: doc.data().timestamp
                  })
                  .then(() => {
                    return doc.ref.delete();
                  })
                  .catch(err => {
                    console.error(err);
                    throw new HttpsError("internal", err);
                  });
              });
            })
            .catch(err => {
              console.error(err);
              throw new HttpsError("internal", err);
            });
        });
      })
      .catch(err => {
        console.error(err);
        throw new HttpsError("internal", err);
      });
  });
