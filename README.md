# @macchiatojs/body

> A full-featured `@macchiatojs` body parser middleware. Supports `multipart`, `urlencoded`, and `json` request bodies. Provides the same functionality as Express's bodyParser - [`multer`](https://github.com/expressjs/multer).

## `Features`

- 🦄 Based on top of [co-body] and [formidable].
- 🚀 Isomorphic to the moon.
- 🔥 Blaze and lightweight parser.
- 📌 Support for `form`.
- 🎯 Support for `json`.
- 🥞 Support for `multipart`.
- 🪁 Support for `file upload`.
- 📋 Support for `text` (raw text, html, xml).
- ✨ Asynchronous support (`async/await`).
- 🐢 Raw Node.js (`http`) support.
- 🎉 TypeScript support.

## `Installation`

```bash
# npm
$ npm install @macchiatojs/body
# yarn
$ yarn add @macchiatojs/body
```

> When use this module with raw Node.js should insall an additional module `type-is`.

## `Usage`

with Macchiato.js

```typescript
import Macchiato from "@macchiatojs/kernel";
import requestBody from "@macchiatojs/body";

const app = new Macchiato();

app.use(requestBody(bodyOpts));
app.use((request: Request, response: Response) => {
  response.body = request["body"];
});

app.start(1111);
```

with raw Node.js

```typescript
import http from "http";
import requestBody from "@macchiatojs/body";

const server = http.createServer(async (request, response) => {
  try {
    await requestBody()(request);
    response.statusCode = 200;
    response.write(request?.body);
    response.end();
    return;
  } catch (error) {
    response.statusCode = 500;
    response.end("some thing long ...");
    return;
  }
});

server.listen(1111);
```

#### Note

If you want to use `formidable@v1.x.x` you should replace you're import from

```typescript
import requestBody from "@macchiatojs/body"
```

to

```typescript
import requestBody from "@macchiatojs/body/v1"
```

> When we release the `1.0.0` we will drop support for `formidable@v1.x.x`.

## `Options`

> Options available for `@macchiatojs/body`. Four custom options, and others are from `raw-body` and `formidable`.

- `expressify` **{Boolean}** Only with `Macchiato.js`; Choose the right middleware style (false ==> koaify / true ==> expressify), default `true`
- `jsonLimit` **{String|Integer}** The byte (if integer) limit of the JSON body, default `1mb`
- `formLimit` **{String|Integer}** The byte (if integer) limit of the form body, default `56kb`
- `textLimit` **{String|Integer}** The byte (if integer) limit of the text body, default `56kb`
- `encoding` **{String}** Sets encoding for incoming form fields, default `utf-8`
- `multipart` **{Boolean}** Parse multipart bodies, default `false`
- `urlencoded` **{Boolean}** Parse urlencoded bodies, default `true`
- `text` **{Boolean}** Parse text bodies, such as XML, default `true`
- `json` **{Boolean}** Parse JSON bodies, default `true`
- `jsonStrict` **{Boolean}** Toggles co-body strict mode; if set to true - only parses arrays or objects, default `true`
- `formidable` **{Object}** Options to pass to the formidable multipart parser
- `parsedMethods` **{String[]}** Declares the HTTP methods where bodies will be parsed, default `['POST', 'PUT', 'PATCH']`.

## A note about `parsedMethods`

> see [http://tools.ietf.org/html/draft-ietf-httpbis-p2-semantics-19#section-6.3](http://tools.ietf.org/html/draft-ietf-httpbis-p2-semantics-19#section-6.3)

- `GET`, `HEAD`, and `DELETE` requests have no defined semantics for the request body, but this doesn't mean they may not be valid in certain use cases.
- @macchiatojs/body is strict by default, parsing only `POST`, `PUT`, and `PATCH` requests.

<!--
## File Support

Uploaded files are accessible via `ctx.request.files`.
-->

## Some options for formidable

> See [node-formidable](https://github.com/felixge/node-formidable) for a full list of options

- `maxFields` **{Integer}** Limits the number of fields that the querystring parser will decode, default `1000`
- `maxFieldsSize` **{Integer}** Limits the amount of memory all fields together (except files) can allocate in bytes. If this value is exceeded, an 'error' event is emitted, default `2mb (2 * 1024 * 1024)`
- `uploadDir` **{String}** Sets the directory for placing file uploads in, default `os.tmpDir()`
- `keepExtensions` **{Boolean}** Files written to `uploadDir` will include the extensions of the original files, default `false`
- `hashAlgorithm` (`hash` with formidable@v1.x.x) **{String}** If you want checksums calculated for incoming files, set this to either `'sha1'` or `'md5'`, default `false` 
- `multiples` **{Boolean}** Multiple file uploads or no, default `true`
- `onFileBegin` **{Function}** Special callback on file begin. The function is executed directly by formidable. It can be used to rename files before saving them to disk. [See the docs](https://github.com/felixge/node-formidable#filebegin)

## `Support`

If you have any problem or suggestion please open an issue.

#### License

---

[MIT](LICENSE) &copy; [Imed Jaberi](https://github.com/3imed-jaberi)
