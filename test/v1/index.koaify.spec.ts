import assert from 'assert'
import request from 'supertest'
import { join, dirname } from 'path'
import Kernel from '@macchiatojs/kernel'
import type { Context } from '@macchiatojs/kernel'
import { mkdirSync, readdirSync, rmSync } from 'fs'

import { requestBody } from '../../src/v1'

describe('agnostic-body - formidable-v1 - with koaify', () => {
  function createApp(bodyOpts = {}) {
    const app = new Kernel({ expressify: false })
    
    app
      .use(requestBody({ ...bodyOpts, expressify: false }))
      .use((context: Context) => {
        context.response.body = context.request['body']
      })
    
    return app
  }

  // default method: post, put, patch.
  it('sould return undefined when use unsupported method', async () => {
    return await request(createApp().start())
      .get('/')
      .expect(200, '')
  })

  it('sould return parsed json when use supported method', async () => {
    return await request(createApp().start())
      .post('/')
      .type('json')
      .send({ name: 'imed' })
      // .expect('Content-Type', /json/)
      .expect(/imed/)
      .expect(200)
  })

  it('sould return parsed form when use supported method', async () => {
    return await request(createApp().start())
      .post('/')
      .type('form')
      .send({ name: 'imed' })
      // .expect('Content-Type', /urlencoded/)
      .expect(/imed/)
      .expect(200)
  })

  it('sould return parsed text when use supported method', async () => {
    return await request(createApp().start())
      .post('/')
      .type('text')
      .send('imed')
      // .expect('Content-Type', /text/)
      .expect(/imed/)
      .expect(200)
  })

  it('sould return parsed html when use supported method', async () => {
    return await request(createApp().start())
      .post('/')
      .type('html')
      .send('<h1>imed</h1>')
      // .expect('Content-Type', /html/)
      .expect(/imed/)
      .expect(200)
  })

  it('sould return parsed xml when use supported method', async () => {
    return await request(createApp().start())
      .post('/')
      .type('xml')
      .send('<BUDDY>imed</BUDDY>')
      // .expect('Content-Type', /xml/)
      .expect(/imed/)
      .expect(200)
  })

  it('sould return parsed multipart (fields) when use supported method and active it through options', async () => {
    await request(createApp({ multipart: true }).start())
      .post('/')
      .type('multipart')
      .field('name', 'imed')
      .field('level', 10)
      .field('loves', ['mom', 'data', 'brother'])
      // .expect('Content-Type', /multipart/)
      .expect(/{"name":"imed","level":"10","loves":\["mom","data","brother"\]}/)
      .expect(200)
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
    }).start())
      .post('/')
      .type('multipart')
      .attach('firstField', 'package.json')
      // .expect('Content-Type', /multipart/)
      .expect(200)
    let counter = 0
    readdirSync(path).forEach(() => { ++counter })
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
    }).start())
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
          const folder = dirname(file.path)
          file.path = join(folder, file.name)
        }
      }
    }).start())
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

  // TODO: fix limit behave (work only with v0.1.0)
  it('should limit the json respone', async () => {
    return await request(createApp({ jsonLimit: 10 /* bytes */ }).start())
      .post('/')
      .type('json')
      .send({ name: 'some-long-name-for-limit' })
      // .expect('Content-Type', /json/)
      .expect(/request entity too large/)
      .expect(413)
  })

  it('should limit the form respone', async () => {
    return await request(createApp({ formLimit: 10 }).start())
      .post('/')
      .type('form')
      .send({ name: 'some-long-name-for-limit' })
      // .expect('Content-Type', /urlencoded/)
      .expect(/request entity too large/)
      .expect(413)
  })

  it('should limit the text respone', async () => {
    return await request(createApp({ textLimit: 10 }).start())
      .post('/')
      .type('text')
      .send('some-long-name-for-limit')
      // .expect('Content-Type', /text/)
      .expect(/request entity too large/)
      .expect(413)
  })
})