import admin from "firebase-admin";

/**
 * deletes the entire collection
 *
 * @param collectionPath the collection reference in firestore
 * @param batchSize the maximum amount of documents to be delete in a single time
 */
export const deleteCollection = (
  db: admin.firestore.Firestore,
  collectionPath: string,
  batchSize: number = 20
) => {
  const collectionRef: admin.firestore.CollectionReference = db.collection(
    collectionPath
  );
  const query: admin.firestore.Query = collectionRef
    .orderBy("__name__")
    .limit(batchSize);

  return new Promise((resolve, reject) => {
    deleteQueryBatch(db, query, batchSize, resolve, reject);
  });
};

export const deleteQueryBatch = (
  db: admin.firestore.Firestore,
  query: admin.firestore.Query,
  batchSize: number,
  resolve: (value?: unknown) => void,
  reject: (reason?: any) => void
) => {
  query
    .get()
    .then(snapshot => {
      // When there are no documents left, we are done
      if (snapshot.size === 0) {
        return 0;
      }

      // Delete documents in a batch
      const batch = db.batch();
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      return batch.commit().then(() => {
        return snapshot.size;
      });
    })
    .then(numDeleted => {
      if (numDeleted === 0) {
        resolve();
        return;
      }

      // Recurse on the next process tick, to avoid
      // exploding the stack.
      process.nextTick(() => {
        deleteQueryBatch(db, query, batchSize, resolve, reject);
      });
    })
    .catch(reject);
};
