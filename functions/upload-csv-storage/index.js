const functions = require('firebase-functions')
const admin = require('firebase-admin')
admin.initializeApp(functions.config().firebase)
const csvtojson = require('csvtojson')
const { Storage } = require('@google-cloud/storage')
const db = admin.firestore()
exports.uploadSourceFromStorage = (event, context) => {
  const storage = new Storage()
  const bucket = storage.bucket('techradar-versiondata')

  bucket.file(event.name).download()
    .then(data => {
      const csv = data[0].toString()
      csvtojson({ delimiter: [';', ','] }).fromString(csv).then((jsonObj) => {
        jsonObj.forEach(function (obj) {
          const version = db.collection('version').doc('currentVersion').update({
            version: admin.firestore.FieldValue.increment(50)
          })
          var dbData = db.collection('radar-data' + version)
          dbData.add(obj).then(function (docRef) {
            console.log('Document written with ID: ', docRef.id)
          })
            .catch(function (error) {
              console.error('Error adding document: ', error)
            })
        })
      })
    })
}
