"""
Explainer route — generates AI-powered topic explanations.

POST /api/explain (JWT protected)
Accepts: topic, language, size, age
Returns: { explanation: str }
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from services.gemini import explain_topic, RateLimitError, InvalidRequestError
from models.history import History
from extensions import db, limiter
import re

explainer_bp = Blueprint('explainer', __name__)


@explainer_bp.route('/explain', methods=['POST'])
@jwt_required()
@limiter.limit("10 per minute")
def explain():
    """
    Generate an AI explanation for a given topic.

    Input sanitization: strips HTML tags, limits topic to 500 chars.
    Validates: language (English/Hindi/Spanish/Marathi/French/German/Chinese/Japanese/Arabic),
               size (Short/Medium/Long).
    Saves result to history after successful generation.
    Error handling: 429 for rate limits, 400 for invalid requests, 500 for other errors.
    """
    data = request.get_json()

    topic = data.get('topic', '').strip()
    language = data.get('language', 'English')
    size = data.get('size', 'Medium')
    age = data.get('age', 16)

    if not topic:
        return jsonify({'error': 'Topic is required'}), 400

    # Input sanitization — limit length and strip HTML/script tags
    topic = re.sub(r'<[^>]+>', '', topic)[:500]

    valid_languages = ['English', 'Spanish', 'Marathi', 'Hindi', 'French', 'German', 'Chinese', 'Japanese', 'Arabic']
    if language not in valid_languages:
        return jsonify({'error': 'Invalid language selected'}), 400

    if size not in ['Short', 'Medium', 'Long']:
        return jsonify({'error': 'Invalid size selected'}), 400

    try:
        result = explain_topic(topic, language, size, age)

        # Save to history
        user_id = int(get_jwt_identity())
        entry = History(user_id=user_id, type='explain', topic=topic, response=result)
        db.session.add(entry)
        db.session.commit()

        return jsonify({'explanation': result}), 200
    except RateLimitError as e:
        return jsonify({'error': str(e)}), 429
    except InvalidRequestError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': 'Something went wrong. Please try again.'}), 500