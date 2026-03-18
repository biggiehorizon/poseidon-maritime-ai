import os
import httpx

GRADIENT_ENDPOINT = os.getenv("GRADIENT_ENDPOINT_URL", "https://inference.do-ai.run/v1/chat/completions")
GRADIENT_MODEL = os.getenv("GRADIENT_MODEL", "llama3-8b-instruct")
GRADIENT_API_KEY = os.getenv("GRADIENT_API_KEY", "")


async def chat(system_prompt: str, user_message: str, temperature: float = 0.7) -> str:
    """Call DigitalOcean Gradient inference endpoint (OpenAI-compatible)."""
    if not GRADIENT_API_KEY:
        raise RuntimeError("GRADIENT_API_KEY not set")

    payload = {
        "model": GRADIENT_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message},
        ],
        "temperature": temperature,
        "max_tokens": 400,
    }
    headers = {
        "Authorization": f"Bearer {GRADIENT_API_KEY}",
        "Content-Type": "application/json",
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(GRADIENT_ENDPOINT, json=payload, headers=headers)
        try:
            resp.raise_for_status()
        except httpx.HTTPStatusError as e:
            try:
                error_detail = resp.json().get("error", resp.text)
            except Exception:
                error_detail = resp.text
            raise RuntimeError(f"Gradient API {resp.status_code}: {error_detail}") from e
        data = resp.json()
        try:
            return data["choices"][0]["message"]["content"]
        except (KeyError, IndexError, TypeError) as e:
            raise RuntimeError(f"Failed to parse Gradient response: {data}") from e
