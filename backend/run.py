from config import Config
from app import create_app

app = create_app()

if __name__ == "__main__":
    port = Config.PORT
    print(f"🚀 BookNest Flask API server running on http://127.0.0.1:{port} (MySQL: {Config.MYSQL_DB})")
    app.run(host="0.0.0.0", port=port, debug=True)
