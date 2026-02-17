// ===== SCRIPT DE INICIALIZAÇÃO DO FIREBASE =====
// Este script configura o Firebase com permissões públicas temporárias para setup inicial

console.log('=== SCRIPT DE INICIALIZAÇÃO ===');
console.log('Este script irá configurar o admin e os dados iniciais no Firebase');

// Inicializar Firebase
let db;
try {
    if (!firebase.apps.length) {
        firebase.initializeApp(CONFIG.firebase);
    }
    db = firebase.firestore();
    console.log('✓ Firebase inicializado com sucesso');
} catch (error) {
    console.error('✗ Erro ao inicializar Firebase:', error);
}

// Função principal de setup
async function setupFirebase() {
    console.log('\n--- Iniciando configuração ---\n');
    
    try {
        // 1. Criar configurações de admin
        console.log('1. Criando admin...');
        await db.collection('settings').doc('admin').set({
            email: 'admin@savethedatewedding.com',
            password: 'savethedatewedding2026',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log('✓ Admin criado com sucesso');
        
        // 2. Criar documento de exemplo em rsvp (para testar)
        console.log('\n2. Criando exemplo de RSVP...');
        await db.collection('rsvp').doc('example').set({
            guestName: 'Exemplo',
            fullName: 'Convidado Exemplo',
            status: 'pending',
            attendance: 'pending',
            message: '',
            email: '',
            phone: '',
            companions: 0,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log('✓ Exemplo de RSVP criado');
        
        // 3. Criar documento de exemplo em payments
        console.log('\n3. Criando exemplo de pagamento...');
        await db.collection('payments').doc('example').set({
            transactionId: 'EXAMPLE123',
            name: 'Exemplo',
            email: '',
            amount: 0,
            status: 'pending',
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log('✓ Exemplo de pagamento criado');
        
        console.log('\n=== CONFIGURAÇÃO CONCLUÍDA ===');
        console.log('\nCredenciais de acesso:');
        console.log('Email: admin@savethedatewedding.com');
        console.log('Senha: savethedatewedding2026');
        console.log('\nAcesse: admin-login.html para fazer login');
        
    } catch (error) {
        console.error('\n✗ Erro durante a configuração:', error);
        console.error('Detalhes:', error.message);
        
        if (error.code === 'permission-denied') {
            console.log('\n⚠️ ERRO DE PERMISSÃO');
            console.log('Você precisa atualizar as regras do Firestore:');
            console.log('\n1. Acesse: https://console.firebase.google.com');
            console.log('2. Selecione seu projeto: save-the-date-wedding');
            console.log('3. Vá em Firestore Database > Regras');
            console.log('4. Cole as seguintes regras TEMPORÁRIAS para setup inicial:');
            console.log('\n');
            console.log('rules_version = \'2\';');
            console.log('service cloud.firestore {');
            console.log('  match /databases/{database}/documents {');
            console.log('    match /{document=**} {');
            console.log('      allow read, write: if true;  // TEMPORÁRIO - apenas para setup');
            console.log('    }');
            console.log('  }');
            console.log('}');
            console.log('\n5. Publique as regras');
            console.log('6. Execute este script novamente');
            console.log('7. DEPOIS, substitua pelas regras de segurança em firestore.rules');
        }
    }
}

// Executar setup automaticamente
if (db) {
    setupFirebase();
} else {
    console.error('✗ Firebase não disponível. Verifique a configuração.');
}
