const conf = require('./knexfile.js')
const env = process.env.STAGE || 'development'
const { v4: uuidv4 } = require('uuid')
const knex = require('knex')

const db = knex(conf[env])

const getAllTests = async () => {
  return db.select().table('tests')
}

const getTest = async (id) => {
  return db('tests').where('id', id)
}

const createTest = ({ title, hypothesis, percentage, split }) => {
  if (!title || !hypothesis || !percentage || !split) {
    throw new Error('all the parameters needs to be provided', {
      title,
      hypothesis,
      percentage,
      split,
    })
  }

  const uuid = uuidv4()

  return db('tests').insert({
    uuid,
    title,
    hypothesis,
    percentage,
    split,
  })
}

const archiveTest = (id) => {
  return db('tests').where('id', id).update({
    archived: true,
    active: false,
    archived_at: 'now',
    updated_at: 'now',
  })
}

const setActive = (id) => {
  return db('tests').where('id', id).update({
    active: true,
    activated_at: 'now',
    updated_at: 'now',
  })
}

const setInactive = (id) => {
  return db('tests').where('id', id).update({
    active: false,
    updated_at: 'now',
  })
}

const deleteTest = (id) => {
  return db('tests').where('id', id).del()
}

module.exports = {
  getAllTests,
  createTest,
  deleteTest,
  setActive,
  getTest,
  archiveTest,
  setInactive,
}
