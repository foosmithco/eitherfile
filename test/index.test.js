/* eslint-disable max-len */
/* global describe, test, expect */

import eitherFile from '../src/index.js';

const _proto_str = String.prototype;
const _proto_arr = Array.prototype;

/**
 * Slice a string from a given delimiter index
 * @param {String} input_str - the input string
 * @param {String} delim_str - the delimiter
 * @param {Number} from_int - the index
 * @return {String}
 */
function _sliceFrom(input_str, delim_str, from_int) {
  const input_arr = _proto_str.split.call(input_str, delim_str);
  const input_slice_arr = (from_int >= 0) ? _proto_arr.slice.call(input_arr, 0, from_int) : _proto_arr.slice.call(input_arr, from_int);
  const result_str = _proto_arr.join.call(input_slice_arr, delim_str);
  return result_str;
}

describe('Main', function() {
  describe('No options', function() {
    // 1-1-1.
    test('should find dot file', function() {
      const path_str = './test/assets/dirs/root/.env';
      const result_any = eitherFile(path_str);
      console.log('result_any =', result_any);

      expect(!!result_any).toBe(true);
    });

    // 1-1-2.
    test('should find file [without extension]', function() {
      const path_str = './test/assets/dirs/root/readme';
      const result_any = eitherFile(path_str);
      console.log('result_any =', result_any);

      expect(!!result_any).toBe(true);
    });

    // 1-1-3.
    test('should find file [with extension]', function() {
      const path_str = './test/assets/dirs/root/readme.md';
      const result_any = eitherFile(path_str);
      console.log('result_any =', result_any);

      expect(!!result_any).toBe(true);
    });

    // 1-1-4.
    test('should find second file from list of files', function() {
      const path_arr = ['./test/assets/dirs/root/sub1/readme.md', './test/assets/dirs/root/sub1/sub2/.env', './test/assets/dirs/root/readme.md'];
      const result_any = eitherFile(path_arr);
  
      // get portion of result
      const result_sub_str = _sliceFrom(result_any, '/', -5);
  
      console.log('result_any =', result_any);
      console.log('result_sub_str =', result_sub_str);
  
      const result_bool = !!(_proto_str.match.call(path_arr[1], result_sub_str));
      expect(result_bool).toBe(true);
    });
  });

  describe(`Using 'up' option`, function() {
    // 1-2-1.
    test('should find file or alternate traversing upwards', function() {
      const path_str = './test/assets/dirs/root/sub1/sub2/readme.md';
      const result_any = eitherFile(path_str, {up: 2});
      console.log('result_any =', result_any);

      expect(!!result_any).toBe(true);
    });

    // 1-2-2.
    test('should find third file traversing upwards in directory tree', function() {
      const path_arr = ['./test/assets/dirs/root/sub1/not', './test/assets/dirs/root/sub1/sub2/.not', './test/assets/dirs/root/sub1/sub2/readme.md'];
      const result_any = eitherFile(path_arr, {up: 2});

      // get portion of result
      const result_sub_str = _sliceFrom(result_any, '/', -1);

      console.log('result_any =', result_any);
      console.log('result_sub_str =', result_sub_str);
      console.log('path_arr[2] =', path_arr[2]);
      console.log('result_bool =', _proto_str.match.call(path_arr[2], result_sub_str));

      const result_bool = !!(_proto_str.match.call(path_arr[2], result_sub_str));
      expect(result_bool).toBe(true);
    });
  });

  describe(`Using 'base' option`, function() {
    // 1-3-1.
    test('should find file', function() {
      const path_str = 'readme.md';
      const result_any = eitherFile(path_str, {base: './test/assets/dirs/base/'});
      console.log('result_any =', result_any);

      expect(!!result_any).toBe(true);
    });

    // 1-3-2.
    test('should find third file from list of files', function() {
      const path_arr = ['.ver', '.env', '.env-other'];
      const result_any = eitherFile(path_arr, {base: './test/assets/dirs/base'});
  
      // get portion of result
      const result_sub_str = _sliceFrom(result_any, '/', -1);
  
      console.log('result_any =', result_any);
      console.log('result_sub_str =', result_sub_str);
  
      const result_bool = !!(_proto_str.match.call(path_arr[2], result_sub_str));
      expect(result_bool).toBe(true);
    });
  });

  describe(`Using 'base' + 'up' option`, function() {
    // 1-4-1.
    test('should find file', function() {
      const path_str = 'readme.md';
      const result_any = eitherFile(path_str, {base: './test/assets/dirs/base/sub1/sub2', up: 2});
      console.log('result_any =', result_any);

      expect(!!result_any).toBe(true);
    });

    // 1-4-2.
    test('should find second file from list of files', function() {
      const path_arr = ['.ver', 'readme.md', '.env-other'];
      const result_any = eitherFile(path_arr, {base: './test/assets/dirs/base/sub1/sub2', up: 2});
  
      // get portion of result
      const result_sub_str = _sliceFrom(result_any, '/', -1);
  
      console.log('result_any =', result_any);
      console.log('result_sub_str =', result_sub_str);
  
      const result_bool = !!(_proto_str.match.call(path_arr[1], result_sub_str));
      expect(result_bool).toBe(true);
    });
  });

  describe(`Using 'base' + 'up' + 'contains' option`, function() {
    // 1-5-1.
    test('should find file - string search', function() {
      const path_str = 'readme.md';
      const result_any = eitherFile(path_str, {base: './test/assets/dirs/base/sub1/sub2', up: 2, contains: '# File'});
      console.log('result_any =', result_any);

      expect(!!result_any).toBe(true);
    });

    // 1-5-2.
    test('should find file - array search', function() {
      const path_str = 'readme.md';
      const result_any = eitherFile(path_str, {base: './test/assets/dirs/base/sub1/sub2', up: 2, contains: ['file', 'Some']});
      console.log('result_any =', result_any);

      expect(!!result_any).toBe(true);
    });

    // 1-5-3.
    test('should find file - regexp search', function() {
      const path_str = 'readme.md';
      const result_any = eitherFile(path_str, {base: './test/assets/dirs/base/sub1/sub2', up: 2, contains: /file/i});
      console.log('result_any =', result_any);

      expect(!!result_any).toBe(true);
    });

    // 1-5-4.
    test('should find file - mixed array search', function() {
      const path_str = 'readme.md';
      const result_any = eitherFile(path_str, {base: './test/assets/dirs/base/sub1/sub2', up: 2, contains: ['just', 'some', /file/i]});
      console.log('result_any =', result_any);

      expect(!!result_any).toBe(true);
    });

    // 1-5-5.
    test('should find third file from list of files - array search', function() {
      const path_arr = ['.ver', '.env-other', 'sub2/.env-other'];
      const result_any = eitherFile(path_arr, {base: './test/assets/dirs/base/sub1', up: 2, contains: ['Blank', 'sub2']});
  
      // get portion of result
      const result_sub_str = _sliceFrom(result_any, '/', -2);
  
      console.log('result_any =', result_any);
      console.log('result_sub_str =', result_sub_str);
  
      const result_bool = !!(_proto_str.match.call(path_arr[2], result_sub_str));
      expect(result_bool).toBe(true);
    });
  });

  describe(`Using 'debug' option`, function() {
    // 1-6-1.
    test('should return result of object type', function() {
      const path_str = 'readme.md';
      const result_any = eitherFile(path_str, {base: './test/assets/dirs/base/sub1/sub2', up: 2, debug: true});
      console.log('result_any =', result_any);

      expect(typeof result_any).toBe('object');
    });

    // 1-6-2.
    test('should return result object with defined properties', function() {
      const path_str = 'readme.md';
      const result_any = eitherFile(path_str, {base: './test/assets/dirs/base/sub1/sub2', up: 2, debug: true});

      const result_keys_arr = Object.keys(result_any);
      const result_prop_arr = ['dirs_all', 'dir_found', 'file', 'full'];

      const result_contains_bool = _proto_arr.reduce.call(result_keys_arr, function(_acc_bool, _index_str) {
        if (!_acc_bool) {
          return false;
        }

        const _result_bool = _proto_arr.includes.call(result_prop_arr, _index_str);
        return _result_bool;
      }, true);

      console.log('result_any =', result_any);

      expect(result_contains_bool).toBe(true);
    });
  });
});

describe('Exception', function() {
  describe('Invalid input', function() {
    // 2-1.
    test('should not find any files - path is integer', function() {
      const path_str = 12;
      const result_any = eitherFile(path_str, {base: './test/assets/dirs/base/sub1/sub2', up: 2});
      console.log('result_any =', result_any);

      expect(result_any).toBe(undefined);
    });

    // 2-2.
    test(`should not find any files - 'contains' value is plain object`, function() {
      const path_str = 'readme.md';
      const result_any = eitherFile(path_str, {base: './test/assets/dirs/base/sub1/sub2', up: 2, contains: {keyword: 'test'}});
      console.log('result_any =', result_any);

      expect(result_any).toBe(null);
    });
  });
  
});
