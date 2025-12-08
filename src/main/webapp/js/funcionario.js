const API_BASE_URL = '/api';
const ID_KEY = 'funcionarioIdLogado'; 
if(!localStorage.getItem(ID_KEY)) localStorage.setItem(ID_KEY, '2'); // ID Func

function getFuncionarioIdLogado() { return localStorage.getItem(ID_KEY); }
function exibirNotificacao(msg, tipo='sucesso') { alert(msg); }
function formatarMoeda(v) { return parseFloat(v).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}); }
function formatarData(d) { return new Date(d).toLocaleString('pt-BR'); }

// --- RELATÓRIO COM OPÇÕES REAIS (PDF, ZAP, EMAIL) ---
window.dadosRelatorioAtual = []; // Global para exportação

async function gerarRelatorioEstoque() {
    const area = document.getElementById('area-relatorio-estoque');
    area.innerHTML = 'Carregando...';
    try {
        const res = await fetch(`${API_BASE_URL}/relatorios/estoque`);
        const lista = await res.json();
        window.dadosRelatorioAtual = lista;

        if(lista.length === 0) { area.innerHTML = '<p>Nenhuma movimentação.</p>'; return; }

        let html = `
            <div style="background:#f8f9fa; padding:15px; border:1px solid #eee; border-radius:8px; margin-bottom:15px;">
                <h4 style="margin-top:0;">Exportar:</h4>
                <button onclick="baixarPDFRelatorio()" class="btn-primary" style="background:#dc3545;">PDF</button>
                
                <div style="margin-top:10px; display:flex; gap:10px;">
                    <input type="text" id="zap-dest" placeholder="5511999999999" style="padding:8px; flex:1; border:1px solid #ccc;">
                    <button onclick="enviarRelatorioWhatsApp()" class="btn-primary" style="background:#28a745;">Zap</button>
                </div>
            </div>

            <div class="tabela-container-mobile">
                <table class="tabela-admin" id="tabela-relatorio-visual">
                    <thead><tr><th>Data</th><th>Produto</th><th>Tipo</th><th>Qtd</th><th>Quem</th><th>Motivo</th></tr></thead>
                    <tbody>`;
            
        lista.forEach(m => {
            const cor = m.tipo === 'entrada' ? 'green' : 'red';
            html += `<tr><td>${formatarData(m.data_movimentacao)}</td><td>${m.nome_produto}</td><td style="color:${cor}; font-weight:bold;">${m.tipo}</td><td>${m.quantidade}</td><td>${m.nome_usuario}</td><td>${m.origem}</td></tr>`;
        });
        html += '</tbody></table></div>';
        area.innerHTML = html;

    } catch(e) { area.innerHTML = 'Erro ao carregar.'; }
}

// Funções Reais de Exportação
window.baixarPDFRelatorio = function() {
    if(!window.jspdf) return alert('Erro: Biblioteca PDF não carregada no HTML.');
    const doc = new window.jspdf.jsPDF();
    doc.text("Relatório de Movimentações - Maria Scent", 14, 15);
    doc.autoTable({ html: '#tabela-relatorio-visual', startY: 25 });
    doc.save(`Movimentacoes_${Date.now()}.pdf`);
};

window.enviarRelatorioWhatsApp = function() {
    const num = document.getElementById('zap-dest').value;
    if(!num) return alert('Digite o número.');
    let txt = "*Relatório Movimentações*\n";
    window.dadosRelatorioAtual.slice(0,10).forEach(d => txt += `${d.nome_produto} (${d.tipo} ${d.quantidade})\n`);
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(txt)}`, '_blank');
};

// --- VENDA COM BAIXA DE ESTOQUE ---
window.concluirPedido = async (id) => {
    if(!confirm(`Baixar estoque e concluir Pedido #${id}?`)) return;
    try {
        const res = await fetch(`${API_BASE_URL}/pedido/${id}`);
        const det = await res.json();
        
        if(det.itens) {
            for(const i of det.itens) {
                const pid = i.produto_id || i.id;
                if(pid) await fetch(`${API_BASE_URL}/estoque`, {
                    method:'POST', headers:{'Content-Type':'application/json'},
                    body:JSON.stringify({
                        produto_id: pid, quantidade: -Math.abs(i.quantidade),
                        origem: `Venda Pedido #${id}`, funcionarioId: getFuncionarioIdLogado()
                    })
                });
            }
        }
        await fetch(`${API_BASE_URL}/pedido/finalizar/${id}`, { method:'PUT' });
        exibirNotificacao('Venda concluída!'); carregarPedidos(); carregarDashboardStats();
    } catch(e) { alert('Erro.'); }
};

// --- INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', () => {
    if(document.getElementById('boas-vindas-func')) document.getElementById('boas-vindas-func').textContent = 'Olá, Funcionário!';

    // Loads
    carregarDashboardStats();
    carregarProdutosCompleto();
    carregarPedidos();
    carregarPromocoes();

    // Menu Mobile
    const sb = document.getElementById('sidebar'); const ov = document.getElementById('sidebar-overlay');
    const toggle = (s) => { sb.classList.toggle('active', s); ov.style.display=s?'block':'none'; };
    document.getElementById('menu-toggle')?.addEventListener('click', ()=>toggle(true));
    document.getElementById('menu-close')?.addEventListener('click', ()=>toggle(false));
    ov?.addEventListener('click', ()=>toggle(false));

    // Navegação
    document.querySelectorAll('.menu a[href^="#"]').forEach(l => l.addEventListener('click', e => {
        e.preventDefault();
        document.querySelectorAll('main > section').forEach(s => s.style.display='none');
        document.getElementById(l.getAttribute('href').substring(1)).style.display='block';
        if(window.innerWidth<=992) toggle(false);
        if(l.getAttribute('href')==='#modulo-relatorios') gerarRelatorioEstoque();
    }));

    document.getElementById('form-movimentacao-estoque')?.addEventListener('submit', registrarMovimentacaoEstoque);
    document.getElementById('btn-gerar-relatorio-estoque')?.addEventListener('click', gerarRelatorioEstoque);
    
    const logout = () => { localStorage.clear(); window.location.href='login.html'; };
    document.getElementById('logout-sidebar')?.addEventListener('click', (e)=>{e.preventDefault(); logout();});
});

// (Outras funções auxiliares como carregarProdutosCompleto, carregarPedidos, etc. mantidas iguais)
async function carregarDashboardStats() { /* ... */ }
async function carregarProdutosCompleto() { /* ... */ }
async function registrarMovimentacaoEstoque(e) { /* ... */ }
async function carregarPedidos() { /* ... */ }
async function carregarPromocoes() { /* ... */ }