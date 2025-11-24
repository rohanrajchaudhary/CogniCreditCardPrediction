async function predict() {
    // Map education labels in the UI to numeric codes expected by the backend/model
    function mapEducation(edu) {
        switch (String(edu).toLowerCase()) {
            case 'graduate school': return 1;
            case 'university': return 2;
            case 'high school': return 3;
            default: return 4; // others
        }
    }

    // Helper to coerce empty values to 0 and numbers otherwise
    const num = (val) => Number(val === '' ? 0 : val);

    const payload = {
        'LIMIT_BAL': num(document.getElementById('limit_balance').value),
        'SEX': num(document.getElementById('gender').value),
        'EDUCATION': mapEducation(document.getElementById('education').value),
        'MARRIAGE': num(document.getElementById('marriage').value),
        'AGE': num(document.getElementById('age').value),

        'PAY_1': num(document.getElementById('pay_1').value),
        'PAY_2': num(document.getElementById('pay_2').value),
        'PAY_3': num(document.getElementById('pay_3').value),
        'PAY_4': num(document.getElementById('pay_4').value),
        'PAY_5': num(document.getElementById('pay_5').value),
        'PAY_6': num(document.getElementById('pay_6').value),

        'BILL_AMT1': num(document.getElementById('bill_amt1').value),
        'BILL_AMT2': num(document.getElementById('bill_amt2').value),
        'BILL_AMT3': num(document.getElementById('bill_amt3').value),
        'BILL_AMT4': num(document.getElementById('bill_amt4').value),
        'BILL_AMT5': num(document.getElementById('bill_amt5').value),
        'BILL_AMT6': num(document.getElementById('bill_amt6').value),

        'PAY_AMT1': num(document.getElementById('pay_amt1').value),
        'PAY_AMT2': num(document.getElementById('pay_amt2').value),
        'PAY_AMT3': num(document.getElementById('pay_amt3').value),
        'PAY_AMT4': num(document.getElementById('pay_amt4').value),
        'PAY_AMT5': num(document.getElementById('pay_amt5').value),
        'PAY_AMT6': num(document.getElementById('pay_amt6').value)
    };

  const endpoints = [
    'https://creditcardbackend.onrender.com/predict',  // ✅ your Render backend URL here
    'http://127.0.0.1:8000/predict',
    'http://localhost:8000/predict',
    'http://127.0.0.1:5000/predict',
    'http://localhost:5000/predict'
];


    // Try multiple endpoints until one succeeds
    let response;
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        response = await fetch(endpoints[0], {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload),
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (!response.ok) throw new Error(String(response.status));
    } catch (primaryErr) {
        let lastErr = primaryErr;
        for (let i = 1; i < endpoints.length; i++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 8000);
                response = await fetch(endpoints[i], {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                    signal: controller.signal
                });
                clearTimeout(timeoutId);
                if (response.ok) break;
                lastErr = new Error(String(response.status));
            } catch (err) {
                lastErr = err;
            }
        }
        if (!response || !response.ok) throw lastErr;
    }

    try {
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Request failed (${response.status}). ${errorText}`);
        }

        // Ensure we received JSON
        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
            const text = await response.text();
            throw new Error(`Unexpected response. Expected JSON but got: ${text.substring(0, 200)}`);
        }
        const result = await response.json();

        // Display the prediction result
        const predictionText = document.getElementById('default-status');
        predictionText.textContent = String(result.prediction);

        const predictionProbability = document.getElementById('default-probability');
        // Show probability to 2 decimal places as a percentage if 0-1, else raw
        const prob = Number(result.probability);
        predictionProbability.textContent = isFinite(prob)
            ? (prob <= 1 ? `${(prob * 100).toFixed(2)}%` : prob.toFixed(4))
            : String(result.probability);

        // show the result container
        const resultcontainer = document.getElementById('result-container');
        resultcontainer.style.display = 'block';
        resultcontainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch (error) {
        console.error('Prediction error:', error);
        // Show error message in the result container as well
        const resultcontainer = document.getElementById('result-container');
        const statusEl = document.getElementById('default-status');
        const probEl = document.getElementById('default-probability');
        statusEl.textContent = 'Error';
        probEl.textContent = '—';
        resultcontainer.style.display = 'block';
        alert('Failed to get prediction from server. Please make sure the backend (http://127.0.0.1:8000) is running.');
    }
}
