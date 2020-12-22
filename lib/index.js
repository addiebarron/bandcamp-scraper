const htmlParser = require('./htmlParser.js')
const utils = require('./utils.js')

exports.search = async function (params, cb) {
  const html, results, url = utils.generateSearchUrl(params);
  try {
    html = await fetch(url);
    results = htmlParser.parseSearchResults(html);
    cb(null, results);
  } catch (error) {
    cb(error, null);
  }
}