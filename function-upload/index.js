const functions = require('firebase-functions')
const admin = require('firebase-admin')
admin.initializeApp(functions.config().firebase)
var qs = require('querystring')
const csv = require('csvtojson')
const { promisify } = require('util')
const parse = promisify(require('csv-parse'))
exports.uploadCSV = functions.https.onRequest((request, response) => {
  response.set('Access-Control-Allow-Origin', '*')
  var jsondata = []

  if (request.method === 'POST') {
    var body = ''

    request.on('data', function (data) {
      body += data

      // Too much POST data, kill the connection!
      // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
      if (body.length > 1e6) {
        request.connection.destroy()
      }
    })

    request.on('end', function () {
      jsondata = parse(body, { columns: true });
    })
  }
  const db = admin.firestore()
  const batchCommits = []
  let batch = db.batch()
  jsondata.forEach((record, i) => {
    const version = db.doc('version/currentVersion')
    var num = 0
    version.get().then((snapshot) => {
      num = snapshot.data().version + 1
      version.set({ version: num }, { merge: true })
    })
    batch.set(version, record);
    if ((i + 1) % 500 === 0) {
      console.log(`Writing record ${i + 1}`);
      batchCommits.push(batch.commit());
      batch = db.batch();
    }
  }
  batchCommits.push(batch.commit());

  return response.status(200)
})
