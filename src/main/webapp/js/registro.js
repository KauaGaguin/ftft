// CÓDIGO FINAL CORRIGIDO NO SEU ARQUIVO DE REGISTRO JS

document.getElementById("formCadastro").addEventListener("submit", function (e) {
 e.preventDefault();

 const nome = document.getElementById("nome").value;
 const email = document.getElementById("email").value;
 const senha = document.getElementById("senha").value;

  // 🚨 CORREÇÃO: Usa a constante global API_BASE_URL (/api)
  // Certifique-se de que o interfase.js está carregado antes deste script no HTML
 fetch(`${API_BASE_URL}/registro`, { 
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ nome, email, senha })
 })
  .then(res => {
        // Se a resposta não for 2xx (ex: 400 ou 500), tratamos o erro
        if (!res.ok) {
            // Lança o status HTTP para o catch
            throw new Error(`Erro HTTP: ${res.status}`); 
        }
        return res.json();
    })
  .then(data => {
   if (data.mensagem) {
    alert("Cadastro realizado com sucesso! Você será redirecionado para o login.");
    window.location.href = "login.html";
   } else {
    // Trata erros que o servidor envia com status 200, mas com corpo de erro
    alert("Erro no cadastro: " + (data.erro || "Verifique as informações."));
   }
  })
  .catch(err => {
   console.error("Erro no fetch de registro:", err);
   // Se for um erro 405 ou falha de conexão
   alert(`Erro de comunicação com o servidor. (${err.message}).`);
  });
});