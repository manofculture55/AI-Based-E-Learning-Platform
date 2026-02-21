"""
History route — retrieves and deletes user's interaction history.

GET  /api/history        — get all history for current user (JWT protected)
DELETE /api/history/:id  — delete a specific history entry (JWT protected)
GET  /api/stats          — get user statistics (JWT protected)
"""
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.history import History
from extensions import db
from sqlalchemy import func

history_bp = Blueprint('history', __name__)


@history_bp.route('/history', methods=['GET'])
@jwt_required()
def get_history():
    """Get all history entries for the current user, newest first."""
    user_id = int(get_jwt_identity())
    entries = History.query.filter_by(user_id=user_id).order_by(History.created_at.desc()).all()
    return jsonify({'history': [e.to_dict() for e in entries]}), 200


@history_bp.route('/history/<int:entry_id>', methods=['DELETE'])
@jwt_required()
def delete_history(entry_id):
    """Delete a specific history entry (only if owned by current user)."""
    user_id = int(get_jwt_identity())
    entry = History.query.filter_by(id=entry_id, user_id=user_id).first()

    if not entry:
        return jsonify({'error': 'Entry not found'}), 404

    db.session.delete(entry)
    db.session.commit()
    return jsonify({'message': 'Deleted'}), 200



