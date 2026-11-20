
import json
import os

from google import genai
from google.genai import types


def _client():
    key = os.getenv("GEMINI_API_KEY")

    if not key or key == "PASTE_YOUR_GEMINI_API_KEY_HERE":
        raise RuntimeError(
            "Gemini API key is missing. Add it to backend/.env."
        )

    return genai.Client(api_key=key)


def ask_gemini(prompt: str) -> str:
    client = _client()

    model = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")

    response = client.models.generate_content(
        model=model,
        contents=prompt,
        config=types.GenerateContentConfig(
            temperature=0.35,
            max_output_tokens=8192
        )
    )

    if not response.text:
        raise RuntimeError("Gemini returned an empty response.")

    return response.text.strip()


def ask_gemini_json(prompt: str):
    client = _client()

    model = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")

    response = client.models.generate_content(
        model=model,
        contents=prompt,
        config=types.GenerateContentConfig(
            temperature=0.35,
            max_output_tokens=8192,
            response_mime_type="application/json"
        )
    )

    if not response.text:
        raise RuntimeError("Gemini returned an empty JSON response.")

    try:
        result = json.loads(response.text.strip())

        if not isinstance(result, dict):
            raise ValueError("Gemini response must be a JSON object.")

        return result

    except json.JSONDecodeError as e:
        raise ValueError(
            f"Gemini returned invalid JSON: {e}"
        ) from e
