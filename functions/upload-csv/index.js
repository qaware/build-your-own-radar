const functions = require('firebase-functions')

const admin = require('firebase-admin')
admin.initializeApp(functions.config().firebase)

exports.uploadCsv = functions.https.onRequest((request, response) => {
  if (request.method !== 'POST') {
    // Return a "method not allowed" error
    return response.status(405).end();
  }

  return response.status(201).end();
});
