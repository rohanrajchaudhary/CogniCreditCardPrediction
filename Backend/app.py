from flask import Flask, request, jsonify, send_from_directory, render_template
from flask_cors import CORS
import joblib
import numpy as np
import os

app = Flask(__name__, template_folder='../templates', static_folder='../static')
CORS(app)  # Enable CORS for all routes

# -------------------------------
# Load the trained model
# -------------------------------
MODEL_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'Model', 'random_forest_model.joblib'))
model = None

if os.path.exists(MODEL_PATH):
    model = joblib.load(MODEL_PATH)
    print("✅ Model loaded successfully.")
else:
    print(f"⚠️ Warning: Model file not found at {MODEL_PATH}")

# -------------------------------
# Home route (GET only)
# -------------------------------
@app.route('/', methods=['GET'])
def home():
    return render_template('index.html')

# -------------------------------
# Prediction route (POST only)
# -------------------------------
@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()

        if not data:
            return jsonify({'error': 'No input data provided'}), 400

        features = [
            'LIMIT_BAL','SEX','EDUCATION','MARRIAGE','AGE',
            'PAY_1','PAY_2','PAY_3','PAY_4','PAY_5','PAY_6',
            'BILL_AMT1','BILL_AMT2','BILL_AMT3','BILL_AMT4','BILL_AMT5','BILL_AMT6',
            'PAY_AMT1','PAY_AMT2','PAY_AMT3','PAY_AMT4','PAY_AMT5','PAY_AMT6'
        ]

        # Validate all features exist in request
        missing = [f for f in features if f not in data]
        if missing:
            return jsonify({'error': f'Missing fields: {missing}'}), 400

        input_data = np.array([data[f] for f in features]).reshape(1, -1)

        if model is None:
            return jsonify({'error': 'Model not loaded on server.'}), 500

        prediction = model.predict(input_data)[0]
        probability = model.predict_proba(input_data)[0][1]

        prediction_label = "Yes" if int(prediction) == 1 else "No"

        response = {
            'prediction': prediction_label,
            'probability': round(float(probability), 4)
        }

        return jsonify(response)

    except Exception as e:
        return jsonify({'error': str(e)}), 500

# -------------------------------
# Run App
# -------------------------------
if __name__ == "__main__":
    app.run(host='127.0.0.1', port=8000, debug=True)



