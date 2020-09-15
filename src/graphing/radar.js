const d3 = require('d3')
const d3tip = require('d3-tip')
const Chance = require('chance')
const _ = require('lodash/core')

const RingCalculator = require('../util/ringCalculator')
const MIN_BLIP_WIDTH = 12
const ANIMATION_DURATION = 1000

const Radar = function (size, radar) {
  let svg, radarElement, header

  const tip = d3tip().attr('class', 'd3-tip').html(function (text) {
    return text
  })

  tip.direction(function () {
    if (d3.select('.quadrant-table.selected').node()) {
      const selectedQuadrant = d3.select('.quadrant-table.selected')
      if (selectedQuadrant.classed('first') || selectedQuadrant.classed('fourth')) { return 'ne' } else { return 'nw' }
    }
    return 'n'
  })

  const ringCalculator = new RingCalculator(radar.rings().length, center())

  const self = {}
  let chance

  function center () {
    return Math.round(size / 2)
  }

  function toRadian (angleInDegrees) {
    return Math.PI * angleInDegrees / 180
  }

  function plotLines (quadrantGroup, quadrant) {
    const startX = size * (1 - (-Math.sin(toRadian(quadrant.startAngle)) + 1) / 2)
    const endX = size * (1 - (-Math.sin(toRadian(quadrant.startAngle - 90)) + 1) / 2)

    let startY = size * (1 - (Math.cos(toRadian(quadrant.startAngle)) + 1) / 2)
    let endY = size * (1 - (Math.cos(toRadian(quadrant.startAngle - 90)) + 1) / 2)

    if (startY > endY) {
      const aux = endY
      endY = startY
      startY = aux
    }

    quadrantGroup.append('line')
      .attr('x1', center()).attr('x2', center())
      .attr('y1', startY - 2).attr('y2', endY + 2)
      .attr('stroke-width', 10)

    quadrantGroup.append('line')
      .attr('x1', endX).attr('y1', center())
      .attr('x2', startX).attr('y2', center())
      .attr('stroke-width', 10)
  }

  function plotQuadrant (rings, quadrant) {
    const quadrantGroup = svg.append('g')
      .attr('class', 'quadrant-group quadrant-group-' + quadrant.order)
      .on('mouseover', mouseoverQuadrant.bind({}, quadrant.order))
      .on('mouseout', mouseoutQuadrant.bind({}, quadrant.order))
      .on('click', selectQuadrant.bind({}, quadrant.order, quadrant.startAngle))

    rings.forEach(function (ring, i) {
      const arc = d3.arc()
        .innerRadius(ringCalculator.getRadius(i))
        .outerRadius(ringCalculator.getRadius(i + 1))
        .startAngle(toRadian(quadrant.startAngle))
        .endAngle(toRadian(quadrant.startAngle - 90))

      quadrantGroup.append('path')
        .attr('d', arc)
        .attr('class', 'ring-arc-' + ring.order())
        .attr('transform', 'translate(' + center() + ', ' + center() + ')')
    })

    return quadrantGroup
  }

  function plotTexts (quadrantGroup, rings, quadrant) {
    rings.forEach(function (ring, i) {
      if (quadrant.order === 'first' || quadrant.order === 'fourth') {
        quadrantGroup.append('text')
          .attr('class', 'line-text')
          .attr('y', center() + 4)
          .attr('x', center() + (ringCalculator.getRadius(i) + ringCalculator.getRadius(i + 1)) / 2)
          .attr('text-anchor', 'middle')
          .text(ring.name())
      } else {
        quadrantGroup.append('text')
          .attr('class', 'line-text')
          .attr('y', center() + 4)
          .attr('x', center() - (ringCalculator.getRadius(i) + ringCalculator.getRadius(i + 1)) / 2)
          .attr('text-anchor', 'middle')
          .text(ring.name())
      }
    })
  }

  function triangle (blip, x, y, order, group) {
    return group.append('path').attr('d', 'M412.201,311.406c0.021,0,0.042,0,0.063,0c0.067,0,0.135,0,0.201,0c4.052,0,6.106-0.051,8.168-0.102c2.053-0.051,4.115-0.102,8.176-0.102h0.103c6.976-0.183,10.227-5.306,6.306-11.53c-3.988-6.121-4.97-5.407-8.598-11.224c-1.631-3.008-3.872-4.577-6.179-4.577c-2.276,0-4.613,1.528-6.48,4.699c-3.578,6.077-3.26,6.014-7.306,11.723C402.598,306.067,405.426,311.406,412.201,311.406')
      .attr('transform', 'scale(' + (blip.width / 34) + ') translate(' + (-404 + x * (34 / blip.width) - 17) + ', ' + (-282 + y * (34 / blip.width) - 17) + ')')
      .attr('class', order)
  }

  function circle (blip, x, y, order, group) {
    return (group || svg).append('path')
      .attr('d', 'M420.084,282.092c-1.073,0-2.16,0.103-3.243,0.313c-6.912,1.345-13.188,8.587-11.423,16.874c1.732,8.141,8.632,13.711,17.806,13.711c0.025,0,0.052,0,0.074-0.003c0.551-0.025,1.395-0.011,2.225-0.109c4.404-0.534,8.148-2.218,10.069-6.487c1.747-3.886,2.114-7.993,0.913-12.118C434.379,286.944,427.494,282.092,420.084,282.092')
      .attr('transform', 'scale(' + (blip.width / 34) + ') translate(' + (-404 + x * (34 / blip.width) - 17) + ', ' + (-282 + y * (34 / blip.width) - 17) + ')')
      .attr('class', order)
  }

  function addRing (ring, order) {
    const table = d3.select('.quadrant-table.' + order)
    table.append('h3').text(ring)
    return table.append('ul')
  }

  function calculateBlipCoordinates (blip, chance, minRadius, maxRadius, startAngle) {
    const adjustX = Math.sin(toRadian(startAngle)) - Math.cos(toRadian(startAngle))
    const adjustY = -Math.cos(toRadian(startAngle)) - Math.sin(toRadian(startAngle))

    const radius = chance.floating({ min: minRadius + blip.width / 2, max: maxRadius - blip.width / 2 })
    let angleDelta = Math.asin(blip.width / 2 / radius) * 180 / Math.PI
    angleDelta = angleDelta > 45 ? 45 : angleDelta
    const angle = toRadian(chance.integer({ min: angleDelta, max: 90 - angleDelta }))

    const x = center() + radius * Math.cos(angle) * adjustX
    const y = center() + radius * Math.sin(angle) * adjustY

    return [x, y]
  }

  function thereIsCollision (blip, coordinates, allCoordinates) {
    return allCoordinates.some(function (currentCoordinates) {
      return (Math.abs(currentCoordinates[0] - coordinates[0]) < blip.width) && (Math.abs(currentCoordinates[1] - coordinates[1]) < blip.width)
    })
  }

  function plotBlips (quadrantGroup, rings, quadrantWrapper) {
    const quadrant = quadrantWrapper.quadrant
    const startAngle = quadrantWrapper.startAngle
    const order = quadrantWrapper.order
    d3.select('.quadrant-table.' + order)
      .append('h2')
      .attr('class', 'quadrant-table__name')
      .text(quadrant.name())

    const blips = quadrant.blips()
    rings.forEach(function (ring, i) {
      const ringBlips = blips.filter(function (blip) {
        return blip.ring() === ring
      })

      if (ringBlips.length === 0) {
        return
      }

      const minRadius = ringCalculator.getRadius(i)
      const maxRadius = ringCalculator.getRadius(i + 1)
      const sumRing = ring.name().split('').reduce(function (p, c) {
        return p + c.charCodeAt(0)
      }, 0)
      const sumQuadrant = quadrant.name().split('').reduce(function (p, c) {
        return p + c.charCodeAt(0)
      }, 0)
      chance = new Chance(Math.PI * sumRing * ring.name().length * sumQuadrant * quadrant.name().length)

      const ringList = addRing(ring.name(), order)
      const allBlipCoordinatesInRing = []

      ringBlips.forEach(function (blip) {
        const coordinates = findBlipCoordinates(blip,
          minRadius,
          maxRadius,
          startAngle,
          allBlipCoordinatesInRing)

        allBlipCoordinatesInRing.push(coordinates)
        drawBlipInCoordinates(blip, coordinates, order, quadrantGroup, ringList)
      })
    })
  }

  function findBlipCoordinates (blip, minRadius, maxRadius, startAngle, allBlipCoordinatesInRing) {
    const maxIterations = 200
    let coordinates = calculateBlipCoordinates(blip, chance, minRadius, maxRadius, startAngle)
    let iterationCounter = 0
    let foundAPlace = false

    while (iterationCounter < maxIterations) {
      if (thereIsCollision(blip, coordinates, allBlipCoordinatesInRing)) {
        coordinates = calculateBlipCoordinates(blip, chance, minRadius, maxRadius, startAngle)
      } else {
        foundAPlace = true
        break
      }
      iterationCounter++
    }

    if (!foundAPlace && blip.width > MIN_BLIP_WIDTH) {
      blip.width = blip.width - 1
      return findBlipCoordinates(blip, minRadius, maxRadius, startAngle, allBlipCoordinatesInRing)
    } else {
      return coordinates
    }
  }

  function drawBlipInCoordinates (blip, coordinates, order, quadrantGroup, ringList) {
    const x = coordinates[0]
    const y = coordinates[1]

    const group = quadrantGroup.append('g').attr('class', 'blip-link').attr('id', 'blip-link-' + blip.number())

    if (blip.isNew()) {
      triangle(blip, x, y, order, group)
    } else {
      circle(blip, x, y, order, group)
    }

    group.append('text')
      .attr('x', x)
      .attr('y', y + 4)
      .attr('class', 'blip-text')
      // derive font-size from current blip width
      .style('font-size', ((blip.width * 10) / 22) + 'px')
      .attr('text-anchor', 'middle')
      .text(blip.number())

    const blipListItem = ringList.append('li')
    const blipText = blip.number() + '. ' + blip.name() + (blip.topic() ? ('. - ' + blip.topic()) : '')
    blipListItem.append('div')
      .attr('class', 'blip-list-item')
      .attr('id', 'blip-list-item-' + blip.number())
      .text(blipText)

    const blipItemDescription = blipListItem.append('div')
      .attr('id', 'blip-description-' + blip.number())
      .attr('class', 'blip-item-description')
    if (blip.description()) {
      blipItemDescription.append('p').html(blip.description())
    }

    const mouseOver = function () {
      d3.selectAll('g.blip-link').attr('opacity', 0.3)
      group.attr('opacity', 1.0)
      blipListItem.selectAll('.blip-list-item').classed('highlight', true)
      tip.show(blip.name(), group.node())
    }

    const mouseOut = function () {
      d3.selectAll('g.blip-link').attr('opacity', 1.0)
      blipListItem.selectAll('.blip-list-item').classed('highlight', false)
      tip.hide().style('left', 0).style('top', 0)
    }

    blipListItem.on('mouseover', mouseOver).on('mouseout', mouseOut)
    group.on('mouseover', mouseOver).on('mouseout', mouseOut)

    const clickBlip = function () {
      d3.select('.blip-item-description.expanded').node() !== blipItemDescription.node() &&
      d3.select('.blip-item-description.expanded').classed('expanded', false)
      blipItemDescription.classed('expanded', !blipItemDescription.classed('expanded'))

      blipItemDescription.on('click', function () {
        d3.event.stopPropagation()
      })
    }

    blipListItem.on('click', clickBlip)
  }

  function removeRadarLegend () {
    d3.select('.legend').remove()
  }

  function drawLegend (order) {
    removeRadarLegend()

    d3.select('.legend')
      .attr('class', 'legend legend-' + order)
      .transition()
      .style('visibility', 'visible')
  }

  function plotRadarHeader (quadrants) {
    header = d3.select('body').insert('header', '#radar')
    header.append('div')
      .attr('id', 'headline')
      .append('p')
      .attr('id', 'headline-text')
      .text('Technologieradar')
    const mainHeader = header.append('div')
      .attr('id', 'main-header')
    mainHeader.append('a')
      .attr('href', '/')
      .attr('id', 'main-header-logo')
      .append('img')
      .attr('src', 'https://www.qaware.de/typo3conf/ext/s2_qaware_templates/Resources/Public/Images/logo-qaware.svg')
      .attr('alt', 'QAware')
      .attr('id', 'main-header-logo-img')

    const headerContainer = mainHeader.append('div')
      .attr('id', 'main-header-nav-items-container')

    const nav = headerContainer.append('nav')
      .append('ul')
      .attr('id', 'main-nav')
    headerContainer.append('a')
      .attr('id', 'mobile-nav-icon-link')
      .attr('href', '#')
      .append('div')
      .attr('id', 'mobile-nav-icon')

    function addButton (quadrant) {
      radarElement
        .append('div')
        .attr('class', 'quadrant-table ' + quadrant.order)

      nav.append('li')
        .attr('class', 'main-nav-menu')
        .append('a')
        .attr('class', 'main-nav-menu nav-item')
        .text(quadrant.quadrant.name().toUpperCase())
        .on('mouseover', mouseoverQuadrant.bind({}, quadrant.order))
        .on('mouseout', mouseoutQuadrant.bind({}, quadrant.order))
        .on('click', selectQuadrant.bind({}, quadrant.order, quadrant.startAngle))
    }

    _.each([0, 1, 2, 3], function (i) {
      addButton(quadrants[i])
    })
  }

  function mouseoverQuadrant (order) {
    d3.select('.quadrant-group-' + order).style('opacity', 1)
    d3.selectAll('.quadrant-group:not(.quadrant-group-' + order + ')').style('opacity', 0.3)
  }

  function mouseoutQuadrant (order) {
    d3.selectAll('.quadrant-group:not(.quadrant-group-' + order + ')').style('opacity', 1)
  }

  function selectQuadrant (order, startAngle) {
    d3.selectAll('.button').classed('selected', false).classed('full-view', false)
    d3.selectAll('.button.' + order).classed('selected', true)
    d3.selectAll('.quadrant-table').classed('selected', false)
    d3.selectAll('.quadrant-table.' + order).classed('selected', true)
    d3.selectAll('.blip-item-description').classed('expanded', false)

    const scale = (window.innerWidth - 0.5 * size) / size

    const adjustX = Math.sin(toRadian(startAngle)) - Math.cos(toRadian(startAngle))
    const adjustY = Math.cos(toRadian(startAngle)) + Math.sin(toRadian(startAngle))

    const translateX = (-1 * (1 + adjustX) * size / 2 * (scale - 1)) + (-adjustX * (1 - scale / 2) * size)
    const translateY = (-1 * (1 - adjustY) * (size / 2 - 7) * (scale - 1)) - ((1 - adjustY) / 2 * (1 - scale / 2) * size)

    const translateXAll = (1 - adjustX) / 2 * size * scale / 2 + ((1 - adjustX) / 2 * (1 - scale / 2) * size)
    const translateYAll = (1 + adjustY) / 2 * size * scale / 2

    const moveRight = (1 + adjustX) * (0.8 * window.innerWidth - size) / 2
    const moveLeft = (1 - adjustX) * (0.8 * window.innerWidth - size) / 2

    const blipScale = 3 / 4
    const blipTranslate = (1 - blipScale) / blipScale

    svg.style('left', moveLeft + 'px').style('right', moveRight + 'px')
    d3.select('.quadrant-group-' + order)
      .transition()
      .duration(ANIMATION_DURATION)
      .attr('transform', 'translate(' + translateX + ',' + translateY + ')scale(' + scale + ')')
    d3.selectAll('.quadrant-group-' + order + ' .blip-link text').each(function () {
      const x = d3.select(this).attr('x')
      const y = d3.select(this).attr('y')
      d3.select(this.parentNode)
        .transition()
        .duration(ANIMATION_DURATION)
        .attr('transform', 'scale(' + blipScale + ')translate(' + blipTranslate * x + ',' + blipTranslate * y + ')')
    })

    d3.selectAll('.quadrant-group')
      .style('pointer-events', 'auto')

    d3.selectAll('.quadrant-group:not(.quadrant-group-' + order + ')')
      .transition()
      .duration(ANIMATION_DURATION)
      .style('pointer-events', 'none')
      .attr('transform', 'translate(' + translateXAll + ',' + translateYAll + ')scale(0)')

    if (d3.select('.legend.legend-' + order).empty()) {
      drawLegend(order)
    }
  }

  self.init = function () {
    radarElement = d3.select('body').append('div').attr('id', 'radar')
    return self
  }

  self.plot = function () {
    const rings = radar.rings()
    const quadrants = radar.quadrants()

    plotRadarHeader(quadrants)

    radarElement.style('height', size + 14 + 'px')

    svg = radarElement.append('svg').call(tip)
    svg.attr('id', 'radar-plot').attr('width', size).attr('height', size + 14)

    _.each(quadrants, function (quadrant) {
      const quadrantGroup = plotQuadrant(rings, quadrant)
      plotLines(quadrantGroup, quadrant)
      plotTexts(quadrantGroup, rings, quadrant)
      plotBlips(quadrantGroup, rings, quadrant)
    })
  }

  return self
}

module.exports = Radar
