/*
 * Raw provider
 * Items consistent FS-based storage
 */
import fs from 'fs'
import Path from 'path'
import glob from 'glob'
import isbinaryfile from 'isbinaryfile'
import _ from 'lodash'
import Graph from '../graph/index'

const Self = {}
export default Self
Self.linksDelimiter = '\n'

/**
 * Reads from a directory with files named by their Keys
 * @param String source folder name
 * @return Graph
 */
Self.read = function (source) {
  var obj = {items: {}, links: {}}
  return new Promise(function (resolve, reject) {
    var counter = 0
    var files = glob.sync('*', {cwd: source})
    if (files.length === 0) resolve(new Graph)
    _.each(files, function (key) {
      var path = Path.join(source, key)
      Self._getFile(path)
        .then(function (data) {
          var links = JSON.parse(data.linksString)
          obj.items[key] = data.value
          obj.links[key] = links
          if (++counter === files.length) resolve(new Graph(obj))
        })
    })
  })
}
/**
 * Retrieve item
 */
Self.get = function (key, p) {
  var graph = new Graph
  var path = Path.join(p.source, key)
  return new Promise(function (resolve, reject) {
    Self._getFile(path, {getBinary: true})
      .then(function (data) {
        resolve(data.value)
      })
  })
}
/**
 * TODO return binary data on getBinary flag
 */
Self._getFile = function (path, p) {
  p = p || {}
  var linksString = ''
  var value

  return new Promise(function (resolve, reject) {
    if (isbinaryfile.sync(path)) {
      var readStream = fs.createReadStream(path, {encoding: 'utf8'})
      readStream.on('data', function (chunk) {
        var endLinksPosition = chunk.indexOf(Self.linksDelimiter)
        if (endLinksPosition > 0) {
          linksString += chunk.slice(0, endLinksPosition + 1)
          if (p.getBinary) {}
          readStream.close()
          resolve({linksString: linksString})
        } else linksString += chunk
      })
    } else {
      fs.readFile(path, 'utf8', function (err, str) {
        var endLinksPosition = str.indexOf(Self.linksDelimiter)
        linksString += str.slice(0, endLinksPosition)
        value = str.slice(endLinksPosition + 1)
        resolve({linksString: linksString, value: value})
      })
    }
  })
}
/**
 * Save item
 */
Self.set = function (key, value, links, p) {
  var path = Path.join(p.target, key)
  if ((_.isNil(value) || value === '') && _.isEmpty(links)) {
    try {fs.unlinkSync(path)} catch (e) {}
    return
  }

  var content = value === undefined ? '' : value
  content = JSON.stringify(links) + Self.linksDelimiter + content
  try {
    fs.writeFileSync(path, content)
  } catch (e) {console.log(e)}
}
/**
 * Writes items in one folder with IDs as filenames
 * Start of file contains utf8 encoded string of links Array []
 * @param Graph graph
 */
Self.write = function (graph, p) {
  if (!p.target) return console.log('no path specified to write a file')
  _.each(graph.getItemsMap(), function (value, key) {
    var links = graph.getLinks(key)
    Self.set(key, value, links, p)
  })

  console.log(_.keys(graph.getItemsMap()).length + ' Items written')
}
