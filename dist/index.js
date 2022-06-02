import { accessSync, readFileSync, lstatSync, readdirSync } from "fs";
import { homedir } from "os";
import { parse, resolve, normalize } from "path";
const _proto_str = String.prototype;
const _proto_arr = Array.prototype;
const _proto_obj = Object.prototype;
function _checkFileExists(path_str) {
  try {
    accessSync(path_str);
  } catch (err) {
    return false;
  }
  return true;
}
function _checkFileContains(path_str, search_any, path_is_data_bool) {
  const search_type_str = Array.isArray(search_any) ? "array" : typeof search_any === "string" ? "string" : typeof search_any === "object" && (search_any instanceof RegExp || _proto_obj.toString.call(search_any) === "[object RegExp]") ? "regex" : "error";
  if (!(search_type_str === "string" || search_type_str === "array" || search_type_str === "regex")) {
    return null;
  }
  const file_data_str = path_is_data_bool ? path_str : readFileSync(path_str, "utf-8");
  let result_bool = false;
  if (search_type_str === "regex") {
    result_bool = search_any.test(file_data_str);
  } else if (search_type_str === "array") {
    for (let i = 0; i < search_any.length; i++) {
      result_bool = _checkFileContains(file_data_str, search_any[i], true);
      if (result_bool) {
        break;
      }
    }
  } else {
    result_bool = _proto_str.indexOf.call(file_data_str, search_any) !== -1;
  }
  return result_bool;
}
function _crawlDirectoryForFiles(path_str, options_obj, _level_int) {
  path_str = resolve(path_str);
  const opt_limit_int = options_obj.limit;
  const opt_exclude_regexp_obj = typeof options_obj.excludeDir === "object" ? options_obj.excludeDir : typeof options_obj.excludeDir === "string" ? new RegExp(options_obj.excludeDir) : null;
  let result_arr = [];
  const depth_int = _level_int ? _level_int : 0;
  if (opt_limit_int && depth_int > opt_limit_int) {
    return result_arr;
  }
  const contents_arr = readdirSync(path_str);
  for (let i = 0; i < contents_arr.length; i++) {
    const content_item_path_str = path_str + "/" + contents_arr[i];
    if (lstatSync(content_item_path_str).isDirectory()) {
      if (opt_exclude_regexp_obj && opt_exclude_regexp_obj.test(content_item_path_str)) {
        continue;
      }
      const _result_arr = _crawlDirectoryForFiles(content_item_path_str, options_obj, depth_int + 1);
      result_arr = _proto_arr.concat.call(result_arr, _result_arr);
    } else {
      _proto_arr.push.call(result_arr, content_item_path_str);
    }
  }
  return result_arr;
}
function eitherFile(path_str_or_arr, options_obj) {
  try {
    const path_type_str = typeof path_str_or_arr === "string" ? "string" : Array.isArray(path_str_or_arr) ? "array" : "error";
    if (!(path_type_str === "string" || path_type_str === "array")) {
      throw new Error(`You must provide an input that is either 'string' or 'array' type!`);
    }
    options_obj = options_obj && typeof options_obj === "object" ? options_obj : {};
    const opt_delim_str = options_obj.delim || ",";
    let opt_base_dir_str = options_obj.base ? options_obj.base : process.cwd();
    const opt_up_int = options_obj.up ? parseInt(options_obj.up) : 0;
    const opt_down_int = options_obj.down ? parseInt(options_obj.down) : 0;
    const opt_exclude_dir_regexp_any = options_obj.excludeDir ? options_obj.excludeDir : void 0;
    const opt_contains_any = options_obj.contains ? options_obj.contains : null;
    const opt_debug_bool = !!options_obj.debug;
    opt_base_dir_str = normalize(opt_base_dir_str);
    opt_base_dir_str = _proto_str.replace.call(opt_base_dir_str, "~", homedir());
    let path_arr = path_type_str === "array" ? path_str_or_arr : _proto_str.split.call(path_str_or_arr, opt_delim_str);
    path_arr = _proto_arr.map.call(path_arr, function(_path_str) {
      _path_str = typeof _path_str === "string" ? normalize(_path_str) : _path_str;
      return _path_str;
    });
    const cache_dir_crawl_obj = {};
    const cache_dirs_all_obj = {};
    const result_obj = _proto_arr.reduce.call(path_arr, function(_acc_obj, _input_any) {
      if (_acc_obj.file) {
        return _acc_obj;
      }
      if (typeof _input_any !== "string") {
        return _acc_obj;
      }
      const _path_str = resolve(opt_base_dir_str, _input_any);
      const path_info_obj = parse(_path_str);
      const file_str = path_info_obj.base;
      const file_root_str = path_info_obj.dir;
      if (!cache_dirs_all_obj[file_root_str]) {
        _proto_arr.push.call(_acc_obj.dirs_all, file_root_str);
        cache_dirs_all_obj[file_root_str] = true;
      }
      let file_full_str = `${file_root_str}/${file_str}`;
      if (_checkFileExists(file_full_str)) {
        if (!opt_contains_any || opt_contains_any && _checkFileContains(file_full_str, opt_contains_any)) {
          _acc_obj.file = file_str;
          _acc_obj.full = file_full_str;
          _acc_obj.dir_found = file_root_str;
          return _acc_obj;
        }
      }
      if (opt_up_int > 0) {
        let file_root_up_str = file_root_str;
        for (let i = 0; i < opt_up_int; i++) {
          file_root_up_str = normalize(file_root_up_str + "/..");
          if (!cache_dirs_all_obj[file_root_up_str]) {
            _proto_arr.push.call(_acc_obj.dirs_all, file_root_up_str);
            cache_dirs_all_obj[file_root_up_str] = true;
          }
          file_full_str = `${file_root_up_str}/${file_str}`;
          if (_checkFileExists(file_full_str)) {
            if (!opt_contains_any || opt_contains_any && _checkFileContains(file_full_str, opt_contains_any)) {
              _acc_obj.file = file_str;
              _acc_obj.full = file_full_str;
              _acc_obj.dir_found = file_root_up_str;
              return _acc_obj;
            }
          }
        }
      }
      if (opt_down_int > 0) {
        let files_arr;
        if (cache_dir_crawl_obj[file_root_str]) {
          files_arr = cache_dir_crawl_obj[file_root_str];
        } else {
          files_arr = _crawlDirectoryForFiles(file_root_str, {
            limit: opt_down_int,
            excludeDir: opt_exclude_dir_regexp_any
          });
          cache_dir_crawl_obj[file_root_str] = _proto_arr.slice.call(files_arr);
        }
        for (let i = 0; i < files_arr.length; i++) {
          const file_item_str = files_arr[i];
          const file_item_dir_str = parse(file_item_str).dir;
          if (!cache_dirs_all_obj[file_item_dir_str]) {
            _proto_arr.push.call(_acc_obj.dirs_all, file_item_dir_str);
            cache_dirs_all_obj[file_item_dir_str] = true;
          }
          if (_proto_str.match.call(file_item_str, file_str)) {
            if (!opt_contains_any || opt_contains_any && _checkFileContains(file_item_str, opt_contains_any)) {
              _acc_obj.file = file_str;
              _acc_obj.full = file_item_str;
              _acc_obj.dir_found = file_item_dir_str;
              return _acc_obj;
            }
          }
        }
      }
      return _acc_obj;
    }, { dirs_all: [], dir_found: null, file: null, full: null });
    return opt_debug_bool ? result_obj : result_obj.full;
  } catch (err) {
    console.error(err);
  }
}
var src_default = eitherFile;
export {
  src_default as default
};
