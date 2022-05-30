# eitherFile

## About

### What is eitherFile?

eitherFile is a utility for tentative file path selection.

Its main job is to look for one or more relevant files that you specify, then provide you with the path to the first one it finds.

### Why would you need to use eitherFile?

When working on certain projects, there are instances when you need to reference a file [with a relative path]. However, this file reference may or may not find the file. It all depends on your current working directory [`process.cwd()`].

Here's a quick scenario.

Let's say your project uses [*dotenv*](https://github.com/motdotla/dotenv) and has the following structure:

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

When you navigate to your `sub` folder/directory [via `cd sub`], and then run your script [via `node index`], you may be suprised to see that the console output for your `.env` variable is `undefined`.

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
node sub/index
```

Now you get the same result as before [`undefined`], because the `path` that you provided *dotenv* is now being resolved based on your current working directory, so *dotenv* is looking in the directory above the current one [`../<your-root-directory>`] for a `.env` file.

With eitherFile, all you need to do is change your code to this:

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

This way, regardless of the directory in which you run your *node* command [`./` or `./sub`], your script runs without an issue.

Of course, you could always provide an absolute path to your [`.env`] file, but sometimes these paths can be quite long and a hassle to maintain if you've made multiple references and a directory names change.


## Installation

```
npm install eitherfile --save-dev
```

## Usage

1. First *require* or *import* according to your module system:

```
// CommonJS
const eitherFile = require('eitherfile');
```

OR


```
// ESM
import eitherFile from 'eitherfile';
```

2. 

```
// From your code
const file_path = eitherFile({path}, {options});
```

where:
- `{path}`: is the filename [with extension], or relative path to the file, or list of file paths. `{path}` must be either of *type* `String` or `Array`.
- `{options}`: is the option definition. `{options}` must be of *type* `Object`.


## Documentation

The eitherFile function has 

- `{path}`

### Rules

- eitherFile always returns an absolute path.


### Examples

Assume your project directory has the following absolute path: `/my/project`.

Assume the following project structure:

```
.
--| .env 
--| package.json
--| readme.md 
--| index.js
+-| sub
|   --| index.js
|   --| one.js
|   --| two.js
|   +-| subsub
|       --| one.js
|       --| two.js
```
...and the following code base:

```
# .env
MY_VAR=something
```

```
// readme.md
# My Readme
```

```
// ./sub/index.js
console.log('this is ./sub/index.js');
```

```
// ./sub/one.js
console.log('this is ./sub/one.js');
```

```
// ./sub/two.js
console.log('this is ./sub/two.js');
```

```
// ./subsub/one.js
console.log('this is ./subsub/one.js');
```

```
// ./subsub/two.js
console.log('this is ./subsub/two.js');
```

```
// ./index.js
const file = eitherFile('.env')
// file == '/my/project/.env'
```

### Options

The following options are available:

- **base**
- **up**
- **down**
- **contains**
- **debug**

#### base

**Type**: *String*.

This defines a base directory from 

## Test

To run the test suite, run the following command:

```
npm test
```

**Note**: [Jest](https://jestjs.org) is the test framework of record.


## Issues

If you have any challenges using eitherFile, please post an issue on the [Issues page](https://)


## License

This project is licensed under the MIT license. Feel free to use the code as you wish.

See [License](LICENSE) for more information.
