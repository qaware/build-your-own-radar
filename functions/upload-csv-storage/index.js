const functions = require('firebase-functions')

const admin = require('firebase-admin')
admin.initializeApp(functions.config().firebase)

const csvtojson = require('csvtojson')
const { Storage } = require('@google-cloud/storage')
const db = admin.firestore()

exports.uploadSourceFromStorage = (event, context) => {
  const storage = new Storage()
  const bucket = storage.bucket('techradar-versiondata')
  var dbData = db.collection(event.name.replace('.csv', ''))
  var csvData;
  bucket.file(event.name).download()
    .then((data) => {
        csvData = data
        dbData.listDocuments().then(val => {
          val.map((val) => {
            val.delete()
          })
        })
      }
    ).then(() => {
      const csv = csvData[0].toString()
      csvtojson({ delimiter: [';', ','] }).fromString(csv).then((jsonObj) => {

        jsonObj.forEach(function (obj) {

          dbData.add(obj).then(function (docRef) {
            console.log('Document written with ID: ', docRef.id)
          })
            .catch(function (error) {
              console.error('Error adding document: ', error)
            })
        })
      })

    }).then(() =>
      db.collection('version').doc('currentVersion').set({ version: event.name.replace('.csv', '') })
    ).then(() => {
      bucket.file(event.name).delete()
    })
}
