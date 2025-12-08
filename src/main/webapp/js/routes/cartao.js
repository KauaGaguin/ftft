const pool = require('./db');
const db = pool;

// 1. LISTAR CARTÕES (Apenas dados seguros para exibição)
exports.listar = async (req, res) => {
    try {
        // Busca apenas o que é necessário para mostrar na tela (sem dados sensíveis)
        const [rows] = await db.query(
            'SELECT id, nome_titular, ultimos_digitos, validade, bandeira FROM cartoes WHERE usuario_id = ? ORDER BY id DESC', 
            [req.params.usuarioId]
        );
        res.json(rows);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Erro ao buscar cartões.' });
    }
};

// 2. ADICIONAR CARTÃO (Simulação de Tokenização)
exports.adicionar = async (req, res) => {
    const { usuarioId, numero, nome, validade } = req.body;
    
    if (!usuarioId || !numero || !nome || !validade) {
        return res.status(400).json({ message: 'Dados incompletos.' });
    }

    try {
        // --- SIMULAÇÃO DE SEGURANÇA (GATEWAY) ---
        // Na vida real, os dados iriam para Stripe/MercadoPago aqui.
        // O Gateway devolveria um token. Nós simulamos isso:
        
        const tokenFake = `tok_secure_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        
        // Extraímos apenas os últimos 4 dígitos para exibir para o usuário
        const ultimosDigitos = numero.slice(-4);
        
        // Detecção simples da bandeira
        let bandeira = 'Desconhecida';
        const numLimpo = numero.replace(/\D/g, '');
        if (numLimpo.startsWith('4')) bandeira = 'Visa';
        if (numLimpo.startsWith('5')) bandeira = 'Mastercard';

        // SALVA NO BANCO APENAS O QUE É SEGURO
        // Note que a coluna 'numero' NÃO existe na tabela, usamos 'token_pagamento'
        await db.query(
            'INSERT INTO cartoes (usuario_id, nome_titular, ultimos_digitos, validade, token_pagamento, bandeira) VALUES (?, ?, ?, ?, ?, ?)',
            [usuarioId, nome, ultimosDigitos, validade, tokenFake, bandeira]
        );
        
        res.status(201).json({ message: 'Cartão processado e salvo com segurança.' });

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Erro ao processar o cartão.' });
    }
};

// 3. REMOVER CARTÃO
exports.remover = async (req, res) => {
    try {
        await db.query('DELETE FROM cartoes WHERE id = ?', [req.params.id]);
        res.json({ message: 'Cartão removido.' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Erro ao remover cartão.' });
    }
};