// TODO: refactor these.

/**
 * Get argument names from a string.
 *
 * @param {string} str    - The string containing placeholders.
 *
 * @return {object} placeholders - Array keyed with the arguments names and with an array of corresponding placeholders.
 */
function getArgumentsFromString(str) {
  return getPlaceholdersFromString(str, '%')
}

/**
 * Get placeholder names from a string.
 *
 * @param {string} str    - The string containing placeholders.
 * @param {string} prefix - The prefix of the placeholders. Must be Regex-escaped.
 *
 * @return {object} placeholders - Array keyed with the arguments names and with an array of corresponding placeholders.
 *
 *   If the placeholder with the same name occurs multiple times, there are also
 *   multiple arrays in the nested array. 
 *
 *   Example: 
 *     http://{%first|type=foo}{%first|type=bar}
 *   becomes:
 *   Array 
 *       (
 *            [first] => Array
 *            (
 *                [{%first|type=foo}] => Array
 *                    (
 *                        [type] => foo
 *                    )
 *                [{%first|type=bar}] => Array
 *                    (
 *                        [type] => bar
 *                    )
 *            )
 *        )
 */
function getPlaceholdersFromString(str, prefix) {

  var pattern = '{' + prefix + '(.+?)}';
  var re = RegExp(pattern, 'g');
  var match;
  var placeholders = {};

  do {
    match = re.exec(str);
    if (!match) {
      break;
    }

    // Example value:
    // match[1] = 'query|encoding=utf-8|another=attribute'
    var nameAndAttributes = match[1].split('|');

    // Example value:
    // name = 'query'
    var name = nameAndAttributes.shift();

    var placeholder = {};
    // Example value:
    // name_and_attributes = ['encoding=utf-8', 'another=attribute']
    for (attrStr of nameAndAttributes) {
      [attrName, attrValue] = attrStr.split('=', 2);
      placeholder[attrName] = attrValue;
    }
    placeholders[name] = placeholders[name] || {};
    placeholders[name][match[0]] = placeholder;

  } while (match);

  return placeholders;
}

var fs = require('fs');
jsyaml = require('js-yaml');

let shortcutsPath = '../trovu-data/shortcuts';

namespaces = fs.readdirSync(shortcutsPath);

// Interate over all namespaces.
for (namespace of namespaces) {
  let shortcuts = [];
  let namespacePath = shortcutsPath + '/' + namespace;
  keywords = fs.readdirSync(namespacePath);

  // Interate over all keywords.
  for (keyword of keywords) {
    //shortcuts[keyword] = {};
    let keywordPath = namespacePath + '/' + keyword;
    filenames = fs.readdirSync(keywordPath) ;

    // Interate over all argumentCounts.
    for (filename of filenames) {
      [argumentCount, extension] = filename.split('.');
      let filenamePath = keywordPath + '/' + filename
      var yml = fs.readFileSync(filenamePath, 'utf8');
      shortcut = jsyaml.safeLoad(yml);
      arguments = getArgumentsFromString(shortcut.url);
      let obj = {
        keyword: keyword,
        arguments: Object.keys(arguments),
        namespace: namespace,
        title: shortcut.title,
      };
      shortcuts.push(obj);
    }
  }
  let json = JSON.stringify(shortcuts);
  let jsonFileName = 'json/' + namespace + '.json';
  fs.writeFileSync(jsonFileName, json, 'utf8');
}
