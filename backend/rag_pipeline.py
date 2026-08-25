import os
from langchain_community.document_loaders import PyPDFDirectoryLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings

# Define the persistent directory for Chroma DB
CHROMA_PERSIST_DIR = os.path.join(os.path.dirname(__file__), "chroma_db_v2")
DATA_DIR = os.path.join(os.path.dirname(__file__), "data")

def get_vector_store():
    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    if os.path.exists(CHROMA_PERSIST_DIR):
        print("Loading existing Chroma vector store...")
        vectorstore = Chroma(persist_directory=CHROMA_PERSIST_DIR, embedding_function=embeddings)
    else:
        print("Creating new Chroma vector store from PDFs...")
        loader = PyPDFDirectoryLoader(DATA_DIR)
        docs = loader.load()
        
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        splits = text_splitter.split_documents(docs)
        
        vectorstore = Chroma.from_documents(documents=splits, embedding=embeddings, persist_directory=CHROMA_PERSIST_DIR)
    
    return vectorstore

def setup_rag():
    # Pre-initialize vector store
    get_vector_store()
    
def query_rag(query_text: str, api_key: str = None):
    """
    Perform a similarity search on the vector store and generate a response using Gemini.
    """
    vectorstore = get_vector_store()
    results = vectorstore.similarity_search(query_text, k=4)
    
    context = "\n\n".join([doc.page_content for doc in results])
    
    disclaimer = "I cannot provide medical diagnoses. Please consult a healthcare provider for medical advice."
    
    if not api_key:
        # Fallback if no API key is provided
        return f"Context retrieved (No API Key provided for generation):\n\n{context}\n\n--- \nRemember: {disclaimer}"

    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        
        # Using the standard fast lightweight model as requested
        model = genai.GenerativeModel('gemini-3.6-flash')
        
        prompt = f"""You are an expert medical AI assistant specializing in concussion recovery protocols.
Your answers MUST be strictly based on the following retrieved clinical guidelines and context.
If the context does not contain the answer, politely state that you do not know based on the provided documents.
Do not invent or assume protocols outside this context.

Context:
{context}

User Question: {query_text}

Provide a clear, structured, and empathetic answer. 
Always end your response with this exact disclaimer: "{disclaimer}"
"""
        
        response = model.generate_content(prompt)
        return response.text
        
    except Exception as e:
        return f"Error communicating with Gemini API: {str(e)}\n\nFallback Context:\n{context}"

if __name__ == "__main__":
    setup_rag()
    print("RAG setup complete.")
