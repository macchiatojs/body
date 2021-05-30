import http from 'http';
import requestBody from '../src'
import { join, dirname } from 'path'
import request from 'supertest'
import { mkdirSync, readdirSync, rmdirSync } from 'fs';

describe('agnostic-body', () => {
  function createApp(bodyOpts = {}) {
    const server = http.createServer(async (request, response) => {
      try {
        const req = await requestBody(bodyOpts)(request)      
        response.statusCode = 200
        response.write(JSON.stringify(req?.body ?? String(req?.body)))
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
  it('sould return undefined when use unsupported method', (done) => {
    request(createApp())
      .get('/')
      .expect(/undefined/)
      .expect(200, done);
  })

  it('sould return parsed json when use supported method', (done) => {
    request(createApp())
      .post('/')
      .type('json')
      .send({ name: 'imed' })
      // .expect('Content-Type', /json/)
      .expect(/imed/)
      .expect(200, done);
  })

  it('sould return parsed form when use supported method', (done) => {
    request(createApp())
      .post('/')
      .type('form')
      .send({ name: 'imed' })
      // .expect('Content-Type', /urlencoded/)
      .expect(/imed/)
      .expect(200, done);
  })

  it('sould return parsed text when use supported method', (done) => {
    request(createApp())
      .post('/')
      .type('text')
      .send('imed')
      // .expect('Content-Type', /text/)
      .expect(/imed/)
      .expect(200, done);
  })

  it('sould return parsed html when use supported method', (done) => {
    request(createApp())
      .post('/')
      .type('html')
      .send('<h1>imed</h1>')
      // .expect('Content-Type', /html/)
      .expect(/imed/)
      .expect(200, done);
  })

  it('sould return parsed xml when use supported method', (done) => {
    request(createApp())
      .post('/')
      .type('xml')
      .send('<BUDDY>imed</BUDDY>')
      // .expect('Content-Type', /xml/)
      .expect(/imed/)
      .expect(200, done);
  })

  it('sould return parsed multipart (fields) when use supported method and active it through options', (done) => {
    request(createApp({ multipart: true }))
      .post('/')
      .type('multipart')
      .field('name', 'imed')
      .field('level', 10)
      .field('loves', ['mom', 'data', 'brother'])
      // .expect('Content-Type', /multipart/)
      .expect(/{"name":"imed","level":"10","loves":\["mom","data","brother"\]}/)
      .expect(200, done);
  })

  it('sould return parsed multipart (files) when use supported method and active it through options', (done) => {
    // upload path.
    const path = join(process.cwd(),  './test/uploads')
    // remove the current uploads directory.
    rmdirSync(path, { recursive: true })
    // create new uploads directory.
    mkdirSync(path)

    request(createApp({ 
      multipart: true,
      formidable: {
        keepExtensions: true,
        uploadDir: './test/uploads'
      }
    }))
      .post('/')
      .type('multipart')
      .attach('firstField', 'package.json')
      // .expect('Content-Type', /multipart/)
      .expect(200)
      .end((err, res) => {
        let counter = 0
        readdirSync(path).forEach(() => { ++counter })
        counter === 1 && done()
      })
  })

  it('should work fine when passed formidable options', (done) => {
    // upload path.
    const path = join(process.cwd(),  './test/uploads')
    // remove the current uploads directory.
    rmdirSync(path, { recursive: true })
    // create new uploads directory.
    mkdirSync(path)

    request(createApp({ 
      multipart: true,
      formidable: {
        multiples: true,
        keepExtensions: true,
        uploadDir: './test/uploads'
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
      .end((err, res) => {
        let counter = 0
        readdirSync(path).forEach(() => { ++counter })
        counter === 4 && done()
      })
  })

  it('should transform names funcs work fine', (done) => {
    // upload path.
    const path = join(process.cwd(),  './test/uploads')
    // remove the current uploads directory.
    rmdirSync(path, { recursive: true })
    // create new uploads directory.
    mkdirSync(path)

    const CUSTOM_NAME = 'my_custom_package.json'

    request(createApp({ 
      multipart: true,
      formidable: {
        keepExtensions: true,
        uploadDir: './test/uploads',
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
      .end((err, res) => {
        let counter = 0
        readdirSync(path).forEach((file) => { 
          if (file === CUSTOM_NAME) ++counter
        })
        counter === 1 && done()
      })
  })

  it('should limit the json respone', (done) => {
    request(createApp({ jsonLimit: 10 /* bytes */ }))
      .post('/')
      .type('json')
      .send({ name: 'some-long-name-for-limit' })
      // .expect('Content-Type', /json/)
      .expect(/some thing long .../)
      .expect(500, done)
  })

  it('should limit the form respone', (done) => {
    request(createApp({ formLimit: 10 }))
    .post('/')
    .type('form')
    .send({ name: 'some-long-name-for-limit' })
    // .expect('Content-Type', /urlencoded/)
    .expect(/some thing long .../)
    .expect(500, done)
  })

  it('should limit the text respone', (done) => {
    request(createApp({ textLimit: 10 }))
    .post('/')
    .type('text')
    .send('some-long-name-for-limit')
    // .expect('Content-Type', /text/)
    .expect(/some thing long .../)
    .expect(500, done)
  })
})