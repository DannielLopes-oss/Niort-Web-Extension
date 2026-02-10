// extension/background.js

// Escuta mensagens vindas do content.js (o chat)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "SYNC_HISTORY") {
        syncHistory();
        sendResponse({ status: "Sincronização iniciada..." });
    }
    return true; // Mantém o canal de comunicação aberto
});

async function syncHistory() {
    console.log("Iniciando varredura do histórico...");

    // 1. Busca os últimos 1000 itens do histórico (pode aumentar depois)
    // 'text: ""' significa buscar tudo, sem filtro de texto.
    const historyItems = await chrome.history.search({
        text: "", 
        maxResults: 1000,
        startTime: 0 // Desde o início dos tempos (ou 0 para tudo)
    });

    // 2. Formata os dados para o Python
    const payload = historyItems.map(item => ({
        url: item.url,
        title: item.title || "Sem título",
        visit_time: new Date(item.lastVisitTime).toISOString()
    }));

    console.log(`Encontrados ${payload.length} itens. Enviando para o cérebro...`);

    // 3. Envia para o Backend Python
    try {
        const response = await fetch("http://127.0.0.1:8000/api/sync-history", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        console.log("Sucesso no envio:", data);
        
        // Opcional: Avisar o usuário (podemos implementar notificação depois)
    } catch (error) {
        console.error("Erro ao enviar histórico para o Python:", error);
    }
}