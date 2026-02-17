// ===== ADMIN DASHBOARD SCRIPT =====

// Verificar autenticação
if (!localStorage.getItem(CONFIG.storage.adminToken)) {
    window.location.href = 'admin-login.html';
}

// Inicializar Firebase
let db;
try {
    firebase.initializeApp(CONFIG.firebase);
    db = firebase.firestore();
    console.log('Firebase inicializado com sucesso');
} catch (error) {
    console.error('Erro ao inicializar Firebase:', error);
}

// Estado global
const dashboardState = {
    guests: [],
    payments: [],
    filter: 'all'
};

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', () => {
    initializeDashboard();
    initializeNavigation();
    initializeLogout();
    initializeMobileMenu();
    loadDashboardData();
});

// ===== NAVEGAÇÃO =====
function initializeNavigation() {
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = item.dataset.section;
            switchSection(section);
            
            // Fechar sidebar no mobile após selecionar
            if (window.innerWidth <= 1024) {
                closeMobileSidebar();
            }
        });
    });
}

// ===== MENU MOBILE =====
function initializeMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const sidebar = document.querySelector('.sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            sidebar.classList.toggle('open');
            sidebarOverlay.classList.toggle('active');
        });
    }
    
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', closeMobileSidebar);
    }
    
    // Fechar sidebar ao redimensionar para desktop
    window.addEventListener('resize', () => {
        if (window.innerWidth > 1024) {
            closeMobileSidebar();
        }
    });
}

function closeMobileSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    
    if (sidebar) sidebar.classList.remove('open');
    if (sidebarOverlay) sidebarOverlay.classList.remove('active');
}

function switchSection(section) {
    // Atualizar menu ativo
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.section === section) {
            item.classList.add('active');
        }
    });
    
    // Mostrar seção correspondente
    document.querySelectorAll('.content-section').forEach(sec => {
        sec.style.display = 'none';
    });
    document.getElementById(`${section}-section`).style.display = 'block';
    
    // Recarregar dados se necessário
    if (section === 'guests') {
        loadAllGuests();
    } else if (section === 'payments') {
        loadPayments();
    } else if (section === 'settings') {
        loadSettings();
    }
}

// ===== LOGOUT =====
function initializeLogout() {
    document.getElementById('logoutButton').addEventListener('click', async () => {
        try {
            // Registrar logout
            await db.collection('admin_logs').add({
                action: 'logout',
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            localStorage.removeItem(CONFIG.storage.adminToken);
            window.location.href = 'admin-login.html';
        } catch (error) {
            console.error('Erro ao fazer logout:', error);
        }
    });
}

// ===== CARREGAR DADOS =====
async function loadDashboardData() {
    try {
        // Carregar convidados em tempo real
        db.collection(CONFIG.collections.rsvp)
            .orderBy('timestamp', 'desc')
            .onSnapshot((snapshot) => {
                dashboardState.guests = [];
                snapshot.forEach((doc) => {
                    dashboardState.guests.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
                
                updateStats();
                updateCharts();
                updateRecentGuests();
            });
        
        // Carregar pagamentos em tempo real
        db.collection(CONFIG.collections.payments)
            .onSnapshot((snapshot) => {
                console.log('📦 Pagamentos carregados:', snapshot.size);
                dashboardState.payments = [];
                snapshot.forEach((doc) => {
                    const paymentData = doc.data();
                    console.log('💰 Pagamento:', paymentData);
                    dashboardState.payments.push({
                        id: doc.id,
                        ...paymentData
                    });
                });
                
                // Ordenar por timestamp (mais recente primeiro)
                dashboardState.payments.sort((a, b) => {
                    const timeA = a.timestamp?.toDate?.() || new Date(a.createdAt || 0);
                    const timeB = b.timestamp?.toDate?.() || new Date(b.createdAt || 0);
                    return timeB - timeA;
                });
                
                console.log('✅ Total de pagamentos:', dashboardState.payments.length);
                updatePaymentStats();
                loadPayments();
                loadPaymentsByCategory();
            });
            
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
    }
}

// ===== ATUALIZAR ESTATÍSTICAS =====
function updateStats() {
    const confirmed = dashboardState.guests.filter(g => g.status === 'confirmed').length;
    const pending = dashboardState.guests.filter(g => g.status === 'pending').length;
    const declined = dashboardState.guests.filter(g => g.status === 'declined').length;
    const total = dashboardState.guests.length;
    
    document.getElementById('confirmedCount').textContent = confirmed;
    document.getElementById('pendingCount').textContent = pending;
    document.getElementById('declinedCount').textContent = declined;
    document.getElementById('totalCount').textContent = total;
}

// ===== GRÁFICOS =====
let statusChart, timelineChart;

function initializeDashboard() {
    // Gráfico de Status
    const statusCtx = document.getElementById('statusChart').getContext('2d');
    statusChart = new Chart(statusCtx, {
        type: 'doughnut',
        data: {
            labels: ['Confirmados', 'Pendentes', 'Recusados'],
            datasets: [{
                data: [0, 0, 0],
                backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
    
    // Gráfico de Timeline
    const timelineCtx = document.getElementById('timelineChart').getContext('2d');
    timelineChart = new Chart(timelineCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Confirmacoes',
                data: [],
                borderColor: '#1e40af',
                backgroundColor: 'rgba(30, 64, 175, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

function updateCharts() {
    // Atualizar gráfico de status
    const confirmed = dashboardState.guests.filter(g => g.status === 'confirmed').length;
    const pending = dashboardState.guests.filter(g => g.status === 'pending').length;
    const declined = dashboardState.guests.filter(g => g.status === 'declined').length;
    
    statusChart.data.datasets[0].data = [confirmed, pending, declined];
    statusChart.update();
    
    // Atualizar gráfico de timeline
    const timelineData = calculateTimelineData();
    timelineChart.data.labels = timelineData.labels;
    timelineChart.data.datasets[0].data = timelineData.data;
    timelineChart.update();
}

function calculateTimelineData() {
    const confirmedGuests = dashboardState.guests
        .filter(g => g.status === 'confirmed')
        .sort((a, b) => a.timestamp?.toDate() - b.timestamp?.toDate());
    
    const grouped = {};
    confirmedGuests.forEach(guest => {
        if (guest.timestamp) {
            const date = guest.timestamp.toDate().toLocaleDateString('pt-BR');
            grouped[date] = (grouped[date] || 0) + 1;
        }
    });
    
    const labels = Object.keys(grouped);
    const data = Object.values(grouped);
    
    // Calcular acumulado
    let accumulated = 0;
    const accumulatedData = data.map(val => {
        accumulated += val;
        return accumulated;
    });
    
    return {
        labels: labels.slice(-7), // Últimos 7 dias
        data: accumulatedData.slice(-7)
    };
}

// ===== TABELA DE CONVIDADOS RECENTES =====
function updateRecentGuests() {
    const tbody = document.getElementById('recentGuestsBody');
    tbody.innerHTML = '';
    
    const recent = dashboardState.guests.slice(0, 10);
    
    recent.forEach(guest => {
        const row = document.createElement('tr');
        const displayName = guest.fullName || guest.name || guest.guestName || 'N/A';
        const formattedDate = guest.timestamp ? guest.timestamp.toDate().toLocaleDateString('pt-BR') : 'N/A';
        const formattedTime = guest.timestamp ? guest.timestamp.toDate().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '';
        const dateTime = formattedTime ? `${formattedDate} às ${formattedTime}` : formattedDate;
        
        row.innerHTML = `
            <td data-label="Nome">${displayName}</td>
            <td data-label="Email">${guest.email || '-'}</td>
            <td data-label="Acompanhantes">${guest.companions || 0}</td>
            <td data-label="Status"><span class="status-badge ${guest.status}">${getStatusText(guest.status)}</span></td>
            <td data-label="Data/Hora">${dateTime}</td>
        `;
        
        // Adicionar tooltip se houver mensagem
        if (guest.message) {
            row.title = `Mensagem: ${guest.message}`;
            row.style.cursor = 'help';
        }
        
        tbody.appendChild(row);
    });
    
    if (recent.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 32px; color: var(--admin-text-light);">Nenhum convidado ainda</td></tr>';
    }
}

// ===== TODOS OS CONVIDADOS =====
function loadAllGuests() {
    const tbody = document.getElementById('allGuestsBody');
    tbody.innerHTML = '';
    
    let filtered = dashboardState.guests;
    if (dashboardState.filter !== 'all') {
        filtered = dashboardState.guests.filter(g => g.status === dashboardState.filter);
    }
    
    filtered.forEach(guest => {
        const row = document.createElement('tr');
        const displayName = guest.fullName || guest.name || guest.guestName || 'N/A';
        const formattedDate = guest.timestamp ? guest.timestamp.toDate().toLocaleDateString('pt-BR') : 'N/A';
        const formattedTime = guest.timestamp ? guest.timestamp.toDate().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '';
        const dateTime = formattedTime ? `${formattedDate} às ${formattedTime}` : formattedDate;
        const hasMessage = guest.message && guest.message.trim() !== '';
        const messageIcon = hasMessage ? ' 💬' : '';
        
        row.innerHTML = `
            <td data-label="Nome Completo">${displayName}${messageIcon}</td>
            <td data-label="Email">${guest.email || '-'}</td>
            <td data-label="Telefone">${guest.phone || '-'}</td>
            <td data-label="Acompanhantes">${guest.companions || 0}</td>
            <td data-label="Status"><span class="status-badge ${guest.status}">${getStatusText(guest.status)}</span></td>
            <td data-label="Data/Hora">${dateTime}</td>
        `;
        
        // Adicionar tooltip e click para ver mensagem
        if (hasMessage) {
            row.style.cursor = 'pointer';
            row.title = 'Clique para ver a mensagem';
            row.addEventListener('click', () => {
                alert(`Mensagem de ${displayName}:\n\n"${guest.message}"`);
            });
        }
        
        tbody.appendChild(row);
    });
    
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 32px; color: var(--admin-text-light);">Nenhum convidado encontrado</td></tr>';
    }
    
    // Filter buttons
    document.querySelectorAll('.filter-button').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            dashboardState.filter = btn.dataset.filter;
            loadAllGuests();
        });
    });
}

// ===== PAGAMENTOS =====
function updatePaymentStats() {
    console.log('📊 Atualizando estatísticas...', dashboardState.payments.length, 'pagamentos');
    
    if (dashboardState.payments.length === 0) {
        document.getElementById('totalPaymentsAmount').textContent = 'R$ 0,00';
        document.getElementById('totalPaymentsCount').textContent = '0';
        document.getElementById('topCategory').textContent = '-';
        document.getElementById('averagePayment').textContent = 'R$ 0,00';
        return;
    }
    
    // Total arrecadado
    const totalAmount = dashboardState.payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    console.log('💰 Total:', totalAmount);
    document.getElementById('totalPaymentsAmount').textContent = `R$ ${totalAmount.toFixed(2).replace('.', ',')}`;
    
    // Total de PIX
    document.getElementById('totalPaymentsCount').textContent = dashboardState.payments.length;
    
    // Categoria maior
    const categoryCounts = {};
    dashboardState.payments.forEach(p => {
        const cat = p.category || p.purpose || 'Outros';
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });
    const topCat = Object.keys(categoryCounts).reduce((a, b) => categoryCounts[a] > categoryCounts[b] ? a : b, '-');
    document.getElementById('topCategory').textContent = formatCategoryName(topCat);
    
    // Média por PIX
    const average = totalAmount / dashboardState.payments.length;
    document.getElementById('averagePayment').textContent = `R$ ${average.toFixed(2).replace('.', ',')}`;
    
    console.log('✅ Stats atualizadas');
}

function loadPayments() {
    const tbody = document.getElementById('paymentsTableBody');
    if (!tbody) return;
    
    console.log('🔄 Carregando tabela de pagamentos...', dashboardState.payments.length, 'registros');
    
    tbody.innerHTML = '';
    
    if (dashboardState.payments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 2rem;">Nenhum pagamento registrado ainda</td></tr>';
        return;
    }
    
    dashboardState.payments.forEach(payment => {
        console.log('💳 Processando pagamento:', payment);
        const row = document.createElement('tr');
        const name = payment.contributorName || payment.name || 'Anônimo';
        const category = formatCategoryName(payment.category || payment.purpose || 'Outros');
        const amount = parseFloat(payment.amount) || 0;
        
        // Lidar com timestamp do Firebase ou string ISO
        let formattedDate = 'N/A';
        let formattedTime = '';
        
        if (payment.timestamp?.toDate) {
            // Firebase Timestamp
            const date = payment.timestamp.toDate();
            formattedDate = date.toLocaleDateString('pt-BR');
            formattedTime = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        } else if (payment.createdAt) {
            // String ISO
            const date = new Date(payment.createdAt);
            formattedDate = date.toLocaleDateString('pt-BR');
            formattedTime = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        }
        
        const dateTime = formattedTime ? `${formattedDate} às ${formattedTime}` : formattedDate;
        
        row.innerHTML = `
            <td data-label="Nome">${name}</td>
            <td data-label="Categoria">${category}</td>
            <td data-label="Valor">R$ ${amount.toFixed(2).replace('.', ',')}</td>
            <td data-label="Data/Hora">${dateTime}</td>
        `;
        tbody.appendChild(row);
    });
    
    console.log('✅ Tabela de pagamentos carregada com sucesso');
}

function loadPaymentsByCategory() {
    const categoryGrid = document.getElementById('categoryGrid');
    if (!categoryGrid) return;
    
    categoryGrid.innerHTML = '';
    
    // Definir metas por categoria (mesmas do site)
    const PURPOSE_GOALS = {
        'lua-de-mel': 10000,
        'casamento': 8000,
        'imoveis': 15000,
        'geladeira': 3000,
        'sofa': 2500,
        'fogao': 2000,
        'televisao': 2500
    };
    
    // Agrupar pagamentos por categoria
    const categoryData = {};
    dashboardState.payments.forEach(payment => {
        const cat = payment.category || payment.purpose || 'outros';
        if (!categoryData[cat]) {
            categoryData[cat] = {
                total: 0,
                count: 0,
                goal: PURPOSE_GOALS[cat] || 5000
            };
        }
        categoryData[cat].total += parseFloat(payment.amount) || 0;
        categoryData[cat].count += 1;
    });
    
    // Adicionar categorias sem contribuição
    Object.keys(PURPOSE_GOALS).forEach(cat => {
        if (!categoryData[cat]) {
            categoryData[cat] = {
                total: 0,
                count: 0,
                goal: PURPOSE_GOALS[cat]
            };
        }
    });
    
    // Criar cards
    Object.entries(categoryData).forEach(([category, data]) => {
        const percentage = Math.min((data.total / data.goal) * 100, 100);
        const remaining = Math.max(data.goal - data.total, 0);
        
        const card = document.createElement('div');
        card.className = 'category-card';
        card.innerHTML = `
            <div class="category-name">
                ${getCategoryIcon(category)}
                ${formatCategoryName(category)}
            </div>
            <div class="category-stats">
                <div class="category-stat">
                    <span class="category-stat-label">Arrecadado:</span>
                    <span class="category-stat-value">R$ ${data.total.toFixed(2).replace('.', ',')}</span>
                </div>
                <div class="category-stat">
                    <span class="category-stat-label">Meta:</span>
                    <span class="category-stat-value">R$ ${data.goal.toFixed(2).replace('.', ',')}</span>
                </div>
                <div class="category-stat">
                    <span class="category-stat-label">Contribuições:</span>
                    <span class="category-stat-value">${data.count}</span>
                </div>
            </div>
            <div class="category-progress">
                <div class="category-progress-label">
                    <span>${percentage.toFixed(1)}% atingido</span>
                    <span>Faltam R$ ${remaining.toFixed(2).replace('.', ',')}</span>
                </div>
                <div class="category-progress-bar">
                    <div class="category-progress-fill" style="width: ${percentage}%"></div>
                </div>
            </div>
        `;
        categoryGrid.appendChild(card);
    });
}

function formatCategoryName(category) {
    const names = {
        'lua-de-mel': 'Lua de Mel',
        'casamento': 'Casamento',
        'imoveis': 'Imóveis',
        'geladeira': 'Geladeira',
        'sofa': 'Sofá',
        'fogao': 'Fogão',
        'televisao': 'Televisão',
        'outros': 'Outros'
    };
    return names[category] || category;
}

function getCategoryIcon(category) {
    const icons = {
        'lua-de-mel': '🌙',
        'casamento': '💍',
        'imoveis': '🏠',
        'geladeira': '🧊',
        'sofa': '🛋️',
        'fogao': '🔥',
        'televisao': '📺',
        'outros': '🎁'
    };
    return icons[category] || '🎁';
}

// ===== CONFIGURAÇÕES =====
function loadSettings() {
    // Botão de resetar timer
    const resetTimerBtn = document.getElementById('resetTimerBtn');
    if (resetTimerBtn) {
        resetTimerBtn.addEventListener('click', handleResetTimer);
    }
}

// ===== RESETAR TIMER =====
async function handleResetTimer() {
    const confirmed = confirm(
        '⚠️ ATENÇÃO!\n\n' +
        'Resetar o timer vai:\n' +
        '• Reiniciar o prazo de 1 semana para TODOS os convidados\n' +
        '• Permitir novas confirmações\n' +
        '• Resetar o cronômetro na página principal\n\n' +
        'Deseja continuar?'
    );
    
    if (!confirmed) return;
    
    try {
        // Salvar o reset no Firebase para logs
        await db.collection(CONFIG.collections.settings).doc('timer').set({
            lastReset: firebase.firestore.FieldValue.serverTimestamp(),
            resetBy: 'admin',
            resetCount: firebase.firestore.FieldValue.increment(1)
        }, { merge: true });
        
        // Criar um documento de notificação para o site principal
        await db.collection(CONFIG.collections.settings).doc('timerControl').set({
            shouldReset: true,
            resetTimestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        alert(
            '✅ Timer resetado com sucesso!\n\n' +
            'Todos os convidados terão um novo prazo de 1 semana.\n' +
            'O cronômetro será reiniciado na próxima visita ao site.'
        );
        
        console.log('Timer resetado pelo admin');
        
    } catch (error) {
        console.error('Erro ao resetar timer:', error);
        alert('❌ Erro ao resetar timer. Tente novamente.');
    }
}

// ===== FUNÇÕES AUXILIARES =====
function getStatusText(status) {
    const statusMap = {
        'confirmed': 'Confirmado',
        'pending': 'Pendente',
        'declined': 'Recusado'
    };
    return statusMap[status] || status;
}
