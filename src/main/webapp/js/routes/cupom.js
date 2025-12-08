
const express = require('express');
const router = express.Router(); 
const pool = require('./db'); // O pool de conexões do seu servidor

// 1. Rota GET para listar todos os cupons (Usada pelo adm.js: /api/cupom/todos)
const listarCuponsAdmin = async (req, res, next) => {
    try {
        const [cupons] = await pool.query(`
            SELECT 
                id, 
                codigo, 
                tipo_desconto, 
                valor_desconto, 
                DATE_FORMAT(data_validade, '%Y-%m-%dT%H:%i') as data_validade,
                ativo
            FROM 
                cupons
            ORDER BY 
                ativo DESC, codigo ASC
        `); 
        res.status(200).json(cupons);
    } catch (err) {
        console.error('Erro ao listar cupons:', err);
        next(err);
    }
};
router.get('/todos', listarCuponsAdmin); 

// 2. Rotas POST/PUT para criar ou atualizar cupom (/api/cupom)
const salvarCupomAdmin = async (req, res, next) => {
    try {
        const { id, codigo, tipo_desconto, valor_desconto, data_validade, ativo } = req.body;
        
        if (id) {
            await pool.query(
                `UPDATE cupons SET codigo=?, tipo_desconto=?, valor_desconto=?, data_validade=?, ativo=? WHERE id=?`,
                [codigo, tipo_desconto, valor_desconto, data_validade || null, ativo, id]
            );
            return res.status(200).json({ message: `Cupom ${codigo} atualizado!` });
        } 
        
        await pool.query(
            `INSERT INTO cupons (codigo, tipo_desconto, valor_desconto, data_validade, ativo) VALUES (?, ?, ?, ?, ?)`,
            [codigo, tipo_desconto, valor_desconto, data_validade || null, ativo]
        );
        res.status(201).json({ message: `Cupom ${codigo} criado com sucesso!` });

    } catch (err) {
        console.error('Erro ao salvar cupom:', err);
        next(err);
    }
};
router.post('/', salvarCupomAdmin); 
router.put('/:id', salvarCupomAdmin); 

// 3. Rota DELETE para remover cupom (/api/cupom/:id)
const removerCupomAdmin = async (req, res, next) => {
    try {
        const { id } = req.params; 
        await pool.query('DELETE FROM cupons WHERE id = ?', [id]);
        res.status(200).json({ message: 'Cupom removido com sucesso.' });
    } catch (err) {
        console.error('Erro ao remover cupom:', err);
        next(err);
    }
};
router.delete('/:id', removerCupomAdmin); 

module.exports = router;