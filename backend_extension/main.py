from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware # <--- Importe isso
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI(title="Niort Bot API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permite que a extensão acesse o servidor
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# -----------------------------------------------------------

class ChatMessage(BaseModel):
    user_message: str
    context_url: Optional[str] = None

class HistoryItem(BaseModel):
    url: str
    title: str
    visit_time: str

@app.get("/")
async def root():
    return {"status": "Niort Bot Brain is active"}

@app.post("/api/chat")
async def chat_endpoint(message: ChatMessage):
    print(f"Recebido: {message.user_message}")
    return {
        "reply": f"O Niort Bot recebeu sua mensagem: '{message.user_message}'",
        "related_links": []
    }
    
@app.post("/api/sync-history")
async def sync_history(history: List[HistoryItem]):
    """
    Recebe o histórico do navegador para análise.
    """
    print(f"\n--- RECEBENDO PACOTE DE HISTÓRICO ---")
    print(f"Total de itens recebidos: {len(history)}")
    
    # Vamos imprimir os 5 primeiros só para você ver que funcionou
    print("Amostra dos últimos sites visitados:")
    for item in history[:5]:
        print(f" - [{item.visit_time}] {item.title} ({item.url})")
    
    print("---------------------------------------")

    # AQUI entraremos com o ChromaDB no próximo passo para salvar de verdade
    
    return {"status": "History synced", "processed_count": len(history)}    
    
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)