to get the `database_url`

run

```
$ heroku config
```

and export the DATABASE_URL in the shell where the api will run

### Database migrations.

if fields are added or changes to the database structure are made, we need to create a migration file with the knex module:

```
knex migrate:make new_table_user
```

make the changes:

```
exports.up = (knex) =>
  knex.schema.createTable('user', (table) => {
    table.increments()
    table.text('name').notNullable()
  })

exports.down = (knex) => knex.schema.dropTableIfExists('user')
```

and then run the migration with:

```
knex migrate:make new_table_user
```
