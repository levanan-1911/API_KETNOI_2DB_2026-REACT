from flask import Flask
from router import router
from auth import auth_bp
from admin import admin_bp
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

app.register_blueprint(router)
app.register_blueprint(auth_bp)
app.register_blueprint(admin_bp)

if __name__ == "__main__":
    app.run(debug=True, port=5000)