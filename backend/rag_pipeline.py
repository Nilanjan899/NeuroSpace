import os
import pymupdf as fitz  # PyMuPDF
from PIL import Image
import io
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_classic.retrievers import ParentDocumentRetriever
from langchain_core.stores import InMemoryStore
from langchain_core.documents import Document

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")

def extract_text_and_images_with_pymupdf(data_dir):
    docs = []
    # If a user provides an API key in the environment, we do advanced VLM extraction!
    api_key = os.environ.get("GEMINI_API_KEY")
    
    if api_key:
        print("GEMINI_API_KEY detected! Enabling Zero-Shot VLM Flowchart Extraction...")
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        vlm_model = genai.GenerativeModel('gemini-3.6-flash')
    else:
        vlm_model = None

    for filename in os.listdir(data_dir):
        if not filename.endswith(".pdf"):
            continue
            
        filepath = os.path.join(data_dir, filename)
        doc = fitz.open(filepath)
        
        for page_num in range(len(doc)):
            page = doc[page_num]
            
            # PHASE 1: Layout-Aware Partitioning using PyMuPDF blocks
            text_blocks = page.get_text("blocks")
            # Filter for actual text blocks (type 0) to avoid mangling tables/images natively
            page_text = "\n\n".join([b[4] for b in text_blocks if b[6] == 0]) 
            
            # PHASE 2: Zero-Shot VLM Flowchart Extraction
            if vlm_model:
                try:
                    pix = page.get_pixmap(dpi=150)
                    img = Image.open(io.BytesIO(pix.tobytes("jpeg")))
                    
                    prompt = "You are a data extraction tool. Convert any medical flowcharts, algorithms, or visual decision trees on this page into a strictly structured Markdown hierarchical list. If there are none, output NOTHING."
                    response = vlm_model.generate_content([prompt, img])
                    
                    if response.text and response.text.strip().upper() != "NOTHING":
                        page_text += f"\n\n### Extracted Flowchart Context:\n{response.text}\n"
                except Exception as e:
                    print(f"VLM extraction failed on {filename} page {page_num}: {e}")
            
            docs.append(Document(
                page_content=page_text,
                metadata={"source": filename, "page": page_num}
            ))
            
    return docs

class HybridRetriever:
    """
    A custom Ensemble Retriever that queries a Parent-Child architecture AND a Standard Dense architecture,
    then algorithmically deduplicates the overlapping context chunks to prevent Token Bloat.
    """
    def __init__(self, parent_retriever, standard_vectorstore):
        self.parent_retriever = parent_retriever
        self.standard_vectorstore = standard_vectorstore
        
    def invoke(self, query_text):
        print("Querying Hybrid Ensemble Retriever...")
        
        # 1. Fetch massive, broad contextual chunks from Pipeline A
        parent_results = self.parent_retriever.invoke(query_text)
        top_parents = parent_results[:2]
        
        # 2. Fetch highly specific dense chunks from Pipeline B
        standard_results = self.standard_vectorstore.similarity_search(query_text, k=3)
        
        # 3. Fast Algorithmic Deduplication Engine
        hybrid_context = []
        parent_texts = [p.page_content for p in top_parents]
        
        # Prioritize the broad parent contexts
        hybrid_context.extend(parent_texts)
        
        # Only inject the dense chunks if they aren't already captured by the parents
        for std_doc in standard_results:
            is_duplicate = False
            for parent_text in parent_texts:
                if std_doc.page_content.strip() in parent_text:
                    is_duplicate = True
                    break
            
            if not is_duplicate:
                hybrid_context.append(std_doc.page_content)
                
        return hybrid_context

def get_hybrid_retriever():
    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    
    print("Building Hybrid RAG Vector Stores from single-pass PyMuPDF Extractions...")
    docs = extract_text_and_images_with_pymupdf(DATA_DIR)
    
    # ---------------------------------------------------------
    # PIPELINE A: Advanced Parent-Child Retriever
    # ---------------------------------------------------------
    child_vectorstore = Chroma(
        collection_name="split_parents",
        embedding_function=embeddings,
        persist_directory=None # Ephemeral for hackathon
    )
    store = InMemoryStore()
    parent_splitter = RecursiveCharacterTextSplitter(chunk_size=1500, chunk_overlap=200)
    child_splitter = RecursiveCharacterTextSplitter(chunk_size=300, chunk_overlap=50)
    
    parent_retriever = ParentDocumentRetriever(
        vectorstore=child_vectorstore,
        docstore=store,
        child_splitter=child_splitter,
        parent_splitter=parent_splitter
    )
    parent_retriever.add_documents(docs)
    
    # ---------------------------------------------------------
    # PIPELINE B: Simple Dense Retriever
    # ---------------------------------------------------------
    standard_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=100)
    standard_splits = standard_splitter.split_documents(docs)
    
    standard_vectorstore = Chroma.from_documents(
        documents=standard_splits, 
        embedding=embeddings, 
        collection_name="standard_dense",
        persist_directory=None # Ephemeral for hackathon
    )
    
    return HybridRetriever(parent_retriever, standard_vectorstore)

# Global retriever instance for the server lifecycle
_hybrid_retriever_instance = None

def get_retriever():
    global _hybrid_retriever_instance
    if _hybrid_retriever_instance is None:
        _hybrid_retriever_instance = get_hybrid_retriever()
    return _hybrid_retriever_instance

def query_rag(query_text: str, api_key: str = None):
    retriever = get_retriever()
    
    # The hybrid retriever returns a pre-deduplicated list of strings
    context_chunks = retriever.invoke(query_text)
    context = "\n\n---\n\n".join(context_chunks)
    
    disclaimer = "I cannot provide medical diagnoses. Please consult a healthcare provider for medical advice."
    
    if not api_key:
        return f"Context retrieved (No API Key provided for generation):\n\n{context}\n\n--- \nRemember: {disclaimer}"

    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)
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
    print("Setting up Hybrid Ensemble RAG pipeline...")
    get_retriever()
    print("Hybrid RAG setup complete.")
