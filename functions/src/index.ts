import { createUser, onDeleteUser } from "./functions/users";

import {
  onAddNewTransaction,
  onUpdateTransaction,
  onDeleteTransaction
} from "./functions/transactions";
import { geosuggestions } from "./functions/geosuggestions";
import * as QueryFunctions from "./functions/query";
import * as ReportingFunctions from "./functions/report";
import { getUpcomingTransactions } from "./functions/scheduled";

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
// export const helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

export const createFirestoreUser = createUser;

export const deleteFirestoreUser = onDeleteUser;

export const addNewTransaction = onAddNewTransaction;

export const updateExistingTransaction = onUpdateTransaction;

export const deleteTransaction = onDeleteTransaction;

export const getGeosuggestions = geosuggestions;

export const getCurrentSummaryforTransactions =
  QueryFunctions.getCurrentTransactionSummary;

export const getAllTransactions = QueryFunctions.getTransactions;

export const getUserScheduledTransactions =
  QueryFunctions.getScheduledTransactions;

export const deleteUserScheduledTransactions =
  QueryFunctions.deleteScheduledTransaction;

export const runScheduledGetQueueTransactions = getUpcomingTransactions;

export const getUserStats = QueryFunctions.getUserStats;

export const getUserReport = ReportingFunctions.getAllTaxDeductibleItems;
