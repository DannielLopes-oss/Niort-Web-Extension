# backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
# Importamos as funções do nosso novo cérebro
from brain import learn_from_history, ask_niort, generate_recommendation # <-- Adicione generate_recommendation

app = FastAPI(title="Niort Bot API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatMessage(BaseModel):
    user_message: str
    context_url: Optional[str] = None

class HistoryItem(BaseModel):
    url: str
    title: str
    visit_time: str

@app.get("/")
async def root():
    return {"status": "Niort Brain Active 🧠"}

@app.post("/api/chat")
async def chat_endpoint(message: ChatMessage):
    # Agora chamamos a função real de IA!
    response = ask_niort(message.user_message)
    return response

@app.post("/api/sync-history")
async def sync_history(history: List[HistoryItem]):
    print(f"📥 Recebendo {len(history)} itens de histórico...")
    
    # Chama a função que salva no ChromaDB
    learn_from_history(history)
    
    return {"status": "Memória atualizada com sucesso!"}

@app.get("/api/recommendation")
async def get_recommendation():
    """A extensão vai chamar essa rota de tempos em tempos."""
    rec = generate_recommendation()
    if rec:
        return {"message": rec}
    return {"message": ""}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)