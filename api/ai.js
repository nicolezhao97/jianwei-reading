// Vercel Serverless Function —— 部署到 Vercel 后会自动变成 /api/ai 这个接口。
// API Key 只存在这里（服务器端环境变量），永远不会出现在浏览器能看到的代码里。
//
// 部署前需要做的事（在 Vercel 项目后台）：
// Settings → Environment Variables → 新增一个叫 ANTHROPIC_API_KEY 的变量，
// 值填你在 console.anthropic.com 申请到的密钥，然后重新部署一次生效。

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "只支持 POST 请求" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "服务器还没配置 ANTHROPIC_API_KEY 环境变量" });
  }

  const { prompt } = req.body || {};
  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({ error: "缺少 prompt 参数" });
  }
  if (prompt.length > 4000) {
    return res.status(400).json({ error: "prompt 过长" });
  }

  try {
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!upstream.ok) {
      const errText = await upstream.text();
      return res.status(upstream.status).json({ error: errText });
    }

    const data = await upstream.json();
    const text = (data.content || [])
      .filter((c) => c.type === "text")
      .map((c) => c.text)
      .join("\n")
      .trim();

    return res.status(200).json({ text });
  } catch (e) {
    return res.status(500).json({ error: "AI 请求失败" });
  }
}
