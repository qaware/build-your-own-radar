const admin = require('firebase-admin');
const { Storage } = require('@google-cloud/storage');
const csvtojson = require('csvtojson');

admin.initializeApp();
const db = admin.firestore();

exports.uploadSourceFromStorage = (event, context,callback) => {
  const storage = new Storage();
  const bucket = storage.bucket('techradar-versiondata');

  bucket.file(event.name).download()
    .then(data => {

      // Do something with the contents constant, e.g. derive the value you want to write to Firestore
      var jsondata = csvtojson().fromFile(data[0])
      for(var item in jsondata){
        db.collection(event.name.replace('.csv','')).doc().set(item);
      }
    });
  return callback();
};