const QueryParams = function (queryString) {
  const decode = function (s) {
    return decodeURIComponent(s.replace(/\+/g, ' '))
  }

  const search = /([^&=]+)=?([^&]*)/g

  const queryParams = {}
  let match
  while ((match = search.exec(queryString))) { queryParams[decode(match[1])] = decode(match[2]) }

  return queryParams
}

module.exports = QueryParams
