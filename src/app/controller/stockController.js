const client = require('../database/database')
const express = require('express')
const router = express.Router();
const authPage = require('../middlewares/userMiddlewares')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const pdf = require('html-pdf')
const ejs = require('ejs')
const fs = require('fs')
require('dotenv').config()


router.get('/', (req, res) => {
    const selectQuery = `SELECT ce.id, p.nome nomeProduto, p.marca, ct.nome categoria, ce.operacao, ce."dataOperacao", ce.quantidade, u.nome nomeUsuario FROM "controleEstoque" ce inner join usuarios u  on u.id = ce.id_usuario inner join produtos p on p.id = ce.id_produto inner join categorias ct on ct.id = p.categoria_id ORDER BY ce."dataOperacao" desc;`
    client.query(selectQuery, (err, result) => {
        if (!err) {
            res.send(result.rows)
        } else {
            res.status(404).end()
        }
    })
})

router.get('/produto', (req, res) => {
    const dados = req.query;

    let selectQuery = `SELECT ce.id, p.nome nomeProduto, p.marca, ct.nome categoria, ce.operacao, ce."dataOperacao", u.nome nomeUsuario 
                       FROM "controleEstoque" ce 
                       INNER JOIN usuarios u ON u.id = ce.id_usuario 
                       INNER JOIN produtos p ON p.id = ce.id_produto 
                       INNER JOIN categorias ct ON ct.id = p.categoria_id`;

    if (dados.busca) {
        selectQuery += ` WHERE (ct.nome like '%${dados.busca}' OR p.nome like '%${dados.busca}' OR p.marca like '%${dados.busca}' OR u.nome like '%${dados.busca}')`
    }

    if (dados.dataInicial) {
        if (!dados.busca) {
            selectQuery += ` WHERE ce."dataOperacao" BETWEEN '${dados.dataInicial}' AND '${dados.dataFinal}'`
        } else {
            selectQuery += ` AND ce."dataOperacao" BETWEEN '${dados.dataInicial}' AND '${dados.dataFinal}'`;
        }
    }

    if (dados.operacao > 0) {
        selectQuery += ` AND ce.operacao = ${dados.operacao}`
    }

    selectQuery += ` ORDER BY ce."dataOperacao" desc`;

    client.query(selectQuery, (err, result) => {
        if (!err) {
            res.json(result.rows);
        } else {
            console.error(err);
            res.status(500).json({ status: false, message: 'Erro ao buscar os dados do produto.' });
        }
    });
});

router.put('/:id', (req, res) => {
    const controle = req.body
    let query;

    if (controle) {
        if (controle.operacao == 2) {
            query = `UPDATE produtos set quantidade = quantidade + 1 WHERE id = ${controle.id}`
        } else {
            query = `UPDATE produtos set quantidade = quantidade - 1 WHERE id = ${controle.id}`
        }
        const postQuery = `INSERT INTO "controleEstoque" (id_produto, operacao, quantidade, id_usuario) VALUES ('${controle.id}', ${controle.operacao}, (SELECT quantidade FROM produtos WHERE "codigoSKU" = ${controle.id})  , ${controle.usuario.id})`
        client.query(query, (err, result) => {
            console.log(query)
            if (!err) {
                client.query(postQuery, (err, result) => {
                    if (!err) {
                        res.json({ status: true, message: 'Operação concluida com sucesso!' })
                    } else {
                        res.send(err).status(404)
                    }
                })
            } else {
                res.status(404).end()
            }
        })
    }
})

router.put('/delete/:id', (req, res) => {
    const deleteQuery = `UPDATE grupos set excluido = 1, "dataExclusao" = now() WHERE id = ${req.params.id}`

    client.query(deleteQuery, (err, result) => {
        if (!err) {
            res.json({ status: true, message: 'Grupo excluido com sucesso!' })
        } else {
            res.status(404).end()
        }
    })
})

router.put('/activate/:id', (req, res) => {
    const deleteQuery = `UPDATE grupos set excluido = 0, "dataExclusao" = now() WHERE id = ${req.params.id}`

    client.query(deleteQuery, (err, result) => {
        if (!err) {
            res.json({ status: true, message: 'Grupo reativado com sucesso!' })
        } else {
            res.status(404).end()
        }
    })
})

router.get('/relatorio', (req, res) => {
    const dados = req.query;
    let imageLogo = "http://localhost:5500/assets/images/LOGO%2003.png"

    let selectQuery = `SELECT ce.id, p.nome nomeProduto, p.marca, ct.nome categoria, case operacao when 1 then 'Saida' else 'Entrada' end operacao, TO_CHAR(ce."dataOperacao", 'dd/mm/yyyy HH:MI') dataOperacao, u.nome nomeUsuario 
                       FROM "controleEstoque" ce 
                       INNER JOIN usuarios u ON u.id = ce.id_usuario 
                       INNER JOIN produtos p ON p."codigoSKU" = ce.id_produto 
                       INNER JOIN categorias ct ON ct.id = p.categoria_id`;

    if (dados.busca) {
        selectQuery += ` WHERE (ct.nome like '%${dados.busca}' OR p.nome like '%${dados.busca}' OR p.marca like '%${dados.busca}' OR u.nome like '%${dados.busca}')`
    }

    if (dados.dataInicial) {
        if (!dados.busca) {
            selectQuery += ` WHERE ce."dataOperacao" BETWEEN '${dados.dataInicial}' AND '${dados.dataFinal}'`
        } else {
            selectQuery += ` AND ce."dataOperacao" BETWEEN '${dados.dataInicial}' AND '${dados.dataFinal}'`;
        }
    }

    if (dados.operacao > 0) {
        selectQuery += ` AND ce.operacao = ${dados.operacao}`
    }

    selectQuery += ` ORDER BY ce."dataOperacao" desc`;

    client.query(selectQuery, (err, result) => {
        if (!err) {
            ejs.renderFile("./views/estoque/estoque.ejs", { dados: result.rows, dt_inicial: dados.dataInicial, dt_final: dados.dataFinal, imageLogo }, (err, html) => {
                if (err) {
                    console.log(err)
                } else {
                    pdf.create(html, {
                        format: 'A4',
                        orientation: 'portrait',
                        paginationOffset: 1,
                        "border": {
                            "top": "5mm",
                            "right": "0",
                            "bottom": "8mm",
                            "left": "0"
                        },
                        phantomArgs: ["--ignore-ssl-errors=yes", "--debug=no", "--web-security=no", "--ssl-protocol=any"],
                        renderDelay: 2000
                    }).toFile('./views/estoque/estoque.pdf', (error, response) => {
                        if (err) {
                            res.status(500).end()
                        } else {
                            res.json({ status: true, message: response })
                        }
                    })

                }
            })
        } else {
            console.error(err);
            res.status(500).json({ status: false, message: 'Erro ao buscar os dados do produto.' });
        }
    });
})


router.get('/download', (req, res) => {
    const filePath = './views/estoque/estoque.pdf';

    fs.readFile(filePath, (err, file) => {
        if (err) {
            console.log(err);
            return res.status(500).send('Could not download file');
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="estoque.pdf"');

        res.send(file);
    });
});

module.exports = router