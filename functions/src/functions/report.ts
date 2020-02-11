import * as functions from "firebase-functions";
import { HttpsError } from "firebase-functions/lib/providers/https";
import moment from "moment";

import * as GeneralUtils from "../utils/generalUtils";
import admin from "firebase-admin";

const db = admin.firestore();

export const getAllTaxDeductibleItems = functions.https.onCall(
  async (data, context) => {
    const start = data.start;
    const type = data.type;

    const reportTypes = ["financial", "full"];

    if (!GeneralUtils.isIsoDate(start)) {
      throw new HttpsError("invalid-argument", "year must be a number");
    }

    if (!reportTypes.includes(type)) {
      throw new HttpsError(
        "invalid-argument",
        `types must be one of ${JSON.stringify(reportTypes)}`
      );
    }

    if (!context.auth) {
      throw new HttpsError("unauthenticated", "User unauthenticated");
    }

    const user = context.auth.uid;

    const startMoment = moment(start);

    const startTimestamp: admin.firestore.Timestamp = admin.firestore.Timestamp.fromDate(
      startMoment.toDate()
    );
    const months = await db
      .collection(`/users/${user}/budget`)
      .where("year", ">=", startMoment.year())
      .where("year", "<=", startMoment.year() + 1)
      .where();
  }
);
