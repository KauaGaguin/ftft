const pool = require('./db');
const db = pool;

// LISTAR ENDEREÇOS DO USUÁRIO
exports.listar = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM enderecos WHERE usuario_id = ? ORDER BY id DESC', [req.params.usuarioId]);
        res.json(rows);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Erro ao buscar endereços.' });
    }
};

// ADICIONAR NOVO ENDEREÇO
exports.adicionar = async (req, res) => {
    const { usuarioId, apelido, cep, rua, numero, bairro, cidade, uf } = req.body;
    
    if (!usuarioId || !cep || !rua || !numero) {
        return res.status(400).json({ message: 'Dados obrigatórios faltando.' });
    }

    try {
        await db.query(
            'INSERT INTO enderecos (usuario_id, apelido, cep, rua, numero, bairro, cidade, uf) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [usuarioId, apelido, cep, rua, numero, bairro, cidade, uf]
        );
        res.status(201).json({ message: 'Endereço salvo com sucesso.' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Erro ao salvar endereço.' });
    }
};

// REMOVER ENDEREÇO
exports.remover = async (req, res) => {
    try {
        await db.query('DELETE FROM enderecos WHERE id = ?', [req.params.id]);
        res.json({ message: 'Endereço removido.' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Erro ao remover endereço.' });
    }
};