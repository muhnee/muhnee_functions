import googleMaps from "@google/maps";
import * as functions from "firebase-functions";

export const geosuggestions = functions.https.onCall(async (data, context) => {
  const longitude = data.longitude;
  const latitude = data.latitude;

  const client = googleMaps.createClient({
    key: functions.config().googleapis.key,
    Promise: Promise
  });

  return await client
    .placesNearby({ location: { latitude, longitude } })
    .asPromise()
    .then(resp => resp.json.results);
});
