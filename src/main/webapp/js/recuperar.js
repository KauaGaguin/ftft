// recuperar.js

document.addEventListener("DOMContentLoaded", () => {
    // 1. Checa o hash na URL
    const token = window.location.hash.substring(1); 
    const isRedefinindo = token.length > 0;

    const emailForm = document.getElementById('form-email');
    const resetForm = document.getElementById('form-redefinir');
    const titulo = document.querySelector('.titulo');
    const slogan = document.querySelector('.slogan');

    // 2. Altera o layout conforme a presença do hash
    if (isRedefinindo) {
        // Modo Redefinir Senha
        emailForm.style.display = 'none';
        resetForm.style.display = 'block';
        titulo.innerHTML = 'Nova <span>Senha</span>';
        slogan.textContent = 'Digite sua nova senha.';
    } else {
        // Modo Solicitar Recuperação
        emailForm.style.display = 'block';
        resetForm.style.display = 'none';
        titulo.innerHTML = 'Recupere <span>sua senha</span>';
        slogan.textContent = 'Enviaremos um link de redefinição para o seu e-mail.';
    }

    // 3. Lógica para Solicitar Recuperação de E-mail
    emailForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email-recuperacao').value.trim();
        
        try {
            const res = await fetch('/api/solicitar-recuperacao', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await res.json();

            if (data.status === 'ok') {
                alert('✅ ' + data.mensagem);
                // Opcional: Redirecionar para login após a solicitação
                window.location.href = 'login.html'; 
            } else {
                 alert('⚠️ Erro: ' + data.mensagem);
            }
        } catch (error) {
            alert('Erro ao conectar com o servidor.');
        }
    });

    // 4. Lógica para Redefinir Senha com o Token
    resetForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const novaSenha = document.getElementById('nova-senha').value;
        const confirmaSenha = document.getElementById('confirma-senha').value;

        if (novaSenha.length < 6) {
            alert('A senha deve ter no mínimo 6 caracteres.');
            return;
        }

        if (novaSenha !== confirmaSenha) {
            alert('As senhas não coincidem.');
            return;
        }

        try {
            const res = await fetch('/api/redefinir-senha', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, novaSenha })
            });
            const data = await res.json();

            if (data.status === 'ok') {
                alert('✅ ' + data.mensagem);
                window.location.href = 'login.html'; // Sucesso: volta para o login
            } else {
                alert('⚠️ Erro: ' + data.mensagem);
                window.location.href = 'recuperar.html'; // Erro: volta para o modo de solicitação
            }
        } catch (error) {
            alert('Erro ao conectar com o servidor.');
        }
    });
});