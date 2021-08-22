/**
 * @macchiatojs/body
 *
 * Copyright(c) 2021 Imed Jaberi
 * MIT Licensed
 */

'use strict'

/**
 * Module dependencies.
 */

import { IncomingMessage, ServerResponse } from 'http'
import { Context, Request, Response, Next } from '@macchiatojs/kernel'
import buddy from 'co-body'
import forms, { Files, Options } from 'formidable'
// peerDep. needed with raw Node.js
import typeIs from 'type-is' 

export interface MacchiatoRequest extends Request {
  body?: any;
  files?: Files;
}

export interface RawRequest extends IncomingMessage {
  body?: any;
  files?: Files;
}


export type BodyRequest = RawRequest | MacchiatoRequest

export interface BodyOptions {
  expressify?: boolean
  multipart?: boolean
  urlencoded?: boolean
  json?: boolean
  text?: boolean
  encoding?: string
  jsonLimit?: number|string
  jsonStrict?: boolean
  formLimit?: number|string
  queryString?: string|null
  textLimit?: number|string
  formidable?: Options 
  includeUnparsed?: boolean
  parsedMethods?: string[]
}

/**
 * full-featured body parser 🦄. 
 *
 * @param {Object} options
 * @api public
 */
function coreRequestBody(opts: BodyOptions = {}) {
  // determine the options fields.
  opts.multipart = opts.multipart || false
  opts.urlencoded = opts.urlencoded || true
  opts.json = opts.json || true
  opts.text = opts.text || true
  opts.encoding = opts.encoding || 'utf-8'
  opts.jsonLimit = opts.jsonLimit || '1mb'
  opts.jsonStrict = opts.jsonStrict || true
  opts.formLimit = opts.formLimit || '56kb'
  opts.queryString = opts.queryString || null
  opts.formidable = opts.formidable || {}
  opts.includeUnparsed = opts.includeUnparsed || false
  opts.textLimit =   opts.textLimit || '56kb'
  opts.parsedMethods = opts.parsedMethods || ['POST', 'PUT', 'PATCH']
  opts.parsedMethods = opts.parsedMethods.map(method => method.toUpperCase())

  // co-body parser options [json, form, text].
  const buddyOptions = {
    json: {
      encoding: opts.encoding,
      limit: opts.jsonLimit,
      strict: opts.jsonStrict,
      returnRawBody: opts.includeUnparsed
    },
    form: {
      encoding: opts.encoding,
      limit: opts.formLimit,
      queryString: opts.queryString,
      returnRawBody: opts.includeUnparsed
    },
    text: {
      encoding: opts.encoding,
      limit: opts.textLimit,
      returnRawBody: opts.includeUnparsed
    }
  }

  //
  // FIXME: fix limit the json, form and text response when upgrade the kernel to v0.10.0
  return async (req: BodyRequest, next?: Next) => {    
    // FIXME: change req.raw with req.rawRequest
    const request = req instanceof IncomingMessage ? req : req.raw

    // co-body parsers [json, form, text].
    const buddyParser = (type) => buddy[type](request, buddyOptions[type])
    
    // formidable parser [multipart].
    const formyParser = (request, opts): Promise<unknown> => {
      return new Promise(function (resolve, reject) {
        const fields = {}
        const files = {}
        const form = new forms.IncomingForm(opts)

        form.on('field', (field, value) => {
          if (fields[field]) {
            fields[field] = Array.isArray(fields[field]) 
              ? [...fields[field], value]
              : [fields[field], value]
          } else {
            fields[field] = value
          }
        })
        
        form.on('file', (field, file) => {
          if (files[field]) {
            files[field] = Array.isArray(files[field])
              ? [...files[field], file]
              : [files[field], file]
          } else {
            files[field] = file
          }
        })

        form.on('end', () => resolve({ fields: fields, files: files }))
        form.on('error', (error) => reject(error))

        if (opts.onFileBegin) {
          form.on('fileBegin', opts.onFileBegin)
        }

        form.parse(request, () => void 0)
      })
    }

    // only parse the body on specifically chosen methods.
    if (opts.parsedMethods?.includes(request?.method as string)) {
      // extract the right type of the request payload.
      const type = (() => {
        // content types used as json.
        const jsonTypes = [
          'application/json',
          'application/json-patch+json',
          'application/vnd.api+json',
          'application/csp-report'
        ]
        
        // helper function to check types from the request content type header.
        const is = (request instanceof Request) 
          ? request.is 
          : (type, ...types) => typeIs(request, type, ...types);

        return (
          (opts.json && is(jsonTypes))
            ? "json" 
            : (opts.urlencoded && is('urlencoded'))
              ? "form"
              : (opts.text && (is('text/*') || is('xml')))
                ? "text"
                : (opts.multipart && is('multipart')) 
                  ? "multipart" 
                  : undefined
        )
      })()

      // choose the correct parser.
      const bodyParser = () => (
        type === 'multipart'
          ?  formyParser(request, opts.formidable)
          :  !type
            ? Promise.resolve({})
            : buddyParser(type) 
      )

      // parse the request.
      const body = await bodyParser()

      // merge the parsed result with the Node.js request object.
      if (type === 'multipart') {
        request['body'] = body.fields
        request['files'] = body.files
      } else {
        request['body'] = body
      }

      // when use macchiatojs with expressify and koaify
      if(next) {
        // mapped from rawRequest to request
        req.body = request['body']
        req.files = request['files']

        // go to the next middleware
        return next()
      }
    }
  }
}

// middleware/hook/helper for raw Node.js
export function rawBody(opts: BodyOptions) {
  return (request: IncomingMessage, response: ServerResponse) => coreRequestBody(opts)(request)
}

// middleware for Macchiato.js
export function requestBody(opts: BodyOptions) {
  opts.expressify = opts.expressify ?? true

  return opts.expressify
    ? (request: Request, response: Response, next: Next) => coreRequestBody(opts)(request, next)
    : (context: Context, next: Next) => coreRequestBody(opts)(context.request, next)
}

/**
* Expose `requestBody()`.
*/

export default requestBody
