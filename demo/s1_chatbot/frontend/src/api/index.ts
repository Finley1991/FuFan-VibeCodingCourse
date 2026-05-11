const API_BASE = "http://localhost:8000/api";

export async function healthCheck(): Promise<{ status: string }> {
  const response = await fetch(`${API_BASE}/health`);
  if (!response.ok) {
    throw new Error("Health check failed");
  }
  return response.json();
}

export async function* sendMessage(
  messages: Array<{ role: string; content: string }>,
  model: string = "deepseek-v4-flash",
  temperature: number = 0.7
): AsyncGenerator<{ type: "reasoning" | "content" | "error"; content: string }> {
  const endpoint = model === "deepseek-reasoner" ? "reasoning" : "chat";
  const response = await fetch(`${API_BASE}/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, model, temperature, stream: true }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Request failed: ${response.status} - ${errorText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) return;

  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // 按行分割JSON
      const lines = buffer.split("\n");
      buffer = lines.pop() || ""; // 保留不完整的最后一行

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine) {
          try {
            const parsed = JSON.parse(trimmedLine);
            yield parsed;
          } catch (e) {
            console.error("Failed to parse line:", trimmedLine, e);
          }
        }
      }
    }

    // 处理最后的buffer
    if (buffer.trim()) {
      try {
        const parsed = JSON.parse(buffer.trim());
        yield parsed;
      } catch (e) {
        console.error("Failed to parse buffer:", buffer, e);
      }
    }
  } finally {
    reader.releaseLock();
  }
}
