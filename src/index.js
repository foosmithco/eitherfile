/* eslint-disable max-len */
import { accessSync, readFileSync, lstatSync, readdirSync } from 'fs';
import { homedir } from 'os';
import { parse, resolve, normalize } from 'path';

// initialize prototypes
const _proto_str = String.prototype;
const _proto_arr = Array.prototype;
const _proto_obj = Object.prototype;

/**
 * Check if a given file exists
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
 * Check if a file contains a given value
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
    // do regex test
    result_bool = (search_any).test(file_data_str);
  }
  else if (search_type_str === 'array') {
    // search by each array item
    for (let i = 0; i < search_any.length; i++) {
      result_bool = _checkFileContains(file_data_str, search_any[i], true);
      if (result_bool) {
        break;
      }
    }
  }
  else {
    // search by string
    result_bool = (_proto_str.indexOf.call(file_data_str, search_any) !== -1);
  }

  return result_bool;
}

/**
 * Crawl a directory for files
 * @param {*} path_str - the path to the entry directory
 * @param {*} options_obj - the options
 * - `limit` {Number}: the depth limit beyond which no traversal will occur
 * - `excludeDir` {String|Object}: a regular expression defining a pattern for excluding directories [from traversal]. This must be a regular expression string or object
 * @param {Number} _level_int - the current traversal depth [in recursion]. For internal use only
 * @return {Array}
 */
 function _crawlDirectoryForFiles(path_str, options_obj, _level_int) {
  // resolve path
  path_str = resolve(path_str);

  // define options
  const opt_limit_int = options_obj.limit;
  const opt_exclude_regexp_obj = (typeof options_obj.excludeDir === 'object') ? options_obj.excludeDir : (typeof options_obj.excludeDir === 'string') ? new RegExp(options_obj.excludeDir) : null;

  // initialize result
  let result_arr = [];

  // set current traversal depth
  const depth_int = (_level_int) ? _level_int : 0;

  // exit if depth limit reached
  if (opt_limit_int && depth_int > opt_limit_int) {
    return result_arr;
  }

  // retrieve list of directory contents
  const contents_arr = readdirSync(path_str);

  // cycle contents
  for (let i = 0; i < contents_arr.length; i++) {
    // compose path from content item
    const content_item_path_str = path_str+'/'+contents_arr[i];

    if (lstatSync(content_item_path_str).isDirectory()) {
      // exclude directory by regexp
      if (opt_exclude_regexp_obj && opt_exclude_regexp_obj.test(content_item_path_str)) {
        continue;
      }

      // traverse directory
      const _result_arr = _crawlDirectoryForFiles(content_item_path_str, options_obj, depth_int+1);

      // compose result
      result_arr = _proto_arr.concat.call(result_arr, _result_arr);
    }
    else {
      // add files to result
      _proto_arr.push.call(result_arr, content_item_path_str);
    }
  }

  return result_arr;
}

/**
 * Find and get file paths in a tentative manner
 * @param {String|Array} path_str_or_arr - the paths to find/get
 * @param {Object} options_obj - the options
 * - `base` {String}: the base directory to resolve with
 * - `up` {Number}: the number of directories to traverse upwards
 * - `down` {Number}: the number of directories to traverse downwards
 * - `excludeDir` {String|Object}: a regular expression pattern for excluding directories. This must be of type `string` or `object`
 * - `contains` {String|Array|Object}: a value to search for within the found file. The value can be either one of:
 *    - a string e.g. `find me`
 *    - an array e.g. ['looking', 'for', 'a', 'keyword']
 *    - a regexp object e.g. /find *something/i
 *    - a combination of strings and regexps e.g. ['looking', 'for', /^something/i]
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
    const path_type_str = (typeof path_str_or_arr === 'string') ? 'string' : (Array.isArray(path_str_or_arr)) ? 'array' : 'error';

    if (!(path_type_str === 'string' || path_type_str === 'array')) {
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
    const opt_down_int = (options_obj.down) ? parseInt(options_obj.down) : 0;
    const opt_exclude_dir_regexp_any = (options_obj.excludeDir) ? options_obj.excludeDir : undefined;
    const opt_contains_any = (options_obj.contains) ? options_obj.contains : null;
    const opt_debug_bool = !!(options_obj.debug);

    // normalize the base path
    opt_base_dir_str = normalize(opt_base_dir_str);

    // replace home directory symbol if defined
    opt_base_dir_str = _proto_str.replace.call(opt_base_dir_str, '~', homedir());

    // normalize path to array
    let path_arr = (path_type_str === 'array') ? path_str_or_arr : _proto_str.split.call(path_str_or_arr, opt_delim_str);

    // clean up paths
    path_arr = _proto_arr.map.call(path_arr, function(_path_str) {
      // normalize
      _path_str = (typeof _path_str === 'string') ? normalize(_path_str) : _path_str;
      return _path_str;
    });

    // define cache for directory crawl [for `down` option]
    const cache_dir_crawl_obj = {};

    // define cache for directory traversal tracking [`dirs_all` result property]
    const cache_dirs_all_obj = {};

    const result_obj = _proto_arr.reduce.call(path_arr, function(_acc_obj, _input_any) {
      // exit quickly if file is found
      if (_acc_obj.file) {
        return _acc_obj;
      }

      // exit quickly on invalid type
      if (typeof _input_any !== 'string') {
        return _acc_obj;
      }

      // resolve the path
      const _path_str = resolve(opt_base_dir_str, _input_any);

      // parse path
      const path_info_obj = parse(_path_str);

      // get file and file root directory
      const file_str = path_info_obj.base;
      const file_root_str = path_info_obj.dir;

      // add directory to traversal cache
      if (!cache_dirs_all_obj[file_root_str]) {
        /** Directory is not in cache */

        // persist to result cache
        _proto_arr.push.call(_acc_obj.dirs_all, file_root_str);

        // add to cache to prevent duplication
        cache_dirs_all_obj[file_root_str] = true;
      }

      // define full path
      let file_full_str = `${file_root_str}/${file_str}`;

      // check if file exists
      if (_checkFileExists(file_full_str)) {
        /** file is found */
        if (!opt_contains_any || (opt_contains_any && _checkFileContains(file_full_str, opt_contains_any))) {
          /**
           * 1. 'contains' option not provided, or
           * 2. 'contains' option provided and file contains defined value(s)
           * - save file info
           */

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

        // initialize upper directory variable
        let file_root_up_str = file_root_str;

        // traverse directory upwards
        for (let i = 0; i < opt_up_int; i++) {
          /** go up one directory per iteration */

          // update directory
          file_root_up_str = normalize(file_root_up_str+'/..');

          // add directory to traversal cache
          if (!cache_dirs_all_obj[file_root_up_str]) {
            /** Directory is not in cache */

            // persist to result cache
            _proto_arr.push.call(_acc_obj.dirs_all, file_root_up_str);

            // add to cache to prevent duplication
            cache_dirs_all_obj[file_root_up_str] = true;
          }

          // define full path
          file_full_str = `${file_root_up_str}/${file_str}`;

          if (_checkFileExists(file_full_str)) {
            /** file is found */
            if (!opt_contains_any || (opt_contains_any && _checkFileContains(file_full_str, opt_contains_any))) {
              /**
               * 1. 'contains' option not provided, or
               * 2. 'contains' option provided and file contains defined value(s)
               * - save file info
               */

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

      if (opt_down_int > 0) {
        /**
         * Traverse downwards
          * - Crawl all directories for files
         */

        // initialize files list
        let files_arr;

        // create regexp from file name
        const file_regex_str = file_str+'$';

        if (cache_dir_crawl_obj[file_root_str]) {
          /**
           * Cached crawl list available
           * - Do not crawl again
           */

          files_arr = cache_dir_crawl_obj[file_root_str];
        }
        else {
          /**
           * Cached crawl list not available
           * - Crawl directories
           */

          // get list of files under current directory
          files_arr = _crawlDirectoryForFiles(file_root_str, {
            limit: opt_down_int,
            excludeDir: opt_exclude_dir_regexp_any,
          });

          // save to cache
          cache_dir_crawl_obj[file_root_str] = _proto_arr.slice.call(files_arr);
        }

        // cycle files
        for (let i = 0; i < files_arr.length; i++) {
          // get file item
          const file_item_str = files_arr[i];

          // get directory from file item
          const file_item_dir_str = parse(file_item_str).dir;

          // add directory to traversal cache
          if (!cache_dirs_all_obj[file_item_dir_str]) {
            /** Directory is not in cache */

            // persist to result cache
            _proto_arr.push.call(_acc_obj.dirs_all, file_item_dir_str);

            // add to cache to prevent duplication
            cache_dirs_all_obj[file_item_dir_str] = true;
          }

          if ((_proto_str.match.call(file_item_str, file_regex_str))) {
            /** file is found */
            if (!opt_contains_any || (opt_contains_any && _checkFileContains(file_item_str, opt_contains_any))) {
              /**
               * 1. 'contains' option not provided, or
               * 2. 'contains' option provided and file contains defined value(s)
               * - save file info
               */

              // set file path
              _acc_obj.file = file_str;
              _acc_obj.full = file_item_str;

              // set found directory
              _acc_obj.dir_found = file_item_dir_str;

              // return
              return _acc_obj;
            }
          }
        }
      }

      // return
      return _acc_obj;
    }, {dirs_all: [], dir_found: null, file: null, full: null});

    return (opt_debug_bool) ? result_obj : result_obj.full;
  }
  catch (err) {
    console.error(err);
  }
}

// export module
export default eitherFile;
