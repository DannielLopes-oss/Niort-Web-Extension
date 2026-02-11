# backend/brain.py
import os
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langchain_ollama import OllamaLLM
from langchain_core.documents import Document

# 1. Configuração do Modelo de Embeddings (Transforma texto em números)
# Este modelo é leve, rápido e vai rodar direto na sua CPU
EMBEDDING_MODEL = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

# 2. Configuração do Banco Vetorial (ChromaDB)
# O histórico ficará salvo localmente nesta pasta para não perder quando reiniciar
PERSIST_DIRECTORY = "./niort_db"

vector_store = Chroma(
    collection_name="niort_history",
    embedding_function=EMBEDDING_MODEL,
    persist_directory=PERSIST_DIRECTORY
)

# 3. Função para Salvar o Histórico na Memória
def learn_from_history(history_items):
    """
    Recebe a lista de histórico, transforma em Documentos e salva no ChromaDB.
    """
    documents = []
    for item in history_items:
        # Criamos um "Documento" com o conteúdo (título + url) e metadados
        content = f"Title: {item.title}\nURL: {item.url}"
        doc = Document(
            page_content=content,
            metadata={"url": item.url, "visit_time": item.visit_time}
        )
        documents.append(doc)

    # Adiciona ao banco (isso cria os vetores automaticamente)
    if documents:
        vector_store.add_documents(documents)
        print(f"🧠 Niort aprendeu {len(documents)} novos itens!")
    return True

# 4. Função para Perguntar ao Niort (RAG)
def ask_niort(question: str):
    """
    1. Busca no histórico algo relacionado à pergunta.
    2. Envia o contexto + pergunta para o Ollama.
    """
    print(f"🤔 Pensando sobre: {question}")
    
    # A. Busca os 3 itens mais relevantes no histórico
    results = vector_store.similarity_search(question, k=3)
    
    context_text = "\n\n".join([doc.page_content for doc in results])
    sources = [doc.metadata.get('url', 'URL não encontrada') for doc in results]

    # B. Prepara o prompt para o Ollama
    prompt = f"""
    Você é o Niort Bot, um assistente pessoal inteligente.
    
    Use o seguinte contexto do histórico de navegação do usuário para responder à pergunta.
    Se a resposta não estiver no contexto, use seu conhecimento geral, mas avise que não encontrou no histórico.
    
    CONTEXTO DO USUÁRIO (Histórico recente):
    {context_text}
    
    PERGUNTA DO USUÁRIO:
    {question}
    
    Responda em português, de forma direta e amigável.
    """

    # C. Chama o Ollama (Llama 3 rodando localmente)
    try:
        llm = OllamaLLM(model="gemma2:2b") 
        response = llm.invoke(prompt)
    except Exception as e:
        print(f"Erro ao chamar Ollama: {e}")
        return {
            "reply": "Desculpe, não consegui conectar ao Ollama. Verifique se ele está rodando com 'ollama run llama3'.",
            "related_links": []
        }

    return {
        "reply": response,
        "related_links": sources
    }
    
def generate_recommendation():
    """Vê o histórico recente e gera uma dica sutil de leitura/vídeo."""
    print("🔍 Procurando ideias para recomendar...")
    
    # Pega os 5 últimos itens salvos no banco para entender o contexto atual
    try:
        results = vector_store.similarity_search("o que o usuário mais pesquisa ou estuda?", k=5)
        if not results:
            return None
            
        context_text = "\n".join([doc.page_content for doc in results])

        prompt = f"""
        Você é o Niort Bot. Baseado nestes sites que o usuário visitou recentemente:
        {context_text}

        Escreva UMA frase muito curta (máximo 12 palavras) sugerindo um assunto que ele pode gostar de pesquisar agora.
        Exemplo: "Que tal ver um artigo sobre FastAPI?" ou "Encontrei vídeos novos sobre Python."
        Seja sutil e amigável. NÃO use aspas na sua resposta.
        """
        
        llm = OllamaLLM(model="gemma2:2b")
        response = llm.invoke(prompt)
        return response.strip()
    except Exception as e:
        print(f"Erro ao gerar recomendação: {e}")
        return None