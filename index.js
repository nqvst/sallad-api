const express = require('express')
const crypto = require('crypto')
const cors = require('cors')
const morgan = require('morgan')
const basicAuth = require('express-basic-auth')

const MAX_SEGMENTS = process.env.MAX_SEGMENTS || 1_000_000
const PORT = process.env.PORT || 3001
const app = express()
const auth = basicAuth({
  users: { admin: '@rw6!A26hMt&t9VdxWK6' },
})

const db = require('./db.js')

console.log(process.env.STAGE)

const asyncMiddleware = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}

app.use(express.json())
app.use(cors())
app.use(morgan('combined'))

const getOffset = (uuid) => {
  try {
    const res = uuid
      .split('-')
      .map((part) => parseInt(part, 16))
      .reduce((sum, val) => (sum + val) % Number.MAX_SAFE_INTEGER, 0)
    return res % Number.MAX_SAFE_INTEGER
  } catch (e) {
    console.error(e)
    throw new Error('error parsing the segment id ' + uuid, e)
  }
}

const getValueByPercentile = (prtcentage) => {
  return Math.floor((MAX_SEGMENTS * prtcentage) / 100)
}

const getOffsetPercentiles = (test) => {
  const offset = getOffset(test.uuid)
  const start = offset % MAX_SEGMENTS
  const endPercentile = getValueByPercentile(test.percentage)
  const end = (start + endPercentile) % MAX_SEGMENTS

  return { start, end }
}

const getGroupInTestBySegment = (segment, test) => {
  const groupSize = getValueByPercentile(test.percentage / test.split)
  const { start, end } = getOffsetPercentiles(test)

  const groups = Array(test.split)
    .fill(0)
    .map((_, i) => {
      return {
        group: i,
        start: (start + groupSize * i) % MAX_SEGMENTS,
        end: (end + groupSize * (i + 1)) % MAX_SEGMENTS,
      }
    })

  const group = groups.find((g) => {
    return isInRange({ segment, start: g.start, end: g.end })
  })

  if (typeof group === 'undefined') {
    throw new Error('somehow the segment was not part of the test percentile')
  }

  return group.group
}

const isInRange = ({ segment, start, end }) => {
  if (start === end) {
    return true
  }
  if (end < start) {
    // wrapped around
    return segment >= start || segment <= end
  }
  return segment >= start && segment < end
}

const getActiveTestsForSegment = (segment, tests) => {
  const testsForSegment = tests
    .filter((t) => {
      return isInRange({ segment, ...getOffsetPercentiles(t) })
    })
    .filter((t) => t.active && !t.archived)

  return testsForSegment.map((t) => {
    return {
      ...t,
      group: getGroupInTestBySegment(segment, t),
      ...getOffsetPercentiles(t),
    }
  })
}

app.get('/', (req, res) => {
  res.json({
    version: 'v1',
    message: 'welcome',
    time: Date.now(),
  })
})

app.get('/generate', (req, res) => {
  res.json({ segment: crypto.randomInt(MAX_SEGMENTS) })
})

app.get(
  '/tests/segment/:segmentId',
  asyncMiddleware(async (req, res) => {
    const segmentId = parseInt(req.params.segmentId, 10)
    if (segmentId > MAX_SEGMENTS) {
      throw new Error('Segment is out of range')
    }
    if (isNaN(segmentId)) {
      return res.status(400).json({
        error: 'bad request',
        status: 400,
        message: 'invalid segmentId',
      })
    }
    const tests = await db.getAllTests()
    const activeTestsForSegment = getActiveTestsForSegment(segmentId, tests)
    res.json(activeTestsForSegment)
  })
)
app.get(
  '/tests/all',
  asyncMiddleware(async (req, res) => {
    const testsFromDb = await db.getAllTests()
    console.log(testsFromDb)
    res.json(testsFromDb.map((t) => ({ ...t, ...getOffsetPercentiles(t) })))
  })
)

app.get(
  '/tests/:testId',
  asyncMiddleware(async (req, res) => {
    const { testId } = req.params
    const test = await db.getTest(testId)
    console.log(test)
    res.json({
      ...test,
      ...getOffsetPercentiles(test),
    })
  })
)

app.post(
  '/tests/new',
  auth,
  asyncMiddleware(async (req, res) => {
    const inputData = req.body
    await db.createTest(inputData)
    res.json({ message: 'test created' })
  })
)

app.post(
  '/tests/activate',
  auth,
  asyncMiddleware(async (req, res) => {
    const { testId } = req.body
    await db.setActive(testId, true)
    const test = await db.getTest(testId)
    res.json(test)
  })
)

app.post(
  '/tests/deactivate',
  auth,
  asyncMiddleware(async (req, res) => {
    const { testId } = req.body
    await db.setActive(testId, false)
    const test = await db.getTest(testId)
    res.json(test)
  })
)

app.post(
  '/tests/archive',
  auth,
  asyncMiddleware(async (req, res) => {
    const { testId } = req.body
    await db.archiveTest(testId)
    const test = await db.getTest(testId)
    res.json(test)
  })
)

app.listen(PORT, () => {
  console.log(`Example app listening at http://localhost:${PORT}`)
})
