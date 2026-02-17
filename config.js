// ===== CONFIGURAÇÃO CENTRALIZADA =====
// Este arquivo carrega as variáveis de ambiente de forma segura

const FIREBASE_CONFIG = {
    // Firebase Configuration (carregado do .env ou variáveis de ambiente)
    firebase: {
        apiKey: "AIzaSyDVimbFN7X_uoIGA0ZPogSx-gemB_ytm1s",
        authDomain: "save-the-date-wedding.firebaseapp.com",
        projectId: "save-the-date-wedding",
        storageBucket: "save-the-date-wedding.firebasestorage.app",
        messagingSenderId: "823295690615",
        appId: "1:823295690615:web:6c095d0d2b1bbd13b28372",
        measurementId: "G-46M75HGTC0"
    },

    // PIX Configuration
    pix: {
        key: "53243721881", // CPF configurado
        name: "Matheus e Flavia",
        city: "São Paulo",
        amount: null // Será preenchido dinamicamente
    },

    // Admin Configuration
    admin: {
        email: "admin@savethedatewedding.com",
        password: "savethedatewedding2026" // Senha padrão
    },

    // Collections do Firebase
    collections: {
        guests: "guests",
        payments: "payments",
        rsvp: "rsvp",
        settings: "settings"
    },

    // Storage Keys
    storage: {
        firstVisit: 'saveTheDate_firstVisit',
        userIdentity: 'saveTheDate_userIdentity',
        adminToken: 'saveTheDate_adminToken'
    }
};

// Exportar configuração
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FIREBASE_CONFIG;
}

// Também disponibilizar globalmente como CONFIG para compatibilidade
window.CONFIG = FIREBASE_CONFIG;
