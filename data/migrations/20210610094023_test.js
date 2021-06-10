exports.up = (knex) =>
  knex.schema.createTable('tests', (tbl) => {
    tbl.increments()
    tbl.text('title', 128).notNullable()
    tbl.text('hypothesis', 1024).notNullable()
    tbl.text('uuid', 128).notNullable()
    tbl.integer('percentage').unsigned()
    tbl.integer('split').unsigned()
  })

exports.down = (knex) => knex.schema.dropTableIfExists('tests')

/*
 title: "Text color on buy button",
    hypothesis: "A more in depth description of the hypothesis",
    percentage: 100,
    split: 2,
    id: "3b3fcd1e-537d-43fc-8375-3bc5ddbf13a1",
 */
