const jQuery = require('jquery')
const scrapeIt = require('scrape-it')
const Ajv = require('ajv')

jQuery.noConflict();

// add search-result Schema
const ajv = new Ajv()
ajv.addSchema(require('../schemas/search-result.json'), 'search-result')

const removeMultipleSpace = function (text) {
  return text.replace(/\s{2,}/g, ' ')
}

const assignProps = function (objFrom, objTo, propNames) {
  propNames.forEach(function (propName) {
    objTo[propName] = objFrom[propName]
  })
  return objTo
}

// parse search results
exports.parseSearchResults = function (html) {
  // trick to switch jquery context to the loaded html
  const $ = (sel,ctx) => new jQuery.fn.init(sel, ctx || html); 
  $.fn = $.prototype = jQuery.fn;
  // parse provided html
  const data = scrapeIt.scrapeHTML($, {
    results: {
      listItem: '.result-items li',
      data: {
        type: {
          selector: '.itemtype',
          convert: function (text) {
            return text.toLowerCase()
          }
        },
        name: { selector: '.heading' },
        url: { selector: '.itemurl' },
        imageUrl: { selector: '.art img', attr: 'src' },
        tags: {
          selector: '.tags',
          convert: function (text) {
            const tags = text.replace('tags:', '').replace(/\s/g, '')
            return tags.length > 1 ? tags.split(',') : []
          }
        },
        genre: {
          selector: '.genre',
          convert: function (text) {
            return removeMultipleSpace(text.replace('genre:', ''))
          }
        },
        subhead: {
          selector: '.subhead',
          convert: function (text) {
            return removeMultipleSpace(text)
          }
        },
        releaseDate: {
          selector: '.released',
          convert: function (text) {
            return text.replace('released ', '')
          }
        },
        numTracks: {
          selector: '.length',
          convert: function (text) {
            const info = text.split(',')
            if (info.length === 2) {
              return parseInt(info[0].replace(' tracks', ''))
            }
          }
        },
        numMinutes: {
          selector: '.length',
          convert: function (text) {
            const info = text.split(',')
            if (info.length === 2) {
              return parseInt(info[1].replace(' minutes', ''))
            }
          }
        }
      }
    }
  });
  return data.results.reduce(function (results, result) {
    // basic properties
    let object = assignProps(result, {}, ['type', 'name', 'url', 'imageUrl', 'tags'])
    // specific properties
    switch (result.type) {
      case 'artist':
        // genre
        object.genre = result.genre
        // location
        object.location = removeMultipleSpace(result.subhead).trim()
        break
      case 'album':
        // album's specific properties
        object = assignProps(result, object, ['releaseDate', 'numTracks', 'numMinutes'])
        // artist
        object.artist = result.subhead.replace('by ', '').trim()
        break
      case 'track':
        // released date
        object.releaseDate = result.releaseDate
        //  album & artist
        if (result.subhead) {
          const info = result.subhead.trim().split(' by ')
          if (info.length > 0) {
            object.album = removeMultipleSpace(info[0]).replace('location', '').replace(/^from /, '')
            info.shift()
            object.artist = removeMultipleSpace(info.join(' by '))
          }
        }
        break
      case 'fan':
      // genre
        object.genre = result.genre
        break
    }
    // validate through JSON schema
    if (ajv.validate('search-result', object)) {
      results.push(object)
    } else { // TODO add a flag to log only when debugging
      console.error('Validation error on search result: ', ajv.errorsText(), object, ajv.errors)
    }
    return results
  }, [])
}
