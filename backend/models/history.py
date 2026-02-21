"""
History model — stores user's past explainer and MCQ interactions.

Each record tracks the type of interaction (explain/mcq), the topic,
the AI-generated response, and a timestamp.
"""
from extensions import db
from datetime import datetime


class History(db.Model):
    __tablename__ = 'history'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    type = db.Column(db.String(20), nullable=False)  # 'explain' or 'mcq'
    topic = db.Column(db.String(500), nullable=False)
    response = db.Column(db.Text, nullable=False)
    meta_data = db.Column(db.JSON, nullable=True) # For saving scores, options, etc.
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User', backref=db.backref('history', lazy=True))

    def to_dict(self):
        return {
            'id': self.id,
            'type': self.type,
            'topic': self.topic,
            'response': self.response,
            'metadata': self.meta_data,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
