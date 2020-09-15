var url = 'https://europe-west1-qaware-techradar.cloudfunctions.net/get-source-as-csv'

const d3 = require('d3')
const _ = {
  map: require('lodash/map'),
  uniqBy: require('lodash/uniqBy'),
  capitalize: require('lodash/capitalize'),
  each: require('lodash/each')
}

const InputSanitizer = require('./inputSanitizer')
const Radar = require('../models/radar')
const Quadrant = require('../models/quadrant')
const Ring = require('../models/ring')
const Blip = require('../models/blip')
const GraphingRadar = require('../graphing/radar')
const QueryParams = require('./queryParamProcessor')
const MalformedDataError = require('../exceptions/malformedDataError')
const SheetNotFoundError = require('../exceptions/sheetNotFoundError')
const ContentValidator = require('./contentValidator')
const ExceptionMessages = require('./exceptionMessages')

const plotRadar = function (title, blips) {
  document.title = 'QAware: Technologieradar'
  d3.selectAll('.loading').remove()

  const rings = ['Adopt', 'Trial', 'Assess', 'Hold']
  const ringMap = {}
  const maxRings = 4

  _.each(rings, function (ringName, i) {
    if (i === maxRings) {
      throw new MalformedDataError(ExceptionMessages.TOO_MANY_RINGS)
    }
    ringMap[ringName] = new Ring(ringName, i)
  })

  const quadrants = {}
  _.each(blips, function (blip) {
    if (!quadrants[blip.quadrant]) {
      quadrants[blip.quadrant] = new Quadrant(_.capitalize(blip.quadrant))
    }
    quadrants[blip.quadrant].add(new Blip(blip.name, ringMap[blip.ring], blip.isNew.toLowerCase() === 'true', blip.topic, blip.description))
  })

  const radar = new Radar()
  _.each(quadrants, function (quadrant) {
    radar.addQuadrant(quadrant)
  })

  const size = (window.innerWidth / 2) < 620 ? 620 : window.innerWidth / 2

  new GraphingRadar(size, radar).init().plot()
}

const CSVDocument = function (url) {
  const self = {}

  self.build = function () {
    d3.csv(url).then(createBlips)
  }

  const createBlips = function (data) {
    try {
      var columnNames = data.columns
      delete data.columns
      var contentValidator = new ContentValidator(columnNames)
      contentValidator.verifyContent()
      contentValidator.verifyHeaders()
      var blips = _.map(data, new InputSanitizer().sanitize)
      plotRadar(FileName(url), blips, 'CSV File', [])
    } catch (exception) {
      plotErrorMessage(exception)
    }
  }

  self.init = function () {
    plotLoading()
    return self
  }

  return self
}

const FileName = function (url) {
  const search = /([^\\/]+)$/
  const match = search.exec(decodeURIComponent(url.replace(/\+/g, ' ')))
  if (match != null) {
    return match[1]
  }
  return url
}

const GoogleSheetInput = function () {
  const self = {}
  let sheet

  self.build = function () {
    const queryString = ['sheetId=' + url, '=' + url]
    const queryParams = queryString ? QueryParams(queryString[0]) : {}
    sheet = CSVDocument(queryParams.sheetId)
    sheet.init().build()
  }

  return self
}

function setDocumentTitle () {
  document.title = 'QAware: Technologieradar'
}

function plotLoading (content) {
  content = d3.select('body')
    .append('div')
    .attr('class', 'loading')
    .append('div')
    .attr('class', 'input-sheet')

  setDocumentTitle()

  plotLogo(content)

  const bannerText = '<h1>Building your radar...</h1><p>Your Technology Radar will be available in just a few seconds</p>'
  plotBanner(content, bannerText)
}

function plotLogo (content) {
  content.append('div')
    .attr('class', 'input-sheet__logo')
    .html('<a href="https://www.qaware,de"><img src="/images/tw-logo.png" / ></a>')
}

function plotBanner (content, text) {
  content.append('div')
    .attr('class', 'input-sheet__banner')
    .html(text)
}

function plotErrorMessage (exception) {
  let message = 'Oops! It seems like there are some problems with loading your data. '

  const content = d3.select('body')
    .append('div')
    .attr('class', 'input-sheet')
  setDocumentTitle()

  plotLogo(content)

  const bannerText = '<div><h1>Build your own radar</h1><p>Once you\'ve <a href ="https://www.thoughtworks.com/radar/byor">created your Radar</a>, you can use this service' +
    ' to generate an <br />interactive version of your Technology Radar. Not sure how? <a href ="https://www.thoughtworks.com/radar/how-to-byor">Read this first.</a></p></div>'

  plotBanner(content, bannerText)

  d3.selectAll('.loading').remove()
  message = 'Oops! We can\'t find the Google Sheet you\'ve entered'
  const faqMessage = 'Please check <a href="https://www.thoughtworks.com/radar/how-to-byor">FAQs</a> for possible solutions.'
  if (exception instanceof MalformedDataError) {
    message = message.concat(exception.message)
  } else if (exception instanceof SheetNotFoundError) {
    message = exception.message
  } else {
    console.error(exception)
  }

  const container = content.append('div').attr('class', 'error-container')
  const errorContainer = container.append('div')
    .attr('class', 'error-container__message')
  errorContainer.append('div').append('p')
    .html(message)
  errorContainer.append('div').append('p')
    .html(faqMessage)

  let homePageURL = window.location.protocol + '//' + window.location.hostname
  homePageURL += (window.location.port === '' ? '' : ':' + window.location.port)
  const homePage = '<a href=' + homePageURL + '>GO BACK</a>'

  errorContainer.append('div').append('p')
    .html(homePage)
}

module.exports = GoogleSheetInput
