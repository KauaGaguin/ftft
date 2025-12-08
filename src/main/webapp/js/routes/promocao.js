const pool = require('./db');

exports.dispararPromocao = async (req, res) => {
    const { mensagem, canais } = req.body;

    if (!mensagem || !canais || canais.length === 0) {
        return res.status(400).json({ message: 'Preencha a mensagem e escolha um canal.' });
    }

    try {
        console.log(`[MARKETING] Simulando envio para ${canais.join(', ')}: "${mensagem}"`);
        
        // SIMULAÇÃO: Delay de 2 segundos para parecer que está processando
        await new Promise(r => setTimeout(r, 2000));

        // Se quiser testar erro, descomente a linha abaixo:
        // throw new Error("Falha na API do WhatsApp");

        res.json({ 
            status: 'sucesso', 
            message: `Sucesso! Campanha enviada para a fila de disparo (${canais.length} canais).` 
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao comunicar com o servidor de disparo.' });
    }
};