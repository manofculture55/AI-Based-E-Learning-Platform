"""
Gemini API service — wraps Google Generative AI calls with error handling and retry logic.

Provides:
  - explain_topic(topic, language, size, age) — generate topic explanation
  - generate_mcq(topic, count) — generate MCQ questions
  - RateLimitError — raised when API rate limit (429) is hit
  - InvalidRequestError — raised when request is invalid
"""
import time
import logging
import google.generativeai as genai
from config import Config

logger = logging.getLogger(__name__)

genai.configure(api_key=Config.GEMINI_API_KEY)
model = genai.GenerativeModel('models/gemini-2.5-flash')


class RateLimitError(Exception):
    """Raised when Gemini API rate limit is hit."""
    pass


class InvalidRequestError(Exception):
    """Raised when Gemini API receives an invalid request."""
    pass


def explain_topic(topic, language, size, age):
    """
    Generate a topic explanation using Gemini AI.

    Args:
        topic: The topic to explain (str, max 500 chars after sanitization)
        language: Output language (English, Hindi, Marathi, Spanish)
        size: Explanation length (Short, Medium, Long)
        age: Target audience age (int, used to adjust complexity)

    Returns:
        str: The generated explanation text (markdown formatted)

    Raises:
        RateLimitError: If Gemini API rate limit is exceeded
        InvalidRequestError: If the request is invalid
    """
    size_map = {
        'Short': 'in 3-4 sentences',
        'Medium': 'in 2-3 paragraphs',
        'Long': 'in detail with multiple sections'
    }
    length = size_map.get(size, 'in 2-3 paragraphs')

    prompt = f"""You are a creative and friendly expert teacher.
Explain the topic "{topic}" to a {age} year old student.
Write the explanation in {language}.
Keep the explanation {length}.

Formatting Rules:
1. Always format your response in clean Markdown.
2. Use bolding to emphasize key terms.
3. Use bullet points or numbered lists to break down complex ideas.
4. If the topic involves programming, math, or technical syntax (and the student is over 12), you MUST include relevant code examples inside proper Markdown code blocks (e.g., ```python ... ```).
5. For a {age} year old: use appropriate vocabulary, relatable analogies, and keep it engaging but not patronizing. Never use overly dense jargon without explaining it first."""

    return _call_gemini(prompt)


def generate_mcq(topic, count):
    """
    Generate multiple choice questions using Gemini AI.

    Args:
        topic: The topic for questions (str)
        count: Number of questions to generate (int, 1-30)

    Returns:
        str: Raw MCQ text in format "Q1. ... a) ... b) ... c) ... d) ... Answer: a"

    Raises:
        RateLimitError: If Gemini API rate limit is exceeded
        InvalidRequestError: If the request is invalid
    """
    prompt = f"""Generate exactly {count} multiple choice questions about "{topic}".

Format each question exactly like this:
Q1. Question text here
a) Option A
b) Option B
c) Option C
d) Option D
Answer: a

Follow this exact format for all {count} questions. Number them Q1, Q2, Q3 etc.
Do not add any extra text before or after the questions."""

    return _call_gemini(prompt)


def _call_gemini(prompt, retries=1):
    """
    Call Gemini API with timeout and simple retry logic.

    Uses a 30-second timeout per request. On failure (except InvalidArgument),
    waits 2 seconds and retries once before raising an error.
    """
    for attempt in range(retries + 1):
        try:
            response = model.generate_content(prompt, request_options={"timeout": 30})
            return response.text
        except Exception as e:
            error_type = type(e).__name__

            # Don't retry on invalid argument — it won't help
            if 'InvalidArgument' in error_type:
                raise InvalidRequestError("Invalid request. Please modify your topic.")

            # On last attempt, handle the error
            if attempt == retries:
                _handle_gemini_error(e)

            # Retry: wait 2 seconds then try again
            logger.warning(f"Gemini call failed (attempt {attempt + 1}), retrying in 2s: {e}")
            time.sleep(2)


def _handle_gemini_error(e):
    """Centralized error handler — maps Gemini exceptions to custom errors."""
    error_type = type(e).__name__

    # google.api_core.exceptions.ResourceExhausted (429)
    if 'ResourceExhausted' in error_type or '429' in str(e):
        raise RateLimitError("AI service is busy. Please wait a moment and try again.")

    # Timeout or deadline exceeded
    if 'DeadlineExceeded' in error_type or 'Timeout' in error_type:
        raise RateLimitError("AI service took too long. Please try again.")

    # Re-raise anything else
    raise Exception(f"AI service error: {str(e)}")