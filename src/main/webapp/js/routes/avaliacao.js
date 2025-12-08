// avaliacoes.js
const pool = require('./db');

exports.listarPorProduto = async (req, res, next) => {
  try {
    const { produtoId } = req.params;
    const [avaliacoes] = await pool.query(
      'SELECT * FROM avaliacoes WHERE produto_id = ?',
      [produtoId]
    );
    res.json(avaliacoes);
  } catch (err) {
    next(err);
  }
};

exports.adicionar = async (req, res, next) => {
  try {
    const { produto_id, usuario_id, nota, comentario } = req.body;
    if (!produto_id || !usuario_id || !nota) {
      return res.status(400).json({ message: 'Dados obrigatórios faltando.' });
    }
    const resultado = await pool.query(
      'INSERT INTO avaliacoes (produto_id, usuario_id, nota, comentario) VALUES (?, ?, ?, ?)',
      [produto_id, usuario_id, nota, comentario || null]
    );
    res.status(201).json({ id: resultado[0].insertId });
  } catch (err) {
    next(err);
  }
};