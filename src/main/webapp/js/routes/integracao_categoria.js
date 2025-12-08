// js/integracao_categoria.js

/**
 * Monta o HTML de um único card de produto. (Reaproveitado do integracao_produtos.js)
 */
// integracao_categoria.js (Corrigido)

/**
 * Monta o HTML de um único card de produto. 
 */
function criarCardProduto(produto) {
  const precoFormatado = parseFloat(produto.preco).toFixed(2).replace('.', ','); 
  
  // 🚨 ESTE CÓDIGO PRECISA SER O QUE ESTÁ NO SEU ARQUIVO
  const BASE_URL_SERVER = API_BASE_URL.replace('/api', ''); 
  const imagemPath = produto.caminho_imagem || '/assets/imagens/sem_imagem.jpg'; 
  const imagemSrc = `${BASE_URL_SERVER}${imagemPath}`;
  // FIM DO CÓDIGO CORRETO

  return `
    <div class="card-produto">
      <div class="img-wrapper">
        <img src="${imagemSrc}" alt="${produto.nome}">
        <button class="icon-carrinho" onclick="adicionarAoCarrinho(${produto.id}, 1)">
          <i class="fas fa-shopping-cart"></i>
        </button>
      </div>
      <h3>${produto.nome}</h3>
      <p>R$ ${precoFormatado}</p>
    </div>
  `;
}
/**
 * Carrega e filtra produtos para uma categoria específica.
 * @param {string} categoriaDesejada - Ex: 'Masculino' ou 'Feminino'.
 * @param {string} containerId - O ID do elemento HTML onde renderizar.
 */
async function carregarProdutosPorCategoria(categoriaDesejada, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '<p style="text-align: center;">Carregando...</p>';

    try {
        const response = await fetch(`${API_BASE_URL}/produtos`);
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }
        
        const todosProdutos = await response.json();
        
        // Filtra pelo nome da categoria (ignorando maiúsculas/minúsculas)
        const produtosFiltrados = todosProdutos.filter(p => 
            p.categoria.toLowerCase() === categoriaDesejada.toLowerCase()
        );
        
        if (produtosFiltrados.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #666;">Nenhum produto encontrado nesta categoria.</p>';
            return;
        }

        // Renderiza
        container.innerHTML = produtosFiltrados.map(criarCardProduto).join('');

    } catch (error) {
        console.error(`Falha ao carregar produtos para ${categoriaDesejada}:`, error);
        container.innerHTML = '<p class="erro" style="text-align: center; color: red;">Erro ao carregar produtos.</p>';
    }
}
// Adicione esta função ao final do integracao_categoria.js
async function carregarCategorias() {
    try {
        // Usa API_BASE_URL definido em interfase.js
        const response = await fetch(`${API_BASE_URL}/categorias`); 
        const categorias = await response.json();

        // 1. Popula o menu lateral (painel mobile)
        const panelBody = document.getElementById('categorias-panel-body');
        if (panelBody) {
            panelBody.innerHTML = categorias.map(c => `
                <a href="categoria.html?nome=${c.nome}" class="categoria-item">
                    ${c.nome}
                </a>
            `).join('');
        }
        
        // 2. Popula o menu horizontal (desktop)
        const desktopMenu = document.querySelector('.menu-links'); 
        if (desktopMenu) {
            desktopMenu.innerHTML = categorias.map(c => `
                <a href="categoria.html?nome=${c.nome}">${c.nome}</a>
            `).join('');
        }

    } catch (error) {
        console.error("Erro ao carregar categorias:", error);
    }
}

// Inicializa o carregamento das categorias assim que o script é carregado
carregarCategorias();
// Chame a função certa dependendo da página
// No page-1.html, rode: carregarProdutosPorCategoria('Masculino', 'produtos-masculinos');
// No page-2.html, rode: carregarProdutosPorCategoria('Feminino', 'produtos-femininos');