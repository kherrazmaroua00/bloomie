export async function parseJsonResponse(res) {
  const text = await res.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch (error) {
    return { error: text };
  }
}
