
// Importa o módulo bcrypt (certifique-se de que está instalado com npm install bcrypt)
const bcrypt = require('bcrypt');
// Importa a conexão com o banco de dados (ajuste o caminho se necessário)
const pool = require('./src/main/webapp/js/routes/db'); 

// ---------------------------------------------------------------------
// CONFIGURAÇÕES
// ---------------------------------------------------------------------

// E-mail do funcionário que você deseja atualizar
const emailFuncionario = 'admin@mariascent.com';

// A senha em texto puro que você quer usar para o login
const senhaEmTextoPuro = 'teste123'; 

// ---------------------------------------------------------------------
// FUNÇÃO PRINCIPAL DE ATUALIZAÇÃO
// ---------------------------------------------------------------------
async function atualizarSenha() {
    // Verificar se o pool.end() existe antes de chamar para evitar erros se o db não for importado corretamente
    const poolEnd = pool.end ? pool.end.bind(pool) : () => console.warn('Pool.end() não encontrado. A conexão pode não ter sido fechada.');

    try {
        // 1. Gerar o hash da senha
        console.log(`Gerando novo hash para o e-mail: ${emailFuncionario}...`);
        
        // Custo do hash (10 é um bom padrão)
        const salt = await bcrypt.genSalt(10); 
        const novoHash = await bcrypt.hash(senhaEmTextoPuro, salt);

        console.log(`Novo Hash Gerado: ${novoHash}`);

        // 2. Atualizar o banco de dados
        const sql = 'UPDATE usuarios SET senha = ? WHERE email = ?';
        
        // O método execute() é comum para pacotes como 'mysql2/promise'
        const [result] = await pool.execute(sql, [novoHash, emailFuncionario]);

        if (result.affectedRows > 0) {
            console.log('\n======================================================');
            console.log(`✅ SUCESSO! Senha de ${emailFuncionario} atualizada!`);
            console.log(`   Nova Senha (Texto Puro): ${senhaEmTextoPuro}`);
            console.log("   Agora você pode logar com esta senha no sistema.");
            console.log('======================================================');
        } else {
            console.log('\n======================================================');
            console.log(`⚠️ ATENÇÃO: Usuário ${emailFuncionario} não encontrado.`);
            console.log("   Verifique se o e-mail está correto na sua tabela 'usuarios'.");
            console.log('======================================================');
        }

    } catch (error) {
        console.error('\n======================================================');
        console.error('❌ ERRO CRÍTICO DURANTE A ATUALIZAÇÃO DE SENHA:');
        console.error(error.message);
        console.error('======================================================');
    } finally {
        // 3. Fechar a conexão com o banco de dados
        console.log('\nFechando conexão com o banco...');
        poolEnd();
    }
}

atualizarSenha();