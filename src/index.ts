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

import buddy from 'co-body'
import forms, { Files, Options } from 'formidable'
import typeIs from 'type-is' // peerDep. needed with raw Node.js
import { IncomingMessage } from 'http'
import type { ServerResponse } from 'http'
import { Request } from '@macchiatojs/kernel'
import type { Context, Response, Next } from '@macchiatojs/kernel'

export interface MacchiatoRequest<TBody=unknown> extends Request {
  body?: TBody;
  files?: Files;
}

export interface RawRequest<TBody=unknown> extends IncomingMessage {
  body?: TBody;
  files?: Files;
}

export type BodyRequest<T=unknown> = RawRequest<T> | MacchiatoRequest<T>

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
  const buddyOptions: { [key:string]: buddy.Options } = {
    json: {
      encoding: opts.encoding,
      limit: opts.jsonLimit,
      strict: opts.jsonStrict,
      returnRawBody: opts.includeUnparsed
    } as buddy.Options,
    form: {
      encoding: opts.encoding,
      limit: opts.formLimit,
      queryString: opts.queryString,
      returnRawBody: opts.includeUnparsed
    } as buddy.Options,
    text: {
      encoding: opts.encoding,
      limit: opts.textLimit,
      returnRawBody: opts.includeUnparsed
    } as buddy.Options
  }

  return async (req: BodyRequest, response?: Response, next?: Next) => {    
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
      let body
      try {
        body = await bodyParser()
      } catch (error) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (response as Response).status = (error as any)['status']
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        body = (error as any)['message']
      }

      // merge the parsed result with the Node.js request object.
      if (type === 'multipart') {
        request['body'] = body.fields
        request['files'] = body.files
      } else {
        request['body'] = body
      }

      // mapped from rawRequest to request only when use macchiato.js
      if(req instanceof Request) {
        // 
        req.body = request['body']
        req.files = request['files']

        // go to the next middleware
        return next?.()
      }
    }
  }
}

// middleware/hook/helper for raw Node.js
export function rawBody(opts: BodyOptions) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return (request: IncomingMessage, response: ServerResponse): Promise<unknown> => coreRequestBody(opts)(request)
}

// middleware for Macchiato.js
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function requestBody(opts: BodyOptions) {
  opts.expressify = opts.expressify ?? true

  return opts.expressify
    ? (request: Request, response: Response, next: Next) => coreRequestBody(opts)(request, response, next)
    : (context: Context, next: Next) => coreRequestBody(opts)(context.request, context.response, next)
}

/**
* Expose `requestBody()`.
*/

export default requestBody
