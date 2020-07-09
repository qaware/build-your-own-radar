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
  console.info('Open Firestore collection ' + name);
  const collection = admin.firestore().collection(name);
  collection.listDocuments().then(val => {
    val.map((val) => {
      val.delete()
    })
  })
  const data = request.rawBody;
  const csv = data.toString();

  console.info('Converting CSV to JSON.');
  csvtojson({ delimiter: [';', ','] }).fromString(csv).then((jsondata) => {
    console.info('Adding radar data to Firestore collection ' + name);
    
    jsondata.forEach(function (item) {
      collection.add(item).catch(function (error) {
        console.error('Error adding radar data.', error)
      });
    });

    return response.status(202).end();
  });

});
