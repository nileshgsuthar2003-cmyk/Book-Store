from app.routes.auth import auth_bp
from app.routes.books import books_bp
from app.routes.orders import orders_bp
from app.routes.admin import admin_bp
from app.routes.general import general_bp

def register_blueprints(app):
    app.register_blueprint(auth_bp)
    app.register_blueprint(books_bp)
    app.register_blueprint(orders_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(general_bp)
