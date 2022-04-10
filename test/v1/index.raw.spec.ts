/* eslint-disable @typescript-eslint/no-explicit-any */
import assert from 'assert'
import request from 'supertest'
import { join, dirname } from 'path'
import http from 'http'
import { mkdirSync, readdirSync, rmSync } from 'fs'

import { rawBody } from '../../src/v1'

describe('agnostic-body - formidable-v1 - with raw', () => {
  function createApp(bodyOpts = {}) {
    const server = http.createServer(async (request: any, response: any) => {
      try {
        await rawBody(bodyOpts)(request, response)      
        response.statusCode = 200
        response.write(JSON.stringify(request?.body ?? String(request?.body)))
        response.end()
        return
      } catch (error) {
        response.statusCode = 500
        response.end('some thing long ...')
        return
      }
    })
  
    return server
  }

  // default method: post, put, patch.
  it('sould return undefined when use unsupported method', async () => {
    request(createApp())
      .get('/')
      .expect(/undefined/)
      .expect(200);
  })

  it('sould return parsed json when use supported method', async () => {
    request(createApp())
      .post('/')
      .type('json')
      .send({ name: 'imed' })
      // .expect('Content-Type', /json/)
      .expect(/imed/)
      .expect(200);
  })

  it('sould return parsed form when use supported method', async () => {
    request(createApp())
      .post('/')
      .type('form')
      .send({ name: 'imed' })
      // .expect('Content-Type', /urlencoded/)
      .expect(/imed/)
      .expect(200);
  })

  it('sould return parsed text when use supported method', async () => {
    request(createApp())
      .post('/')
      .type('text')
      .send('imed')
      // .expect('Content-Type', /text/)
      .expect(/imed/)
      .expect(200);
  })

  it('sould return parsed html when use supported method', async () => {
    request(createApp())
      .post('/')
      .type('html')
      .send('<h1>imed</h1>')
      // .expect('Content-Type', /html/)
      .expect(/imed/)
      .expect(200);
  })

  it('sould return parsed xml when use supported method', async () => {
    request(createApp())
      .post('/')
      .type('xml')
      .send('<BUDDY>imed</BUDDY>')
      // .expect('Content-Type', /xml/)
      .expect(/imed/)
      .expect(200);
  })

  it('sould return parsed multipart (fields) when use supported method and active it through options', async () => {
    await request(createApp({ multipart: true }))
      .post('/')
      .type('multipart')
      .field('name', 'imed')
      .field('level', 10)
      .field('loves', ['mom', 'data', 'brother'])
      // .expect('Content-Type', /multipart/)
      .expect(/{"name":"imed","level":"10","loves":\["mom","data","brother"\]}/)
      .expect(200);
  })

  it('sould return parsed multipart (files) when use supported method and active it through options', async () => {
    // upload path.
    const path = join(process.cwd(),  './test/v1/uploads')
    // remove the current uploads directory.
    rmSync(path, { recursive: true })
    // create new uploads directory.
    mkdirSync(path)

    await request(createApp({ 
      multipart: true,
      formidable: {
        keepExtensions: true,
        uploadDir: './test/v1/uploads'
      }
    }))
      .post('/')
      .type('multipart')
      .attach('firstField', 'package.json')
      // .expect('Content-Type', /multipart/)
      .expect(200)
    let counter = 0
    readdirSync(path).forEach(() => { ++counter })
    counter === 1
    assert(counter === 1)

  })

  it('should work fine when passed formidable options', async () => {
    // upload path.
    const path = join(process.cwd(),  './test/v1/uploads')
    // remove the current uploads directory.
    rmSync(path, { recursive: true })
    // create new uploads directory.
    mkdirSync(path)

    await request(createApp({ 
      multipart: true,
      formidable: {
        multiples: true,
        keepExtensions: true,
        uploadDir: './test/v1/uploads'
      }
    }))
      .post('/')
      .type('multipart')
      .attach('firstField', 'package.json')
      .attach('secondField', '.travis.yml')
      .attach('thirdField', 'LICENSE')
      .attach('fourthField', 'CHANGELOG.md')
      // .expect('Content-Type', /multipart/)
      .expect(200)
    let counter = 0
    readdirSync(path).forEach(() => { ++counter })
    assert(counter === 4)
  })

  it('should transform names funcs work fine', async () => {
    // upload path.
    const path = join(process.cwd(),  './test/v1/uploads')
    // remove the current uploads directory.
    rmSync(path, { recursive: true })
    // create new uploads directory.
    mkdirSync(path)

    const CUSTOM_NAME = 'my_custom_package.json'

    await request(createApp({ 
      multipart: true,
      formidable: {
        keepExtensions: true,
        uploadDir: './test/v1/uploads',
        onFileBegin:  (name, file) => {
          file.name = CUSTOM_NAME
          const folder = dirname(file.path);
          file.path = join(folder, file.name);
        }
      }
    }))
      .post('/')
      .type('multipart')
      .attach('firstField', 'package.json')
      // .expect('Content-Type', /multipart/)
      .expect(200)

    let counter = 0

    readdirSync(path).forEach((file) => {      
      if (file === CUSTOM_NAME) ++counter
    })
    assert(counter === 1)
  })

  it('should limit the json respone', async () => {
    return await request(createApp({ jsonLimit: 10 /* bytes */ }))
      .post('/')
      .type('json')
      .send({ name: 'some-long-name-for-limit' })
      // .expect('Content-Type', /json/)
      .expect(/some thing long .../)
      .expect(500)
  })

  it('should limit the form respone', async () => {
    return await request(createApp({ formLimit: 10 }))
      .post('/')
      .type('form')
      .send({ name: 'some-long-name-for-limit' })
      // .expect('Content-Type', /urlencoded/)
      .expect(/some thing long .../)
      .expect(500)
  })

  it('should limit the text respone', async () => {
    return await request(createApp({ textLimit: 10 }))
      .post('/')
      .type('text')
      .send('some-long-name-for-limit')
      // .expect('Content-Type', /text/)
      .expect(/some thing long .../)
      .expect(500)
  })
})
