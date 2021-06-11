exports.up = (knex) =>
  knex.schema.createTable('tests', (table) => {
    table.increments()
    table.text('title').notNullable()
    table.text('hypothesis', 1024).notNullable()
    table.text('uuid').notNullable()
    table.integer('percentage').unsigned()
    table.integer('split').unsigned()
    table.boolean('active').notNullable().defaultTo(false)
    table.boolean('archived').notNullable().defaultTo(false)
    table.timestamp('activated_at')
    table.timestamp('archived_at')
    table.timestamps(false, true)
  })

exports.down = (knex) => knex.schema.dropTableIfExists('tests')
