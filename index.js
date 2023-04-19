const express = require('express')
const app = express();
const cors = require('cors')

app.use(cors())


app.listen(3000, function() {
    console.log('rodando na porta 3000')
})

// Aqui estamos importando as rotas de usuarios
const usuariosRouter = require('./routes/usuarios');
const postsRouter = require('./routes/posts')

// Aqui estamos registrando as rotas de usuarios na aplicação
app.use('/usuarios', usuariosRouter);
app.use('/posts', postsRouter)