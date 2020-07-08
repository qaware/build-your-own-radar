const functions = require('firebase-functions')
const admin = require('firebase-admin')
admin.initializeApp(functions.config().firebase)
const csv = require('csvtojson')
exports.uploadSourceFromStorage = (event, context) => {
  const db = admin.firestore()
  var data = csv().fromFile(event.name)
  for (var item in data) {
    db.collection(event.name.replace('.csv', '')).add(item)
  }
}
