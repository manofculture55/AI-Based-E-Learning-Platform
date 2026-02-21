from extensions import db
from datetime import datetime
import bcrypt

class User(db.Model):
    __tablename__ = 'user'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(150), nullable=False, unique=True)
    password = db.Column(db.String(255), nullable=False)
    age = db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def set_password(self, plain_password):
        salt = bcrypt.gensalt()
        self.password = bcrypt.hashpw(plain_password.encode('utf-8'), salt).decode('utf-8')

    def check_password(self, plain_password):
        return bcrypt.checkpw(plain_password.encode('utf-8'), self.password.encode('utf-8'))

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'age': self.age,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }