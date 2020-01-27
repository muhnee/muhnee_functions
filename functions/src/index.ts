import { createUser, onDeleteUser } from "./functions/users";

import {
  onAddNewTransaction,
  onUpdateTransaction,
  onDeleteTransaction
} from "./functions/transactions";
import { geosuggestions } from "./functions/geosuggestions";
import {
  getSummary,
  getCurrentTransactionSummary,
  getTransactionSummaryMobile
} from "./functions/query";

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

export const getSummaryForTransactions = getSummary;

export const getCurrentSummaryforTransactions = getCurrentTransactionSummary;

export const getCurrentSummaryforTransactionMobile = getTransactionSummaryMobile;
