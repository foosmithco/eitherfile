# eitherFile

Tentative file-path fetcher for Node.js.

<div align="left">
<img alt="NPM" src="https://img.shields.io/npm/v/eitherfile?style=for-the-badge"> <img alt="GitHub Workflow Status (branch)" src="https://img.shields.io/github/workflow/status/foosmithco/eitherfile/test-eitherfile/main?style=for-the-badge"> <img alt="Codecov" src="https://img.shields.io/codecov/c/github/foosmithco/eitherfile?style=for-the-badge"> <img alt="Github Issues" src="https://img.shields.io/github/issues-raw/foosmithco/eitherfile?style=for-the-badge"> <img alt="Github License" src="https://img.shields.io/github/license/foosmithco/eitherfile?style=for-the-badge">
</div>


## About

### What is eitherFile?

eitherFile is a tentative file-path fetcher for Node.js.

Its main job is to look for one or more files that you specify, then provide you with the path to the first relevant one it finds.

### Why would you need to use eitherFile?

When working on a project, there might be instances when:

1. You code a reference to a file using a relative path [e.g. `../file`], but can't guarantee what [current working directory](https://stackoverflow.com/questions/9874382/whats-the-difference-between-process-cwd-vs-dirname) your script will be executed from [which could mean that the file is not found even though it's right there];
2. You need the full path of a file, and you know the name of the file, but its current location is not guaranteed to be static;
3. You need the full path of a file, but there are several files like it [i.e. with the same name] across your project.

Situations like this can cause frustration, especially when the file you're looking for can't be found, or you get the wrong file inadvertently.

<details>

  <summary>Click here to explore a sample scenario in detail (~ 3 min read).</summary>
<br/>
Let's say your project uses <a href="https://github.com/motdotla/dotenv" target="_blank">dotenv</a> and has the following structure:

```
.
--| .env
--| package.json
--| index.js
+-| sub
|   --| index.js
```

...with the following code-base:

```
# .env
MY_CUSTOM_VAR=some-value
```

```
// package.json
...
"type": "module",
...
```

```
// index.js
import 'dotenv/config';
console.log('I AM ROOT!');
console.log(process.env.MY_CUSTOM_VAR);
```

```
// sub/index.js
import 'dotenv/config';
console.log('I AM BELOW ROOT!');
console.log(process.env.MY_CUSTOM_VAR);
```

When you navigate to your `sub` folder/directory [via `cd sub`], and then run your script [via `node index.js`], you may be suprised to see that the console output for your `.env` variable is `undefined`.

The reason for this is because *dotenv* [by default] uses the current working directory to find your `.env` file, and now it can't find the file because you're one directory below.

You can change your `.env` code to this:

```
// sub/index.js
import dotenv from 'dotenv';
dotenv.config({path: '../.env'});
...
```

And everything should work perfectly now, right?! That is, until you navigate back to your project's home/root folder and do this:

```
node sub/index.js
```

Now you get the same result as before [`undefined`], because the `path` that you provided *dotenv* is now being resolved based on your current working directory, so *dotenv* is looking in the directory above the current one [`../<your-root-directory>`] for a `.env` file.

eitherFile helps to *resolve* issues like this. With eitherFile, all you need to do is change your code to this:

```
// sub/index.js
import eitherFile from 'eitherfile';
import dotenv from 'dotenv';
dotenv.config({path: eitherFile('.env', {up: 1})});
...
```

And eitherFile will do either of the following:

1. Look in the current working directory for a `.env` file then provide its full path if found;
2. If no file is found, go up the directory tree [once] and look in that directory then provide its full path if found [`null` otherwise];

In other words, eitherFile gives you either [the file path of] the `.env` in your current working directory, or the `.env` in the directory above.

This way, regardless of the directory in which you run/invoke your *node* process [`./` or `./sub`], the file is found, and your script runs without an issue.

Of course, you could always provide an absolute path to your [`.env`] file, but sometimes these paths can be quite long and a hassle to maintain if you've made multiple references and a directory names change.

</details>

## Installation

With [npm](https://npmjs.com) installed, run the following in your terminal:

```
npm install eitherfile --save-dev
```

## Usage

1. *require* or *import* eitherFile in your script according to your module system:

```
// CommonJS
const eitherFile = require('eitherfile');
```

OR


```
// ESM
import eitherFile from 'eitherfile';
```

2. Fetch the file path with *eitherFile*:

```
const file_path = eitherFile({path}, {options});
```

where:
- `{path}` is the filename (with extension, if any), or relative path to the file, or list of file names and/or relative paths. `{path}` can be either of `String` or `Array` *type*.
- `{options}`: is the option definition. `{options}` must be of `Object` *type*. See [Documentation](https://github.com/foosmithco/eitherfile#options) on options for details.


## Documentation

The eitherFile function takes two arguments:

- A filename or relative path (*Path*) [*String* or *Array*];
- An options definition (*Options*) [*Object*]

### Path

The *Path* argument can be either of the following:

- a file name e.g. `'.env'`, `'my-photo.png'`, etc.
- a relative file path e.g. `'../.env'`, `'../../my-styles.css'`, etc.
- a list of file names e.g. `['first.css', 'second.css']`, etc.
- a list of relative paths e.g. `['../.env', '../../double-up.js']`, etc.
- a list of file names and relative paths

*Note*: *Path* must be of type *String* or *Array*.

### Options

The *Options* argument can have any of the following properties:

- **base**
- **up**
- **down**
- **excludeDir**
- **contains**
- **debug**

#### base

A directory that will serve as the starting point for file searches.

**Type**: *String*

**Example**:

```
const file_path = eitherFile('.env', {base: '~/top-folder/my-project'});
/**
 * This will look for a '.env' file from 'my-project' directory that is
 * under the 'top-folder' directory that is under the home directory
 */
```
**Example**:
```
const file_path = eitherFile('.env', {base: '../my-project'});
/**
 * This will look for a '.env' file from a 'my-project' directory
 * relative to where you run/invoke the node process
 */
```

**Notes:**
- This directory can be either an absolute or relative path.
- If the directory is a relative path, this path will be normalized (by eitherFile) to an absolute path [i.e. based on the current working directory].


#### up

The number of directories to traverse up the current working base directory tree in the search for a relevant file.

**Type**: *Number*

**Example**:

```
const file_path = eitherFile('.env', {up: 2});
/**
 * This will look for a '.env' file from the current working base directory
 * up to (but not exceeding) 2 directories above
 */
```

**Notes:**
- `up` must be above zero to ensure upward traversal.

#### down

The number of directories to traverse down the current working base directory tree in the search for a relevant file.

**Type**: *Number*

**Example**:

```
const file_path = eitherFile('.env', {down: 3});
/**
 * This will look for a '.env' file from the current working base directory
 * down to (but not exceeding) a depth of 3 directories below
 */
```

**Notes:**
- This option will traverse all directories under the current working base directory.
- `down` must be above zero to ensure downward traversal.

#### excludeDir

A regular expression pattern used to exclude directories during downward traversal in the search for a relevant file.

**Type**: RegExp *Object* or RegExp *String*

**Example**:

```
const file_path = eitherFile('.env', {down: 3, excludeDir: /node_modules/});
/**
 * This will look for a '.env' file from the current working base directory
 * in every directory down to (but not exceeding) a depth of 3 directories below
 * excluding any directory containing 'node_modules' in its name
 */
```

**Example**:

```
const file_path = eitherFile('.env', {down: 3, excludeDir: 'node_modules'});
/**
 * This does the same as previous example, but with a regular expression string.
 */
```

**Notes:**
- This option is valid only for use with `down` option.
- If a string is defined, it should be a properly formatted regular expression [i.e. suitable for use with `new RegExp()`].


#### contains

A specific value or set of values to search for within a relevant file.

**Type**: *String* or *Array* or *RegExp*

**Example**:

```
const file_path = eitherFile('.env', {contains: ['CUSTOM_VAR_NAME', 'custom-value'], down: 3, excludeDir: /node_modules/});
/**
 * This will look for a '.env' file
 * containing the values 'CUSTOM_VAR_NAME' or 'custom-value'
 * from the current working base directory
 * down to (but not exceeding) a depth of 3 directories below
 * excluding any directory containing 'node_modules' in its name
 */
```

**Notes:**
- When using an array, the presence of at least one defined value within the file will result in a found file.
- When using an array, a combination of *String* and/or RegExp *Object* items are allowed.


#### debug

A boolean whose value determines the format of the result (from eitherFile).

If `true`, eitherFile will return an *Object* with the following properties:

- `file`: the name of the found file. Type is *String* if file is found; *Null* otherwise.
- `full`: the full path of the found file. *Type* is *String* if file is found; *Null* otherwise.
- `dir_found`: the absolute path of the directory of the found file. *Type* is *String* if file is found; *Null* otherwise.
- `dirs_all`: the complete list of directories traversed in search of the file. *Type* is *Array*.

**Type**: Boolean

**Example**:

```
const file_path = eitherFile('.env', {up: 2, down: 3, debug: true});
/**
 * This will look for a '.env' file from the current working base directory
 * up to (but not exceeding) 2 directories above and
 * down to (but not exceeding) a depth of 3 directories below and
 * will return a result object with the following shape:
 * {
 *    file: [String|Null],
 *    full: [String|Null],
 *    dir_found: [String|Null],
 *    dirs_all: [Array],
 * }
 */
```

**Notes:**
- This option will return an *Object* whether or not a file is found.


## Testing

To run the test suite, run the following command:

1. Clone the repository and enter project directory

```
git clone https://github.com/foosmithco/eitherfile.git
cd eitherfile
```

2. Install dependencies

```
npm install
```

3. Run test(s)

```
npm test
```

**Note**: [Jest](https://jestjs.org) is the test framework.


## Issues

If you have any challenges using eitherFile, please post an issue on the [Issues page](https://github.com/foosmithco/eitherfile/issues).


## License

This project is licensed under the MIT license. Feel free to use the code as you wish.

See [License](LICENSE) for more information.
