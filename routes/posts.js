const express = require('express');
const router = express.Router()
const axios = require('axios');


// Essa função é responsável por retornar a lista de usuários
function getPosts(req, res) {
    axios.get('https://jsonplaceholder.typicode.com/posts/1')
    .then(response => {
      const posts = response.data;
      res.json(posts);
    })
    .catch(error => {
      console.log(error);
      res.status(500).send('Erro ao buscar os posts');
    });
}


router.get('/', getPosts);

module.exports = router;
