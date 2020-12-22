const htmlParser = require('./htmlParser.js')
const utils = require('./utils.js')

exports.search = async function (params) {
  const url = utils.generateSearchUrl(params);
  try {
    const html = await fetch(url);
    const results = htmlParser.parseSearchResults(html);
    return results;
  } catch (error) {
    throw error;
  }
}