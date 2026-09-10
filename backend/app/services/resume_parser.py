import io
import re
import logging
from fastapi import HTTPException, status

logger = logging.getLogger(__name__)

# Import PyMuPDF / pymupdf safely
try:
    import pymupdf as fitz_doc
except ImportError:
    try:
        import fitz as fitz_doc
    except ImportError:
        fitz_doc = None

# Import python-docx safely
try:
    import docx
except ImportError:
    docx = None

def clean_extracted_text(text: str) -> str:
    """
    Cleans and normalizes raw text extracted from PDF/DOCX files.
    - Removes non-printable control characters
    - Normalizes excessive blank lines and spaces
    """
    if not text:
        return ""
    # Remove control characters except newline and tab
    clean = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]', '', text)
    # Replace multiple spaces with a single space
    clean = re.sub(r'[ \t]+', ' ', clean)
    # Replace more than 3 consecutive newlines with 2 newlines
    clean = re.sub(r'\n\s*\n\s*\n+', '\n\n', clean)
    return clean.strip()

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """
    Extracts text from PDF file bytes using PyMuPDF (fitz).
    Handles empty, scanned, or corrupted PDFs safely.
    """
    if not fitz_doc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="PyMuPDF library is missing on server."
        )

    try:
        doc = fitz_doc.open(stream=file_bytes, filetype="pdf")
    except Exception as e:
        logger.error(f"PDF opening error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Corrupted or invalid PDF file. Unable to read document structure."
        )

    extracted_pages = []
    try:
        for page_num in range(len(doc)):
            page = doc[page_num]
            text = page.get_text("text")
            if text and text.strip():
                extracted_pages.append(text.strip())
        doc.close()
    except Exception as e:
        logger.error(f"PDF text extraction error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Error extracting text from PDF document."
        )

    full_text = "\n\n".join(extracted_pages)
    cleaned = clean_extracted_text(full_text)

    if not cleaned:
        cleaned = "[No extractable text found in PDF. Document may be scanned or image-only.]"

    return cleaned

def extract_text_from_docx(file_bytes: bytes) -> str:
    """
    Extracts text from DOCX file bytes using python-docx.
    Handles paragraphs and tables cleanly.
    """
    if not docx:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="python-docx library is missing on server."
        )

    try:
        doc_stream = io.BytesIO(file_bytes)
        doc = docx.Document(doc_stream)
    except Exception as e:
        logger.error(f"DOCX opening error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Corrupted or invalid DOCX file. Unable to read Word document structure."
        )

    extracted_chunks = []

    try:
        # Extract paragraph text
        for p in doc.paragraphs:
            if p.text and p.text.strip():
                extracted_chunks.append(p.text.strip())

        # Extract table text
        for table in doc.tables:
            for row in table.rows:
                row_cells = [cell.text.strip() for cell in row.cells if cell.text and cell.text.strip()]
                if row_cells:
                    extracted_chunks.append(" | ".join(row_cells))

    except Exception as e:
        logger.error(f"DOCX text extraction error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Error extracting text from DOCX document."
        )

    full_text = "\n\n".join(extracted_chunks)
    cleaned = clean_extracted_text(full_text)

    if not cleaned:
        cleaned = "[No extractable text found in DOCX file.]"

    return cleaned

def parse_resume_file(file_bytes: bytes, filename: str, content_type: str) -> str:
    """
    Main parser entrypoint. Validates file format and extracts text.
    """
    ext = filename.lower().split('.')[-1] if '.' in filename else ''
    
    if ext == 'pdf' or 'pdf' in content_type.lower():
        return extract_text_from_pdf(file_bytes)
    elif ext == 'docx' or 'wordprocessingml' in content_type.lower() or ext == 'doc':
        return extract_text_from_docx(file_bytes)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file format. Please upload a PDF (.pdf) or Word document (.docx)."
        )
