// =========================================================
// login.js - VERSÃO FINAL (PRONTO PARA RAILWAY)
// =========================================================

document.addEventListener("DOMContentLoaded", () => {
    
    const formLogin = document.getElementById("form-login");
    const campoSenha = document.getElementById("senha");
    const toggleSenha = document.getElementById("toggle-senha");

    // 1. Botão de Olho (Mostrar Senha)
    if (toggleSenha && campoSenha) {
        toggleSenha.addEventListener("click", function () {
            const type = campoSenha.getAttribute("type") === "password" ? "text" : "password";
            campoSenha.setAttribute("type", type);
            this.querySelector('i').classList.toggle("fa-eye");
            this.querySelector('i').classList.toggle("fa-eye-slash");
        });
    }

    // 2. Processo de Login
    if (formLogin) {
        formLogin.addEventListener("submit", async (e) => {
            e.preventDefault();

            const email = document.getElementById("email").value;
            const senha = campoSenha.value;

            if (!email || !senha) {
                alert("Por favor, preencha todos os campos.");
                return;
            }

            try {
                // 🚨 CORREÇÃO CRÍTICA AQUI:
                // Removemos "" e deixamos apenas "/api/login"
                // Isso faz funcionar tanto no seu PC quanto no Railway automaticamente.
                const resposta = await fetch("/api/login", { 
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, senha }),
                });

                if (!resposta.ok) {
                    const erro = await resposta.json().catch(() => ({ message: 'Erro de Servidor.' }));
                    alert(`Falha no login: ${erro.message}`); 
                    return; 
                }
                
                const resultado = await resposta.json();

                // 💾 LOCALSTORAGE: Isso salva no NAVEGADOR DA PESSOA (Cliente)
                // É assim que o site lembra que ela está logada mesmo se fechar a aba.
                localStorage.setItem("usuario", JSON.stringify(resultado.user)); // Usado pelo carrinho
                localStorage.setItem("usuarioLogado", "true");
                
                // Dados extras para compatibilidade
                localStorage.setItem("nivelUsuario", resultado.user.tipo); 
                localStorage.setItem("nomeUsuario", resultado.user.nome);

                alert("Login realizado com sucesso!");

                // Se houver função de carregar carrinho, chama ela agora para atualizar com itens do banco
                if(window.carregarCarrinho) window.carregarCarrinho();

                // Redirecionamento
                if (resultado.user.tipo === "admin") {
                    window.location.href = "page-adm.html";
                } else if (resultado.user.tipo === "funcionario") {
                    window.location.href = "page-funcionario.html";
                } else {
                    window.location.href = "minha-conta.html"; 
                }

            } catch (error) {
                console.error("Erro de login:", error);
                alert("Erro de conexão com o servidor.");
            }
        });
    }
});