import { accessSync } from "fs";
import { dirname, parse, resolve, normalize } from "path";
import { fileURLToPath } from "url";
const _proto_str = String.prototype;
const _proto_arr = Array.prototype;
function _checkFileExists(path_str) {
  try {
    accessSync(path_str);
  } catch (err) {
    return false;
  }
  return true;
}
function eitherFile(path_str_or_arr, options_obj) {
  try {
    const input_type_str = typeof path_str_or_arr === "string" ? "string" : Array.isArray(path_str_or_arr) ? "array" : "error";
    if (!(input_type_str === "string" || input_type_str === "array")) {
      throw new Error(`You must provide an input that is either 'string' or 'array' type!`);
    }
    const __dirname = dirname(fileURLToPath(import.meta.url));
    options_obj = options_obj && typeof options_obj === "object" ? options_obj : {};
    const opt_delim_str = options_obj.delim || ",";
    const opt_base_dir_str = options_obj.base ? options_obj.base : __dirname;
    const opt_up_int = options_obj.up ? parseInt(options_obj.up) : 0;
    const opt_debug_bool = !!options_obj.debug;
    const path_arr = input_type_str === "array" ? path_str_or_arr : _proto_str.split.call(path_str_or_arr, opt_delim_str);
    console.log("path_arr =", path_arr);
    console.log("__dirname =", __dirname);
    console.log("process.cwd() =", process.cwd());
    const result_obj = _proto_arr.reduce.call(path_arr, function(_acc_obj, _input_str) {
      if (_acc_obj.file) {
        return _acc_obj;
      }
      const _path_str = resolve(opt_base_dir_str, _input_str);
      console.log("_path_str =", _path_str);
      const path_info_obj = parse(_path_str);
      const file_str = path_info_obj.base;
      const file_root_str = path_info_obj.dir;
      _proto_arr.push.call(_acc_obj.dirs.all, file_root_str);
      let file_full_str = `${file_root_str}/${file_str}`;
      if (_checkFileExists(file_full_str)) {
        console.log("--file--");
        _acc_obj.file = file_str;
        _acc_obj.full = file_full_str;
        _acc_obj.dirs.found = file_root_str;
        return _acc_obj;
      }
      if (opt_up_int > 0) {
        let file_root_up_str = file_root_str;
        for (let i = 0; i < opt_up_int; i++) {
          file_root_up_str = normalize(file_root_up_str + "/..");
          _proto_arr.push.call(_acc_obj.dirs.all, file_root_up_str);
          file_full_str = `${file_root_up_str}/${file_str}`;
          if (_checkFileExists(file_full_str)) {
            _acc_obj.file = file_str;
            _acc_obj.full = file_full_str;
            _acc_obj.dirs.found = file_root_up_str;
            return _acc_obj;
          }
        }
      }
      return _acc_obj;
    }, { dirs: { all: [] } });
    if (!result_obj.file) {
      result_obj.full = null;
    }
    console.log("eitherFile result_obj.dirs.all =", result_obj.dirs.all);
    return opt_debug_bool ? result_obj : result_obj.full;
  } catch (err) {
    console.error(err);
  }
}
export {
  eitherFile as default
};
