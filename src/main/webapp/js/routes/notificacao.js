const express = require('express');
const router = express.Router();
const db = require('./db'); // Correto, pois db.js está na mesma pasta

router.get('/listar', async (req, res) => {
  try {
    const [results] = await db.query(
      'SELECT * FROM notificacoes WHERE usuario_id = ?',
      [req.query.usuario]
    );
    res.json(results);
  } catch (err) {
    res.status(500).json({ erro: true, mensagem: 'Erro ao buscar notificações', detalhes: err.message });
  }
});

router.post('/nova', async (req, res) => {
    try {
        // 🚨 O frontend envia 'titulo', 'mensagem' e 'usuario_id'.
        // Usamos 'titulo' (ex: 'Sucesso', 'Erro') para preencher a coluna 'tipo'
        const { titulo, mensagem, usuario_id } = req.body;
        
        // 🚨 SQL CORRIGIDO: Removendo 'titulo' e inserindo 'tipo' e 'data_criacao' (opcional)
        const [result] = await db.query(
            'INSERT INTO notificacoes (usuario_id, tipo, mensagem) VALUES (?, ?, ?)',
            [usuario_id, titulo, mensagem] // Mapeia o 'titulo' do frontend para o 'tipo' do BD
        );
        res.status(201).json({ sucesso: true, insertId: result.insertId });
    } catch (err) {
        console.error('ERRO SQL ao criar notificação:', err); // Use isso para depurar no seu terminal!
        res.status(500).json({ erro: true, mensagem: 'Erro ao criar notificação', detalhes: err.message });
    }
});
// 👇 ESSA LINHA ESTAVA FALTANDO OU INCOMPLETA!
module.exports = router;