"""
AI Learning Platform — Flask application factory.

In development: serves API only (frontend via Vite dev server).
In production: serves both API and frontend static files from dist/.
"""
import os
from flask import Flask, send_from_directory
from flask_cors import CORS
from datetime import timedelta
from config import Config
from extensions import db, jwt, limiter


def create_app():
    # Resolve paths for serving frontend in production
    frontend_dist = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'frontend', 'dist')
    frontend_dist = os.path.normpath(frontend_dist)

    app = Flask(__name__, static_folder=frontend_dist, static_url_path='')
    app.config.from_object(Config)
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=7)

    # CORS — allow dev servers + production origin
    allowed_origins = [
        "http://127.0.0.1:5173",
        "http://localhost:5173",
    ]
    # Add production origin from env if set
    prod_origin = os.getenv('PRODUCTION_ORIGIN')
    if prod_origin:
        allowed_origins.append(prod_origin)

    CORS(app, resources={r"/api/*": {"origins": allowed_origins}})

    db.init_app(app)
    jwt.init_app(app)
    # Default limit: 200 per day, 50 per hour
    limiter.init_app(app)

    from routes.auth import auth_bp
    from routes.explainer import explainer_bp
    from routes.mcq import mcq_bp
    from routes.history import history_bp
    from routes.stats import stats_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(explainer_bp, url_prefix='/api')
    app.register_blueprint(mcq_bp, url_prefix='/api')
    app.register_blueprint(history_bp, url_prefix='/api')
    app.register_blueprint(stats_bp)

    # Security Headers
    @app.after_request
    def add_security_headers(response):
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'SAMEORIGIN'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        return response

    # Serve React app for all non-API routes (SPA client-side routing)
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve_frontend(path):
        # If the path is a real file in dist, serve it
        if path and os.path.exists(os.path.join(frontend_dist, path)):
            return send_from_directory(frontend_dist, path)
        # Otherwise serve index.html (React Router handles routing)
        return send_from_directory(frontend_dist, 'index.html')

    with app.app_context():
        db.create_all()

    return app


if __name__ == '__main__':
    app = create_app()
    app.run(debug=app.config.get('DEBUG', False), port=5000)