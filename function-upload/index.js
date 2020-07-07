const functions = require('firebase-functions')
const admin = require('firebase-admin')
admin.initializeApp(functions.config().firebase)
var qs = require('querystring')
const csv = require('csvtojson')
exports.uploadCSV = functions.https.onRequest((request, response) => {
  response.set('Access-Control-Allow-Origin', '*')
  var jsondata = []

  if (request.method === 'POST') {
    var body = ''

    request.on('data', function (data) {
      body += data

      // Too much POST data, kill the connection!
      // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
      if (body.length > 1e6)
        request.connection.destroy()
    });

    request.on('end', function () {
      var post = qs.parse(body)
      jsondata = csv().fromString(post)
    })
  }
  const db = admin.firestore()
  var keys = Object.keys(jsondata)
  var version = db.collection('version').doc('currentVersion')
  const res = await version.update({
    version: admin.firestore.FieldValue.increment(1)
  });
  for (var i = 0,length = keys.length; i < length; i++) {
    db.collection('radar-data:' + res).add(keys[i])
  }
  return response.status(200)
})
