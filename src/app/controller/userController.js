const client = require('../database/database')
const express = require('express')
const router = express.Router();
const authPage = require('../middlewares/userMiddlewares')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
require('dotenv').config()

client.connect()

const verifyJWT = (req, res, next) => {
  const token = req.headers['x-access-token'];
  jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
    if (err) {
      console.log(err)
      return res.status(401).end()
    }

    req.userId = decoded.id
    next()
  })
}


router.post('/cadastro', async (req, res) => {
  const user = req.body;
  const hashedPassword = await bcrypt.hash(user.senha, 10)
  const selectQuery = `SELECT email FROM usuarios WHERE email = '${user.email}'`
  const insertQuery = `insert into usuarios(nome, email, senha) values ('${user.nome}', '${user.email}', '${hashedPassword}')`

  client.query(selectQuery, (err, result) => {
    if (!err) {
      if (result.rowCount > 0) {
        res.status(400).json({ status: false, message: 'E-mail já cadastrado' })
      } else {
        client.query(insertQuery, (err, result) => {
          if (!err) {
            let INSERT = `insert into usuarios_grupos (id_usuario, id_grupo) values (currval('usuarios_id_seq'::regclass) , ${user.grupo})`
            client.query(INSERT, (err, result) => {
              if(!err) {
                res.json({status: true})
              }
            })
          } else {
            res.status(400).json({ status: false, message: 'Erro na inserção', debug: err.message });
          }
        })
      }
    }
  })
  client.end;
})

router.post('/login', (req, res) => {
  const user = req.body;
  const selectQuery = `SELECT u.id, u.nome, u.senha, u.email, ug.id_grupo FROM usuarios u
  INNER JOIN usuarios_grupos ug 
  ON ug.id_usuario = u.id
  INNER JOIN grupos g
  ON g.id = ug.id_grupo
  WHERE u.email = '${user.email}';`;

  client.query(selectQuery, async (err, result) => {
    if (!err) {
      if (result.rowCount > 0) {
        const senha = result.rows[0].senha
        const id = result.rows[0].id
        const token = jwt.sign({ id }, process.env.SECRET_KEY, { expiresIn: 3000 })
        const isValidPassword = await bcrypt.compare(user.senha, senha)

        if (isValidPassword) {
          res.json({ status: isValidPassword, usuario: result.rows, token });
        } else {
          res.status(404).end()
        }
      } else {
        res.status(401).json({ status: false, message: 'Não foi encontrado nenhum usuário com este email' })
      }
    } else {
      res.status(401).json({ status: false, message: 'SQL incorreto', debug: err.message })
    }
  });
  client.end;
})

router.get('/listarUsuarios', verifyJWT, (req, res) => {
  const selectQuery = `SELECT nome, email, admin FROM usuarios`

  client.query(selectQuery, (err, result) => {
    if (!err) {
      res.send(result.rows);
    } else {
      res.status(400).json({ status: false, message: 'SQL incorreto' })
    }
  });
  client.end;
})

router.get('/', (req, res) => {
  client.query(`SELECT u.id, u.nome nome, u.email, g.nome grupo FROM usuarios u INNER JOIN usuarios_grupos ug ON ug.id_usuario = u.id INNER JOIN grupos g ON g.id = ug.id_grupo ORDER BY u.id, u.nome`, 
  (err, result) => {
    if (!err) {
      res.send(result.rows)
    } else {
      res.status(404).end()
    }
  });
  client.end;
})

router.get('/:id', (req, res) => {
  client.query(`SELECT u.id, u.nome nome, u.email, g.id grupo FROM usuarios u INNER JOIN usuarios_grupos ug ON ug.id_usuario = u.id INNER JOIN grupos g ON g.id = ug.id_grupo where u.id=${req.params.id}`, (err, result) => {
    if (!err) {
      res.json(result.rows);
    } else {
      res.json({ status: false, message: err.message });
    }
  });
  client.end;
})

router.put('/:id', async (req, res) => {
  const user = req.body;
  
  let updateQuery = `update usuarios set nome = '${user.nome}', email = '${user.email}', "updatedAt" = now() `

  if (user.senha) {
    const hashedPassword = await bcrypt.hash(user.senha, 10)
    updateQuery += `, senha = '${hashedPassword}' `
  }
  updateQuery += `where id = ${req.params.id}`

  client.query(updateQuery, (err, result) => {
    if (!err) {
      let updateQuery2 = `update usuarios_grupos set id_grupo = ${user.grupo} WHERE id_usuario = ${user.id}`
      client.query(updateQuery2, (err, result) => {
        if(!err){
          res.json(user)
        } else {
          res.status(404).end()
        }
      })
    }
    else {
      res.json({ status: false, message: err.message });
    }
  })
  client.end;
})

router.put('/delete/:id', (req, res) => {
  let updateQuery = `update usuarios set excluido = 1, "updatedAt" = now() where id = ${req.params.id}`

  client.query(updateQuery, (err, result) => {
    if (!err) {
      res.json({ status: true, message: 'Desabilitado com sucesso!' })
    }
    else {
      res.json({ status: false, message: err.message });
    }
  })
  client.end;
})

router.put('/activate/:id', (req, res) => {
  let updateQuery = `update usuarios set excluido = 0, "updatedAt" = now() where id = ${req.params.id}`

  client.query(updateQuery, (err, result) => {
    if (!err) {
      res.json({ status: true, message: 'Reabilitado com sucesso!' })
    }
    else {
      res.json({ status: false, message: err.message });
    }
  })
  client.end;
})

module.exports = router;