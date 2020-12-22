const htmlParser = require('./htmlParser.js')
const utils = require('./utils.js')

exports.search = async function (params, cb) {
  const url = utils.generateSearchUrl(params);
  try {
    const html = await fetch(url);
    const results = htmlParser.parseSearchResults(html);
    cb(null, results);
  } catch (error) {
    cb(error, null);
  }
}