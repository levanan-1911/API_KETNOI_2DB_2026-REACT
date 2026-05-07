from flask import Flask
from router import router
from flask_cors import CORS

app = Flask(__name__)
CORS(app) 
app.register_blueprint(router)

if __name__ == "__main__":
    app.run(debug=True, port=5000)