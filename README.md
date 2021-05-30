# agnostic-body

> A full-featured `omda` body parser middleware. Supports `multipart`, `urlencoded`, and `json` request bodies. Provides the same functionality as Express's bodyParser - [`multer`](https://github.com/expressjs/multer).

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
$ npm install agnostic-body
# yarn
$ yarn add agnostic-body
```

## `Usage`

```typescript
import http from "http";
import requestBody from "agnostic-body";

const server = http.createServer(async (request, response) => {
  try {
    const req = await requestBody()(request);
    response.statusCode = 200;
    response.write(req?.body);
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

## `Options`

> Options available for `agnostic-body`. Four custom options, and others are from `raw-body` and `formidable`.

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
- agnostic-body is strict by default, parsing only `POST`, `PUT`, and `PATCH` requests.

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
- `hash` **{String}** If you want checksums calculated for incoming files, set this to either `'sha1'` or `'md5'`, default `false`
- `multiples` **{Boolean}** Multiple file uploads or no, default `true`
- `onFileBegin` **{Function}** Special callback on file begin. The function is executed directly by formidable. It can be used to rename files before saving them to disk. [See the docs](https://github.com/felixge/node-formidable#filebegin)

## `Support`

If you have any problem or suggestion please open an issue.

#### License

---

[MIT](LICENSE) &copy; [Imed Jaberi](https://github.com/3imed-jaberi)
