import httpx


class SharedHTTPClient:
    def __init__(self, timeout: float = 20.0):
        self._client = httpx.AsyncClient(timeout=timeout)

    async def get_json(self, url: str, params: dict | None = None, headers: dict | None = None) -> dict:
        response = await self._client.get(url, params=params, headers=headers)
        response.raise_for_status()
        return response.json()

    async def get_text(self, url: str, params: dict | None = None, headers: dict | None = None) -> str:
        response = await self._client.get(url, params=params, headers=headers)
        response.raise_for_status()
        return response.text

    async def close(self) -> None:
        await self._client.aclose()
