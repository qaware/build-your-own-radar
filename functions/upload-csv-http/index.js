const functions = require('firebase-functions')

const admin = require('firebase-admin')
admin.initializeApp(functions.config().firebase)

const csvtojson = require('csvtojson');

exports.uploadCsv = functions.https.onRequest((request, response) => {
  if (request.method !== 'POST') {
    // Return a "method not allowed" error
    return response.status(405).end();
  }

  if (request.get('content-type') !== 'text/csv') {
    // Return a "unsupported media type" error
    return response.status(415).end();
  }

  const name = request.query.name || 'radar-data';
  const collection = admin.firestore().collection(name);

  const data = request.rawBody;
  const csv = data.toString();

  var jsondata = csvtojson().fromString(csv);

  for (var item in jsondata) {
    collection.add(item);
  }

  return response.status(201).end();
});
