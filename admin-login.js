// ===== ADMIN LOGIN SCRIPT =====

// Inicializar Firebase
let db;
try {
    firebase.initializeApp(CONFIG.firebase);
    db = firebase.firestore();
    console.log('Firebase inicializado com sucesso');
} catch (error) {
    console.error('Erro ao inicializar Firebase:', error);
}

// Verificar se já está logado
if (localStorage.getItem(CONFIG.storage.adminToken)) {
    window.location.href = 'admin-dashboard.html';
}

// Inicializar admin no Firebase (primeira vez)
async function initializeAdmin() {
    try {
        const adminDoc = await db.collection(CONFIG.collections.settings).doc('admin').get();
        
        if (!adminDoc.exists) {
            console.log('Criando admin padrão...');
            await db.collection(CONFIG.collections.settings).doc('admin').set({
                email: CONFIG.admin.email,
                password: CONFIG.admin.password,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log('Admin criado com sucesso!');
        }
    } catch (error) {
        console.error('Erro ao inicializar admin:', error);
    }
}

// Chamar inicialização ao carregar página
initializeAdmin();

// Login Form Handler
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('errorMessage');
    const loginButton = document.getElementById('loginButton');
    const buttonText = loginButton.querySelector('.button-text');
    const buttonLoader = loginButton.querySelector('.button-loader');
    
    // Limpar mensagem de erro
    errorMessage.style.display = 'none';
    
    // Mostrar loader
    loginButton.disabled = true;
    buttonText.style.display = 'none';
    buttonLoader.style.display = 'block';
    
    try {
        // Primeiro, tentar verificar com credenciais do CONFIG
        if (email === CONFIG.admin.email && password === CONFIG.admin.password) {
            // Login bem-sucedido com credenciais padrão
            const token = generateToken();
            localStorage.setItem(CONFIG.storage.adminToken, token);
            localStorage.setItem('admin_email', email);
            
            // Tentar registrar login (se Firebase estiver disponível)
            try {
                await db.collection('admin_logs').add({
                    action: 'login',
                    email: email,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                    ip: await getClientIP()
                });
            } catch (logError) {
                console.warn('Não foi possível registrar log:', logError);
            }
            
            // Redirecionar para dashboard
            window.location.href = 'admin-dashboard.html';
            return;
        }
        
        // Se não for credencial padrão, verificar no Firebase
        const adminDoc = await db.collection(CONFIG.collections.settings).doc('admin').get();
        
        if (adminDoc.exists) {
            const adminData = adminDoc.data();
            
            if (email === adminData.email && password === adminData.password) {
                // Login bem-sucedido
                const token = generateToken();
                localStorage.setItem(CONFIG.storage.adminToken, token);
                localStorage.setItem('admin_email', email);
                
                // Registrar login
                try {
                    await db.collection('admin_logs').add({
                        action: 'login',
                        email: email,
                        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                        ip: await getClientIP()
                    });
                } catch (logError) {
                    console.warn('Não foi possível registrar log:', logError);
                }
                
                // Redirecionar para dashboard
                window.location.href = 'admin-dashboard.html';
            } else {
                throw new Error('Email ou senha incorretos');
            }
        } else {
            throw new Error('Email ou senha incorretos');
        }
    } catch (error) {
        console.error('Erro ao fazer login:', error);
        
        let errorMsg = error.message;
        if (error.code === 'permission-denied') {
            errorMsg = 'Erro de permissão. Verifique as regras do Firestore.';
        }
        
        errorMessage.textContent = errorMsg;
        errorMessage.style.display = 'block';
        
        // Resetar botão
        loginButton.disabled = false;
        buttonText.style.display = 'block';
        buttonLoader.style.display = 'none';
    }
});

// Funções auxiliares
function generateToken() {
    return Array.from({ length: 32 }, () => 
        Math.floor(Math.random() * 16).toString(16)
    ).join('');
}

async function getClientIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch {
        return 'unknown';
    }
}

// Enter key handler
document.getElementById('password').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        document.getElementById('loginForm').dispatchEvent(new Event('submit'));
    }
});
