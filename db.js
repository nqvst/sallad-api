const conf = require('./knexfile.js')
const env = process.env.STAGE || 'development'
const { v4: uuidv4 } = require('uuid')

const knex = require('knex')(conf[env])
console.log(conf[env])
const getAllTests = async () => {
  return knex.select().table('tests')
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
  return knex('tests').insert({
    uuid,
    title,
    hypothesis,
    percentage,
    split,
  })
}
module.exports = {
  getAllTests,
  createTest,
}
