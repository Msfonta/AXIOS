const client = require('../database/database')
const express = require('express')
const router = express.Router();
const authPage = require('../middlewares/userMiddlewares')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
require('dotenv').config()

// client.connect()

router.get('/', (req, res) => {
        client.query(`select id, nome from categorias WHERE excluido = 0 ORDER BY ID, NOME`, (err, result) => {
          if(!err){
            res.json(result.rows)
          } else {
            res.status(404).end()
          }
          client.end;
        })
})

router.get('/:id', (req, res) => {
    const selectQuery = `SELECT id, nome, perm_usuarios, perm_produtos, perm_dashboard, perm_grupos, perm_grupos, excluido FROM grupos WHERE id = ${req.params.id} WHERE excluido = 0`

    client.query(selectQuery, (err, result) => {
        if(!err){
            res.send(result.rows)
        } else {
            res.status(404).end()
        }
    })
})

router.post('/cadastro', (req, res) => {
    const categoria = req.body
    const postQuery = `INSERT INTO categorias (nome) VALUES ('${categoria.nome}')`

    client.query(postQuery, (err, result) => {
        if(!err){
            console.log(result.rows)
            if(result.rowCount > 0) {
                res.json({status: true, message: 'Categoria criada com sucesso!'})
            }
        } else {
            res.status(404).end()
        }
    })
})

router.put('/:id', (req, res) => {
    const group = req.body
    const updateQuery = `UPDATE categorias set nome = '${group.nome}' WHERE id = ${req.params.id}`

    client.query(updateQuery, (err, result) => {
        if(!err) {
            res.json({status: true, message: 'Categoria alterada com sucesso!'})
        } else {
            res.status(404).end()
        }
    })
})

router.put('/delete/:id', (req, res) => {
    const deleteQuery = `UPDATE categorias set excluido = 1, "dataExclusao" = now() WHERE id = ${req.params.id}`

    client.query(deleteQuery, (err, result) => {
        if(!err){
            res.json({status: true, message: 'Grupo excluido com sucesso!'})
        } else {
            res.status(404).end()
        }
    })
})



module.exports = router