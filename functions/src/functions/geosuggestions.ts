import googleMaps, { PlaceSearchResult } from "@google/maps";
import * as functions from "firebase-functions";

export const geosuggestions = functions.https.onCall(async (data, context) => {
  const longitude = data.longitude;
  const latitude = data.latitude;

  const client = googleMaps.createClient({
    key: functions.config().googleapis.key,
    Promise: Promise
  });



  const searchInfo: PlaceSearchResult[] = await client
    .placesNearby({
      location: { latitude, longitude },
      type: "establishment",
      rankby: 'distance'
    })
    .asPromise()
    .then(resp => resp.json.results)
    .then();

  return searchInfo;
});
