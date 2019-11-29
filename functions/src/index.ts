import { createUser } from "./functions/createUser";

import {
  onCreateMonthlyTransactions,
  onAddNewTransaction,
  onUpdateTransaction,
  onDeleteTransaction
} from "./functions/transactions";

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
// export const helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

export const createFirestoreUser = createUser;

export const updateMonthlyTransactionDoc = onCreateMonthlyTransactions;

export const addNewTransaction = onAddNewTransaction;

export const updateExistingTransaction = onUpdateTransaction;

export const deleteTransaction = onDeleteTransaction;
