import {Hono} from 'hono'
import {cors} from 'hono/cors'

import Get from './routes/get'
import Patch from './routes/patch'
import Put from './routes/put'
import Delete from "./routes/delete"

import MpuCreate from './routes/mpu/create'
import MpuParts from './routes/mpu/parts'
import MpuAbort from './routes/mpu/abort'
import MpuComplete from './routes/mpu/complete'
import MpuSupport from './routes/mpu/support'

import checkHeader from "./middleware/checkHeader"
import { generateKey } from './middleware/presignUrl'

const app = new Hono()

app.use('*', checkHeader)

app.use(cors())

app.get("/", (c) => {
  return c.body(
    JSON.stringify({ message: "Hello world !!!", status: 200 }),
    200,
    {
      "X-Message": "Hello world!",
      "Content-Type": "text/json",
    }
  );
});

// sharing resource
app.post('/share', generateKey) 

// multipart upload operations
app.get('/support_mpu', MpuSupport)
app.post('/mpu/create/:key{.*}', MpuCreate)
app.put('/mpu/:key{.*}', MpuParts)
app.delete('/mpu/:key{.*}', MpuAbort)
app.post('/mpu/complete/:key{.*}', MpuComplete)

// normal r2 operations
app.get('/:key{.*}', Get)
app.patch('/', Patch)
app.put('/:key{.*}', Put)
app.delete('/:key{.*}', Delete)

app.all('*', c => {
  return c.body(
    JSON.stringify({ message: "404 Not Found", status: 404 }),
    404,
    {
      "X-Message": "Hello world!",
      "Content-Type": "text/json",
    }
  );
})

export default app
