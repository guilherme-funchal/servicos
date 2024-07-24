const express = require('express')
const routes = require('./routes')
const app = express()
var cors = require('cors');
app.use(cors())

require('./database')

app.use(express.json())
app.use(routes)

app.listen(3000, () => {
  console.log('Servidor REST executando...')
})