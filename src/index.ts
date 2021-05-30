/**
 * @3imed-jaberi/body
 *
 * Copyright(c) 2021 Imed Jaberi
 * MIT Licensed
 */

'use strict'

/**
 * Module dependencies.
 */

import { IncomingMessage } from 'http'
import buddy from 'co-body'
import forms, { Files, Options } from 'formidable'
import typeIs from 'type-is'

interface Request extends IncomingMessage {
  body?: any;
  files?: Files;
}

interface BodyOptions {
  multipart?: boolean
  urlencoded?: boolean
  json?: boolean
  text?: boolean
  encoding?: string
  jsonLimit?: number|string
  jsonStrict?: boolean
  formLimit?: string
  queryString?: string|null
  textLimit?: string
  formidable?: Options 
  includeUnparsed?: boolean
  parsedMethods?: string[]
}

/**
 * full-featured agnostic body parser 🦄. 
 *
 * @param {Object} options
 * @api public
 */
function requestBody(opts: BodyOptions = {}) {
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

  return async function (request: Request) {    
    // co-body parsers [json, form, text].
    const buddyParser = (type) => buddy[type](request, buddyOptions[type])
    
    // formidable parser [multipart].
    const formyParser = (request, opts): Promise<unknown> => {
      return new Promise(function (resolve, reject) {
        let fields = {}
        let files = {}
        let form = new forms.IncomingForm(opts)

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
      try {
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
          const is = (type, ...types) => typeIs(request, type, ...types);
    
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
          request.body = body.fields
          request.files = body.files
        } else {
          request.body = body
        }

        return request
      } catch (error) {
          throw error
      }
    }
  }
}

/**
* Expose `requestBody()`.
*/

export default requestBody
