"""
MCQ route — generates AI-powered multiple choice questions.

POST /api/mcq (JWT protected)
Accepts: topic, count
Returns: { mcq: str } (raw Q&A text, parsed by frontend)

POST /api/mcq/score (JWT protected)
Accepts: topic, score, total
Returns: { message: str }
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from services.gemini import generate_mcq, RateLimitError, InvalidRequestError
from models.history import History
from extensions import db, limiter
import re

mcq_bp = Blueprint('mcq', __name__)


@mcq_bp.route('/mcq', methods=['POST'])
@jwt_required()
@limiter.limit("10 per minute")
def mcq():
    """
    Generate MCQ questions for a given topic.

    Input sanitization: strips HTML tags, limits topic to 500 chars.
    Validates: count must be integer between 1 and 30.
    Saves result to history after successful generation.
    Error handling: 429 for rate limits, 400 for invalid requests, 500 for other errors.
    """
    data = request.get_json()

    topic = data.get('topic', '').strip()
    count = data.get('count', 5)

    if not topic:
        return jsonify({'error': 'Topic is required'}), 400

    # Input sanitization — limit length and strip HTML/script tags
    topic = re.sub(r'<[^>]+>', '', topic)[:500]

    ALLOWED_COUNTS = [5, 10, 15, 20]
    try:
        count = int(count)
        if count not in ALLOWED_COUNTS:
            raise ValueError
    except (ValueError, TypeError):
        return jsonify({'error': 'Count must be one of: 5, 10, 15, 20.'}), 400

    try:
        result = generate_mcq(topic, count)

        # Save to history
        user_id = int(get_jwt_identity())
        entry = History(
            user_id=user_id, 
            type='mcq', 
            topic=topic, 
            response=result,
            meta_data={'count': count}
        )
        db.session.add(entry)
        db.session.commit()

        return jsonify({'mcq': result}), 200
    except RateLimitError as e:
        return jsonify({'error': str(e)}), 429
    except InvalidRequestError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': 'Failed to generate MCQs. Please try again.'}), 500


@mcq_bp.route('/mcq/score', methods=['POST'])
@jwt_required()
def save_score():
    """Save quiz results to history."""
    data = request.get_json()
    topic = data.get('topic', 'Unknown Topic')
    score = data.get('score', 0)
    total = data.get('total', 0)
    
    user_id = int(get_jwt_identity())
    
    # We save a separate entry for the score, or we could update the previous one if we had the ID.
    # Saving a new entry with type 'mcq_score' is easier for now.
    entry = History(
        user_id=user_id,
        type='mcq_score',
        topic=topic,
        response=f"Scored {score}/{total}",
        meta_data={'score': score, 'total': total}
    )
    db.session.add(entry)
    db.session.commit()
    
    return jsonify({'message': 'Score saved'}), 200