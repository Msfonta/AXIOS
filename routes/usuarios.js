const express = require('express');
const router = express.Router();

// Essa função é responsável por retornar a lista de usuários
function getUsuarios(req, res) {
  const usuarios = [{ nome: 'João', idade: 30 }, { nome: 'Maria', idade: 25 }];
  res.send(usuarios);
}

// Essa função é responsável por criar um novo usuário
function criarUsuario(req, res) {
    console.log(req.body)
  const { nome, idade } = req.body;
  const novoUsuario = { nome, idade };
  // Aqui você pode salvar o novo usuário em um banco de dados, por exemplo
  res.send(novoUsuario);
}

// Aqui estamos definindo as rotas usando as funções que criamos acima
router.get('/', getUsuarios);
router.post('/', criarUsuario);

module.exports = router;
