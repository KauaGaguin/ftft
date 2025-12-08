const API_BASE_URL = '/api'; 
let produtoEmEdicaoId = null; 
let dadosEstoqueCache = [];
window.dadosRelatorioAtual = []; 

// --- SELETORES ---
const formBanner = document.getElementById('form-banner');
const formProduto = document.getElementById("form-produto");
const formCupom = document.getElementById('form-cupom');
const formEstoque = document.getElementById('form-estoque');
const formRelatorio = document.getElementById('form-relatorio');
const formDisparo = document.getElementById('form-disparo-massivo');

// --- AUXILIARES ---
function exibirNotificacao(msg, tipo='sucesso') { 
    const icon = tipo === 'erro' ? '❌' : '✅';
    setTimeout(() => alert(`${icon} ${msg}`), 10);
}

function exibirConfirmacao(titulo, msg) { 
    return Promise.resolve(confirm(msg)); 
}

function formatarMoeda(v) { 
    return v ? parseFloat(v).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}) : 'R$ 0,00'; 
}

function formatarDataHora(d) { 
    return d ? new Date(d).toLocaleString('pt-BR') : '-'; 
}

function formatarDataInput(d) {
    if(!d) return '';
    return new Date(d).toISOString().slice(0, 16); 
}

// --- RESETS ---
function resetarFormularioProduto() {
    if(!formProduto) return;
    formProduto.reset(); 
    produtoEmEdicaoId = null;
    const btn = formProduto.querySelector('button[type="submit"]');
    if(btn) btn.textContent = 'Salvar Produto';
    const btnCancel = document.getElementById('btn-cancelar-edicao-produto');
    if(btnCancel) btnCancel.style.display = 'none';
}

function resetarFormularioBanner() {
    if(!formBanner) return;
    formBanner.reset(); 
    document.getElementById('banner-id').value = '';
    document.getElementById('btn-salvar-banner').textContent = 'Salvar';
    document.getElementById('btn-cancelar-edicao').style.display = 'none';
}

function resetarFormularioCupom() {
    if(!formCupom) return;
    formCupom.reset(); 
    document.getElementById('cupom-id').value = '';
    document.getElementById('btn-salvar-cupom').textContent = 'Salvar';
    document.getElementById('btn-cancelar-edicao-cupom').style.display = 'none';
}

function resetarFormularioEstoque() { 
    if(formEstoque) formEstoque.reset(); 
}

// ==========================================================
// 1. DASHBOARD
// ==========================================================
window.carregarMetricasDashboard = async function() {
    try {
        const res = await fetch(`${API_BASE_URL}/stats/dashboard`);
        if(res.ok) {
            const d = await res.json();
            const set = (id, val) => { 
                const el = document.getElementById(id);
                if(el) el.textContent = val; 
            };
            set('vendas-hoje', formatarMoeda(d.vendasHoje));
            set('produtos-cadastrados', d.produtosCadastrados);
            set('venda-total', formatarMoeda(d.vendaTotal));
            set('pedidos-pendentes', d.pedidosPendentes);
            set('estoque-baixo-valor', d.estoqueBaixo);
            set('rentabilidade-mensal', formatarMoeda(d.rentabilidadeMensal));
        }
    } catch(e) { console.warn('Dash offline'); }
};

window.carregarDetalhesEstoqueBaixo = async function() {
    const div = document.getElementById('estoque-baixo-detalhes');
    if(!div) return;
    try {
        const res = await fetch(`${API_BASE_URL}/stats/estoque-baixo`);
        const l = await res.json();
        div.innerHTML = l.length 
            ? `<ul style="padding-left:15px; margin:5px 0;">${l.map(p=>`<li style="font-size:11px;"><b>${p.nome}</b>: ${p.estoque} un.</li>`).join('')}</ul>` 
            : '<p style="font-size:11px;color:#999;">Tudo ok!</p>';
    } catch(e) { div.innerHTML = '-'; }
};

window.carregarGraficoFluxoCaixa = async function() {
    const ctx = document.getElementById('grafico-caixa');
    if(!ctx) return;
    try {
        const res = await fetch(`${API_BASE_URL}/stats/fluxo-caixa`);
        if(!res.ok) return;
        const d = await res.json();
        if(window.meuGrafico) window.meuGrafico.destroy();
        window.meuGrafico = new Chart(ctx, {
            type: 'bar',
            data: { labels: d.labels, datasets: [{ label: 'Faturamento', data: d.data, backgroundColor: 'rgba(191,161,74,0.8)' }] },
            options: { responsive: true, maintainAspectRatio: false }
        });
    } catch(e) {}
};

// ==========================================================
// 2. PRODUTOS
// ==========================================================
window.carregarListaProdutos = async function() {
    const ul = document.getElementById('lista-produtos');
    if(!ul) return;
    ul.innerHTML = '<li>Carregando...</li>';
    try {
        const res = await fetch(`${API_BASE_URL}/produtos?view=adm`);
        const l = await res.json();
        if(l.length===0) { ul.innerHTML='<li>Nenhum produto.</li>'; return; }
        
        // Ordena por ID decrescente e pega os 3 primeiros
        const ultimos = l.sort((a, b) => b.id - a.id).slice(0, 3);
        
        ul.innerHTML = ultimos.map(p => `<li><div class="prod-info"><strong>${p.nome}</strong><small>R$ ${parseFloat(p.preco).toFixed(2)} | Est: ${p.estoque}</small></div><div class="btn-acao-group"><button class="btn-editar" onclick="editarProduto(${p.id})">Editar</button><button class="btn-deletar" onclick="deletarProduto(${p.id})">Excluir</button></div></li>`).join('');
        
        if(!document.getElementById('btn-ver-estoque-wrapper')) {
            const div = document.createElement('div'); div.id = 'btn-ver-estoque-wrapper'; div.style.textAlign='center'; div.style.marginTop='15px';
            div.innerHTML = `<button onclick="navegarParaEstoque()" class="ver-estoque-link" style="width:100%; cursor:pointer; border:1px dashed #bfa14a; background:#fffbf0; padding:10px; border-radius:6px;">Ver Estoque Completo</button>`;
            ul.parentNode.appendChild(div);
        }
    } catch(e) { ul.innerHTML='<li>Erro.</li>'; }
};

window.navegarParaEstoque = () => {
    const link = document.querySelector('a[href="#modulo-estoque"]');
    if(link) link.click();
};

window.editarProduto = async (id) => {
    try {
        const res = await fetch(`${API_BASE_URL}/produtos/${id}`);
        const p = await res.json();
        const f = formProduto;
        f.querySelector('[name="nome"]').value=p.nome; f.querySelector('[name="linha"]').value=p.linha; f.querySelector('[name="categoria"]').value=p.categoria; f.querySelector('[name="preco"]').value=p.preco; f.querySelector('[name="custo_unitario"]').value=p.custo_unitario||''; f.querySelector('[name="estoque"]').value=p.estoque; f.querySelector('[name="descricao"]').value=p.descricao||'';
        f.querySelector('[name="destaque"]').checked=p.destaque; f.querySelector('[name="promocao"]').checked=p.promocao; f.querySelector('[name="exibir_index"]').checked=p.exibir_index; f.querySelector('[name="exibir_page1"]').checked=p.exibir_page1; f.querySelector('[name="exibir_page2"]').checked=p.exibir_page2;
        produtoEmEdicaoId=id; f.querySelector('button[type="submit"]').textContent='Atualizar'; document.getElementById('btn-cancelar-edicao-produto').style.display='inline-block';
        document.querySelector('a[href="#modulo-adicionar-produto"]').click(); window.scrollTo({top:0,behavior:'smooth'});
    } catch(e) { alert('Erro ao buscar produto.'); }
};

window.deletarProduto = async (id) => {
    if(!confirm('Excluir?')) return;
    await fetch(`${API_BASE_URL}/produtos/${id}`, {method:'DELETE'});
    carregarListaProdutos(); carregarListaEstoque(); carregarMetricasDashboard();
};

// ==========================================================
// 3. PEDIDOS
// ==========================================================
window.carregarListaPedidos = async function() {
    const tbody = document.getElementById('lista-pedidos-body');
    const divNenhum = document.getElementById('pedidos-nenhum');
    if(!tbody) return;

    try {
        const res = await fetch(`${API_BASE_URL}/pedido/pendentes`);
        if(res.status===404) { throw new Error('Vazio'); }
        const l = await res.json();
        if(!l.length) throw new Error('Vazio');
        
        if(divNenhum) divNenhum.style.display='none';
        tbody.innerHTML = l.map(p => `<tr><td>#${p.id}</td><td>${p.cliente_id||'Cliente'}</td><td>${formatarMoeda(p.valor_total)}</td><td><span class="status-pendente">${p.status}</span></td><td><button onclick="concluirPedido(${p.id})">Concluir</button></td></tr>`).join('');
    } catch(e) { 
        tbody.innerHTML=''; 
        if(divNenhum) divNenhum.style.display='block'; 
    }
};

window.concluirPedido = async (id) => {
    if(!confirm('Confirmar venda e baixar estoque?')) return;
    exibirNotificacao('Processando...', 'aviso');
    try {
        const resDet = await fetch(`${API_BASE_URL}/pedido/${id}`);
        const det = await resDet.json();
        if (det.itens) {
            for (const item of det.itens) {
                const pid = item.produto_id || item.id; 
                if (pid) await fetch(`${API_BASE_URL}/estoque`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ produto_id: pid, quantidade: -Math.abs(item.quantidade), origem:`Venda Pedido #${id} (ADM)`, funcionarioId:1 }) });
            }
        }
        await fetch(`${API_BASE_URL}/pedido/finalizar/${id}`, { method:'PUT' });
        exibirNotificacao('Venda concluída!'); carregarListaPedidos(); carregarMetricasDashboard();
    } catch(e) { exibirNotificacao('Erro venda.', 'erro'); }
};

// ==========================================================
// 4. ESTOQUE
// ==========================================================
window.carregarListaEstoque = async function() {
    const container = document.querySelector('#modulo-estoque .card-grande:last-child');
    if (container && !document.getElementById('estoque-controls')) {
        const div = document.createElement('div'); div.id = 'estoque-controls'; div.style.cssText = 'margin-bottom:20px; display:flex; gap:15px; flex-wrap:wrap;';
        div.innerHTML = `<div style="flex:1; min-width:200px; position:relative;"><i class="fas fa-search" style="position:absolute; left:12px; top:50%; transform:translateY(-50%); color:#999;"></i><input type="text" id="estoque-busca" placeholder="Buscar..." style="width:100%; padding:12px 12px 12px 40px; border:1px solid #ddd; border-radius:8px;"></div><label style="display:flex; align-items:center; gap:8px; cursor:pointer; background:#fff; border:1px solid #ddd; padding:0 20px; border-radius:8px; height:45px;"><input type="checkbox" id="estoque-filtro-baixo"> <span style="font-weight:500; color:#dc3545;">⚠️ Baixo</span></label>`;
        const tbl = container.querySelector('.tabela-container-mobile') || container.querySelector('table');
        container.insertBefore(div, tbl);
        document.getElementById('estoque-busca').addEventListener('input', aplicarFiltrosEstoque);
        document.getElementById('estoque-filtro-baixo').addEventListener('change', aplicarFiltrosEstoque);
    }
    const sel = document.getElementById('estoque-produto-id');
    try {
        const res = await fetch(`${API_BASE_URL}/estoque`);
        const l = await res.json();
        dadosEstoqueCache = l; 
        renderizarTabelaEstoque(l);
        if(sel) sel.innerHTML = '<option value="">Selecione</option>' + l.map(i => `<option value="${i.produto_id}">${i.nome_produto} (${i.quantidade})</option>`).join('');
    } catch(e) {}
};

function aplicarFiltrosEstoque() {
    const t = document.getElementById('estoque-busca').value.toLowerCase();
    const b = document.getElementById('estoque-filtro-baixo').checked;
    const f = dadosEstoqueCache.filter(i => (i.nome_produto?.toLowerCase().includes(t) || String(i.produto_id).includes(t)) && (!b || i.quantidade <= 5));
    renderizarTabelaEstoque(f);
}

function renderizarTabelaEstoque(lista) {
    const tbody = document.getElementById('lista-estoque');
    if(!tbody) return;
    if(lista.length===0) { tbody.innerHTML = '<tr><td colspan="4">Vazio.</td></tr>'; return; }
    tbody.innerHTML = lista.map(i => `<tr><td>${i.produto_id}</td><td>${i.nome_produto}</td><td><b style="${i.quantidade<=5?'color:red':''}">${i.quantidade}</b></td><td><div style="display:flex;gap:5px;"><button class="btn-editar" onclick="editarProduto(${i.produto_id})">🖊️</button><button class="btn-deletar" onclick="deletarProduto(${i.produto_id})">🗑️</button><button onclick="verHistorico(${i.produto_id})">📜</button></div></td></tr>`).join('');
}

window.verHistorico = async (id) => {
    const modal = document.getElementById('modal-historico');
    document.getElementById('modal-historico-corpo').innerHTML = 'Carregando...';
    modal.style.display = 'flex';
    try {
        const res = await fetch(`${API_BASE_URL}/estoque/historico/${id}`);
        const h = await res.json();
        document.getElementById('modal-historico-corpo').innerHTML = h.length ? `<table class="tabela-admin"><thead><tr><th>Data</th><th>Tipo</th><th>Qtd</th><th>Origem</th></tr></thead><tbody>${h.map(m=>`<tr><td>${formatarDataHora(m.data_movimentacao)}</td><td>${m.tipo}</td><td>${m.quantidade}</td><td>${m.origem}</td></tr>`).join('')}</tbody></table>` : '<p>Sem dados.</p>';
    } catch(e) { document.getElementById('modal-historico-corpo').innerHTML='Erro.'; }
};

// ==========================================================
// 5. MARKETING
// ==========================================================
window.carregarListaBanners = async function() {
    const ul = document.getElementById('lista-banners');
    if(!ul) return;
    try {
        const res = await fetch(`${API_BASE_URL}/banner/todos`);
        const l = await res.json();
        ul.innerHTML = l.map(b => `<li><div><strong>${b.mensagem}</strong> <small>(${b.ativo?'Ativo':'Inativo'})</small></div><div><button class="btn-editar" onclick="preencherBanner(${b.id}, '${b.mensagem}', ${b.ativo}, ${b.prioridade}, '${b.data_inicio}', '${b.data_fim}')">🖊️</button><button class="btn-deletar" onclick="removerItem('banner', ${b.id})">🗑️</button></div></li>`).join('');
    } catch(e) {}
};

window.preencherBanner = (id, msg, ativo, pri, ini, fim) => {
    document.getElementById('banner-id').value = id; document.getElementById('mensagem').value = msg; document.getElementById('ativo').checked = ativo===1; document.getElementById('prioridade').value = pri; document.getElementById('data_inicio').value = formatarDataInput(ini); document.getElementById('data_fim').value = formatarDataInput(fim);
    document.getElementById('btn-salvar-banner').textContent = 'Atualizar'; document.getElementById('btn-cancelar-edicao').style.display = 'inline-block'; document.querySelector('a[href="#modulo-banner"]').click();
};

window.carregarListaCupons = async function() {
    const ul = document.getElementById('lista-cupons');
    if(!ul) return;
    try {
        const res = await fetch(`${API_BASE_URL}/cupom/todos`);
        const l = await res.json();
        ul.innerHTML = l.map(c => `<li><div><strong>${c.codigo}</strong> - ${c.tipo_desconto==='percentual'?c.valor_desconto+'%':'R$ '+c.valor_desconto}</div><button class="btn-deletar" onclick="removerItem('cupom', ${c.id})">🗑️</button></li>`).join('');
    } catch(e) {}
};

window.removerItem = async (tipo, id) => {
    if(!confirm('Remover?')) return;
    await fetch(`${API_BASE_URL}/${tipo}/${id}`, { method: 'DELETE' });
    if(tipo==='banner') window.carregarListaBanners(); if(tipo==='cupom') window.carregarListaCupons();
};

// ==========================================================
// 6. RELATÓRIOS (CORRIGIDO: AGORA BUSCA ESTOQUE)
// ==========================================================
window.abrirModalRelatorio = function(dados) {
    const modal = document.getElementById('modal-historico');
    const corpo = document.getElementById('modal-historico-corpo');
    const titulo = document.getElementById('modal-historico-titulo');
    
    titulo.innerText = "Relatório Gerado";
    modal.style.display = 'flex';
    
    window.dadosRelatorioAtual = dados; // Salva globalmente

    if(dados.length === 0) { corpo.innerHTML = '<p>Nenhum registro.</p>'; return; }

    let html = `
        <div style="background:#f8f9fa; padding:15px; border-radius:8px; margin-bottom:20px; border:1px solid #eee;">
            <h4 style="margin:0 0 10px 0;">Exportar:</h4>
            <button onclick="baixarPDFRelatorio()" class="btn-primary" style="width:100%; margin-bottom:10px; background:#dc3545;">📄 Baixar PDF</button>
            <div style="display:flex; gap:10px;">
                <div style="flex:1;"><input type="text" id="zap-dest" placeholder="55119..." style="width:100%; margin-bottom:5px; padding:8px;"><button onclick="enviarRelatorioWhatsApp()" class="btn-primary" style="width:100%; background:#28a745;">Zap</button></div>
                <div style="flex:1;"><input type="email" id="email-dest" placeholder="@email" style="width:100%; margin-bottom:5px; padding:8px;"><button onclick="enviarRelatorioEmail()" class="btn-primary" style="width:100%; background:#007bff;">Email</button></div>
            </div>
        </div>
        <div style="max-height:400px; overflow:auto;">
            <table class="tabela-admin" id="tabela-relatorio-visual">
                <!-- Cabeçalho adaptável: Se tem 'origem', é estoque. Senão, é venda -->
                <thead><tr><th>Data</th><th>Ref/Usuário</th><th>Detalhe</th><th>Qtd/Valor</th></tr></thead>
                <tbody>
                    ${dados.map(v => {
                        const dt = formatarDataHora(v.data_movimentacao || v.data_pedido);
                        // Se for estoque: Mostra Quem Fez. Se for venda: Mostra Cliente.
                        const nm = v.nome_usuario || v.nome_cliente || 'Sistema';
                        // Se for estoque: Mostra Motivo. Se for venda: Status.
                        const det = v.origem || v.status;
                        const vl = v.valor_total ? formatarMoeda(v.valor_total) : (v.quantidade + ' un');
                        
                        return `<tr><td>${dt}</td><td>${nm}</td><td>${det}</td><td>${vl}</td></tr>`;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
    corpo.innerHTML = html;
};

window.baixarPDFRelatorio = function() {
    if(!window.jspdf) return alert('PDF Lib Missing');
    const doc = new window.jspdf.jsPDF();
    doc.text("Relatório Maria Scent", 14, 15);
    doc.autoTable({ html: '#tabela-relatorio-visual', startY: 20 });
    doc.save(`Relatorio_${Date.now()}.pdf`);
};
window.enviarRelatorioWhatsApp = function() {
    const num = document.getElementById('zap-dest').value;
    if(!num) return alert('Digite o número');
    let txt = "*Relatório*\n";
    window.dadosRelatorioAtual.slice(0,10).forEach(d => txt += `${d.origem || d.status}: ${d.quantidade || d.valor_total}\n`);
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(txt)}`, '_blank');
};
window.enviarRelatorioEmail = function() {
    const em = document.getElementById('email-dest').value;
    if(!em) return alert('Digite o e-mail');
    window.location.href = `mailto:${em}?subject=Relatorio&body=Segue%20dados.`;
};

// ==========================================================
// 7. INICIALIZAÇÃO
// ==========================================================
window.addEventListener("DOMContentLoaded", () => {
    const logado = localStorage.getItem('usuarioLogado');
    if(document.getElementById('boas-vindas-admin')) document.getElementById('boas-vindas-admin').textContent = 'Olá, Admin!';

    carregarMetricasDashboard(); carregarGraficoFluxoCaixa(); carregarDetalhesEstoqueBaixo(); carregarListaProdutos(); carregarListaPedidos(); carregarListaEstoque(); 

    const sidebar = document.getElementById('sidebar'); const overlay = document.getElementById('sidebar-overlay');
    const toggleMenu = (s) => { sidebar.classList.toggle('active', s); if(overlay) overlay.style.display=s?'block':'none'; };
    document.getElementById('menu-toggle')?.addEventListener('click', ()=>toggleMenu(true));
    document.getElementById('menu-close')?.addEventListener('click', ()=>toggleMenu(false));
    overlay?.addEventListener('click', ()=>toggleMenu(false));

    document.querySelectorAll(".menu a[href^='#']").forEach(l => l.addEventListener("click", e => {
        e.preventDefault();
        const id = l.getAttribute('href').substring(1);
        document.querySelectorAll("main > section").forEach(s => s.style.display='none');
        document.getElementById(id).style.display='block';
        document.querySelectorAll('.menu a').forEach(i=>i.classList.remove('ativo')); l.classList.add('ativo');
        if(window.innerWidth<=992) toggleMenu(false);
        
        if(id==='modulo-promocoes' || id==='modulo-banner' || id==='modulo-cupons') { 
            if(window.carregarListaBanners) window.carregarListaBanners(); 
            if(window.carregarListaCupons) window.carregarListaCupons(); 
        }
        if(id==='modulo-estoque') if(window.carregarListaEstoque) window.carregarListaEstoque();
        if(id==='modulo-pedidos') if(window.carregarListaPedidos) window.carregarListaPedidos();
    }));

    const logout = () => { localStorage.clear(); window.location.href='login.html'; };
    document.querySelector('.logout-btn')?.addEventListener('click', logout);
    document.getElementById('logout-sidebar')?.addEventListener('click', (e)=>{e.preventDefault(); logout();});
    document.getElementById('modal-historico-fechar')?.addEventListener('click', ()=>document.getElementById('modal-historico').style.display='none');

    // Forms
    if(formProduto) formProduto.addEventListener('submit', async (e) => {
        e.preventDefault();
        const d = Object.fromEntries(new FormData(formProduto).entries());
        ['destaque','promocao','exibir_index','exibir_page1','exibir_page2'].forEach(k => d[k] = formProduto.querySelector(`[name=${k}]`).checked?1:0);
        if(produtoEmEdicaoId) d.estoque_atualizado = d.estoque; else d.estoque_inicial = d.estoque;
        await fetch(produtoEmEdicaoId ? `${API_BASE_URL}/produtos/${produtoEmEdicaoId}` : `${API_BASE_URL}/produtos`, {method:produtoEmEdicaoId?'PUT':'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(d)});
        exibirNotificacao('Salvo!'); resetarFormularioProduto(); carregarListaProdutos();
    });

    if(formEstoque) formEstoque.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData(formEstoque);
        let qtd = parseInt(fd.get('quantidade'));
        if(fd.get('tipo_movimentacao')==='saida') qtd = -qtd;
        await fetch(`${API_BASE_URL}/estoque`, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({produto_id:fd.get('produto_id'), quantidade:qtd, origem:fd.get('observacao')||'ADM', funcionarioId:1})});
        exibirNotificacao('Atualizado!'); resetarFormularioEstoque(); carregarListaEstoque();
    });
    
    // CORREÇÃO DO RELATÓRIO: Agora busca /api/relatorios/estoque
    if(formRelatorio) formRelatorio.addEventListener('submit', async (e) => {
        e.preventDefault();
        // Aqui ignoramos a data por enquanto pois o backend atual (relatorio.js) retorna as últimas 100 fixas
        // Se quiser filtrar por data, teria que alterar o backend.
        // O importante é que agora ele busca as MOVIMENTAÇÕES, não Vendas vazias.
        try {
            const res = await fetch(`${API_BASE_URL}/relatorios/estoque`);
            const json = await res.json();
            abrirModalRelatorio(json); 
        } catch(err) { alert('Erro ao buscar dados.'); }
    });
    
    if(formDisparo) formDisparo.addEventListener('submit', async (e) => {
        e.preventDefault();
        if(!confirm('Enviar?')) return;
        const msg = document.getElementById('msg-promocao').value;
        const canais = Array.from(document.querySelectorAll('input[name="canal"]:checked')).map(el => el.value);
        await fetch(`${API_BASE_URL}/promocao/disparar`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({mensagem:msg, canais}) });
        alert('Enviado!'); document.getElementById('msg-promocao').value = '';
    });

    const handleForm = (form, url, resetFn, loadFn) => {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = form.querySelector('input[type="hidden"]').value;
            const d = Object.fromEntries(new FormData(form).entries());
            if(d.ativo === undefined) d.ativo = form.querySelector('[name="ativo"]')?.checked ? 1 : 0;
            if(d.ativo_cupom) d.ativo = d.ativo_cupom;
            await fetch(id ? `${url}/${id}` : url, { method: id ? 'PUT' : 'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(d) });
            exibirNotificacao('Salvo!'); resetFn(); loadFn();
        });
    };
    if(formBanner) handleForm(formBanner, `${API_BASE_URL}/banner`, resetarFormularioBanner, carregarListaBanners);
    if(formCupom) handleForm(formCupom, `${API_BASE_URL}/cupom`, resetarFormularioCupom, carregarListaCupons);

    document.getElementById('btn-cancelar-edicao-produto')?.addEventListener('click', resetarFormularioProduto);
    document.getElementById('btn-cancelar-edicao')?.addEventListener('click', resetarFormularioBanner);
    document.getElementById('btn-cancelar-edicao-cupom')?.addEventListener('click', resetarFormularioCupom);
});