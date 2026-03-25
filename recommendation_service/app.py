from __future__ import annotations

from flask import Flask, jsonify, request

from engine import generate_recommendations


app = Flask(__name__)


@app.get("/health")
def health() -> tuple[dict[str, str], int]:
    return {"status": "ok"}, 200


@app.post("/recommend")
def recommend():
    payload = request.get_json(silent=True) or {}
    result = generate_recommendations(payload)
    return jsonify(result)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
