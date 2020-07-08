const functions = require('firebase-functions')
const admin = require('firebase-admin')
admin.initializeApp(functions.config().firebase)
const csv = require('csvtojson')
exports.uploadSourceFromStorage = (event, context) => {
  const db = admin.firestore()
  console.log(event.data)
  var data = csv().fromFile(event.data.name)
  data.forEach(function (obj) {
    db.collection(event.data.name.replace('.csv', '')).add({
      isNew: obj.isNew,
      name: obj.name,
      description: obj.description,
      quadrant: obj.quadrant,
      ring: obj.ring
    }).then(function (docRef) {
      console.log('Document written with ID: ', docRef.id)
    })
      .catch(function (error) {
        console.error('Error adding document: ', error)
      })
  })
}
