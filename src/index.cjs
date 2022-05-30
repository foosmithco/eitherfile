const { accessSync, readFileSync } = require('fs');
const { parse, resolve, normalize } = require('path');

// initialize prototypes
const _proto_str = String.prototype;
const _proto_arr = Array.prototype;
const _proto_obj = Object.prototype;

/**
 * Checks if a given file exists
 * @param {String} path_str - the file path
 * @return {Boolean}
 */
function _checkFileExists(path_str) {
  try {
    accessSync(path_str);
  }
  catch (err) {
    return false;
  }
  return true;
}

/**
 * Check if a file contains a give value
 * @param {*} path_str - the path to the file
 * @param {String|Array|Object} search_any - the search value. It could be either:
 * - a string e.g. 'find me'
 * - an array e.g. ['keywords', 'to', 'look', 'for']
 * - a regexp object e.g. /looking for sOmething/i
 * @param {Boolean} path_is_data_bool - if true, will consider `path_str` as file data i.e. the function will not read file data
 * @return {Null|Boolean}
 */
function _checkFileContains(path_str, search_any, path_is_data_bool) {
  // determine input type
  const search_type_str = (Array.isArray(search_any)) ? 'array' : (typeof search_any === 'string') ? 'string' : (typeof search_any === 'object' && ((search_any instanceof RegExp) || (_proto_obj.toString.call(search_any) === '[object RegExp]'))) ? 'regex' : 'error';

  // return on invalid search value
  if (!(search_type_str === 'string' || search_type_str === 'array' || search_type_str === 'regex')) {
    return null;
  }

  // read file contents
  const file_data_str = (path_is_data_bool) ? path_str : readFileSync(path_str, 'utf-8');

  // initialize result
  let result_bool = false;

  if (search_type_str === 'regex') {
    result_bool = (search_any).test(file_data_str);
  }
  else if (search_type_str === 'array') {
    for (let i = 0; i < search_any.length; i++) {
      result_bool = _checkFileContains(file_data_str, search_any[i], true);
      if (result_bool) {
        break;
      }
    }
  }
  else {
    result_bool = (_proto_str.indexOf.call(file_data_str, search_any) !== -1);
  }

  return result_bool;
}

/**
 * 
 * @param {String|Array} path_str_or_arr - the paths
 * @param {Object} options_obj - the options
 * - `base` {String}: the base directory to resolve with
 * - `up` {Number}: the number of directories to traverse upwards
 * - `contains` {String|Array|Object}: a value to search for within the found file. The value can be either one of:
 *    - a string e.g. `find me`
 *    - an array e.g. ['looking', 'for', 'a', 'keyword']
 *    - a regexp object e.g. /find *something/i
 * - `delim` {String}: the delimiter used to seperate paths. This is only valid if `path_str_or_arr` parameter is a string.
 * - `debug` {Boolean}: if true, will return object containing:
 *   - `file` {String}: the name of the found file
 *   - `full` {String}: the full path of the found file
 *   - `dir_found` {String}: the directory of the found file
 *   - `dirs_all` {Array}: a list of all directories traversed in search of the found file
 * @return {String|Object}
 */
function eitherFile(path_str_or_arr, options_obj) {
  try {
    // define input type
    const input_type_str = (typeof path_str_or_arr === 'string') ? 'string' : (Array.isArray(path_str_or_arr)) ? 'array' : 'error';

    if (!(input_type_str === 'string' || input_type_str === 'array')) {
      /**
       * Provided path must be string or array type
       * - Throw error
       */

      throw new Error(`You must provide an input that is either 'string' or 'array' type!`);
    }
    // normalize options
    options_obj = (options_obj && typeof options_obj === 'object') ? options_obj : {};

    // define options
    const opt_delim_str = options_obj.delim || ',';
    let opt_base_dir_str = (options_obj.base) ? options_obj.base : process.cwd();
    const opt_up_int = (options_obj.up) ? parseInt(options_obj.up) : 0;
    const opt_contains_any = (options_obj.contains) ? options_obj.contains : null;
    const opt_debug_bool = !!(options_obj.debug);

    // normalize the base path
    opt_base_dir_str = normalize(opt_base_dir_str);
    console.log('opt_base_dir_str normalized =', opt_base_dir_str);

    // normalize path to array
    const path_arr = (input_type_str === 'array') ? path_str_or_arr : _proto_str.split.call(path_str_or_arr, opt_delim_str);

    console.log('path_arr =', path_arr);
    console.log('process.cwd() =', process.cwd());

    const result_obj = _proto_arr.reduce.call(path_arr, function(_acc_obj, _input_str) {
      // exit quickly if file is found
      if (_acc_obj.file) {
        return _acc_obj;
      }

      // resolve the path
      const _path_str = resolve(opt_base_dir_str, _input_str);

      console.log('_path_str =', _path_str);

      // parse path
      const path_info_obj = parse(_path_str);

      // get file and file root directory
      const file_str = path_info_obj.base;
      const file_root_str = path_info_obj.dir;

      // add directory to traversal cache
      _proto_arr.push.call(_acc_obj.dirs_all, file_root_str);

      // define full path
      let file_full_str = `${file_root_str}/${file_str}`;

      // check if file exists
      if (_checkFileExists(file_full_str)) {
        console.log('--file--');

        if (!opt_contains_any || (opt_contains_any && _checkFileContains(file_full_str, opt_contains_any))) {
          // set file path
          _acc_obj.file = file_str;
          _acc_obj.full = file_full_str;

          // set found directory
          _acc_obj.dir_found = file_root_str;

          // return
          return _acc_obj;
        }
      }

      if (opt_up_int > 0) {
        /**
         * Traverse the directory tree upwards
         */

        let file_root_up_str = file_root_str;
      
        for (let i = 0; i < opt_up_int; i++) {
          /** go up one directory per iteration */

          // update directory
          file_root_up_str = normalize(file_root_up_str+'/..');

          // add directory to traversal path
          _proto_arr.push.call(_acc_obj.dirs_all, file_root_up_str);

          // define full path
          file_full_str = `${file_root_up_str}/${file_str}`;

          if (_checkFileExists(file_full_str)) {

            if (!opt_contains_any || (opt_contains_any && _checkFileContains(file_full_str, opt_contains_any))) {
              // set file path
              _acc_obj.file = file_str;
              _acc_obj.full = file_full_str;

              // set found directory
              _acc_obj.dir_found = file_root_up_str;

              // return
              return _acc_obj;
            }
          }
        }
      }

      // return
      return _acc_obj;
    }, {dirs_all: [], dir_found: null, file: null, full: null});

    console.log('eitherFile result_obj.dirs_all =', result_obj.dirs_all);

    return (opt_debug_bool) ? result_obj : result_obj.full;
  }
  catch (err) {
    console.error(err);
  }
}

// export module
module.exports = eitherFile;
