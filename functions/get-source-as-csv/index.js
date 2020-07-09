const functions = require('firebase-functions')
const admin = require('firebase-admin')
admin.initializeApp(functions.config().firebase)
const { Parser } = require('json2csv')
var fields = ['name', 'quadrant', 'ring', 'isNew', 'description']
exports.getSourceAsCsv = functions.https.onRequest((request, response) => {
  if (request.method === 'OPTIONS') {
    // Send response to OPTIONS requests
    response.set('Access-Control-Allow-Methods', 'GET')
    response.set('Access-Control-Allow-Headers', 'Authorization')
    response.set('Access-Control-Max-Age', '3600')
    response.status(204).send('')
  }
  response.set('Access-Control-Allow-Origin', '*')
  var jsondata = []
  const db = admin.firestore()
  db.collection('version').doc('currentVersion').get().data().version.then( (ver) =>{
    var version = request.query.name || ver
    console.log(version)
    const dBData = db.collection(version).orderBy('ring', 'asc')

    return dBData.get().then((querySnapshot) => {
      querySnapshot.forEach(doc => {
        jsondata.push(doc.data())
      })
      var json2csv = new Parser({ delimiter: ';', fields: fields })
      const csv = json2csv.parse(jsondata)
      response.setHeader(
        'Content-disposition',
        'attachment; filename=files.csv'// file name.csv
      )
      response.set('Content-Type', 'text/csv')
      return response.status(200).send(csv)
    }).catch((err) => {
      return console.log(err)
    })
  })
})
