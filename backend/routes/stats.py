from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.history import History
from extensions import db
from sqlalchemy import func, distinct

stats_bp = Blueprint('stats', __name__)

@stats_bp.route('/api/stats', methods=['GET'])
@jwt_required()
def get_stats():
    """Return learning analytics for the current user."""
    user_id = get_jwt_identity()
    
    # Count distinct topics ever explained or quizzed
    topics_learned = db.session.query(func.count(distinct(History.topic)))\
        .filter(History.user_id == user_id, History.type.in_(['explain', 'mcq']))\
        .scalar() or 0
    
    # Count MCQ sessions
    questions_solved = History.query\
        .filter_by(user_id=user_id, type='mcq')\
        .count()
    
    # Calculate accuracy from meta_data JSON field where type is 'mcq_score'
    mcq_sessions_with_score = History.query\
        .filter_by(user_id=user_id, type='mcq_score')\
        .all()
    
    accuracy = 0
    if mcq_sessions_with_score:
        total_correct = 0
        total_questions = 0
        for session in mcq_sessions_with_score:
            if session.meta_data:
                try:
                    score = int(session.meta_data.get('score', 0))
                    total = int(session.meta_data.get('total', 0))
                    total_correct += score
                    total_questions += total
                except (ValueError, TypeError):
                    pass
        if total_questions > 0:
            accuracy = round((total_correct / total_questions) * 100)
    
    # Count total history entries (as a proxy for time spent — 1 entry ≈ 3 minutes)
    total_sessions = History.query.filter_by(user_id=user_id).count()
    time_minutes = total_sessions * 3
    if time_minutes >= 60:
        hours = time_minutes // 60
        mins = time_minutes % 60
        time_spent = f"{hours}h {mins}m" if mins > 0 else f"{hours}h"
    else:
        time_spent = f"{time_minutes}m" if time_minutes > 0 else "0m"
    
    return jsonify({
        'time_spent': time_spent,
        'topics_learned': topics_learned,
        'questions_solved': questions_solved,
        'accuracy': accuracy
    }), 200
