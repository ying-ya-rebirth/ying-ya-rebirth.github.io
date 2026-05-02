/**
 * Vercel Serverless Function for persistence of reactions data
 * Deploy to Vercel or similar serverless platform
 * Set environment variables: GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO
 */

const GITHUB_OWNER = process.env.GITHUB_OWNER || 'ying-ya-rebirth';
const GITHUB_REPO = process.env.GITHUB_REPO || 'ying-ya-rebirth.github.io';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const DATA_BRANCH = 'reactions-data';

async function getReactionsData(pathname) {
  if (!GITHUB_TOKEN) {
    throw new Error('GITHUB_TOKEN not configured');
  }

  const filePath = `reactions/${pathname.replace(/\//g, '_')}.json`;

  try {
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}?ref=${DATA_BRANCH}`,
      {
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3.raw',
        },
      }
    );

    if (response.status === 404) {
      return {};
    }

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to fetch reactions data:', error);
    return {};
  }
}

async function saveReactionsData(pathname, data) {
  if (!GITHUB_TOKEN) {
    throw new Error('GITHUB_TOKEN not configured');
  }

  const filePath = `reactions/${pathname.replace(/\//g, '_')}.json`;
  const content = Buffer.from(JSON.stringify(data, null, 2)).toString('base64');

  try {
    // First, try to get the current file to get its SHA
    let fileSha = null;
    try {
      const getResponse = await fetch(
        `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}?ref=${DATA_BRANCH}`,
        {
          headers: {
            'Authorization': `token ${GITHUB_TOKEN}`,
          },
        }
      );

      if (getResponse.ok) {
        const fileData = await getResponse.json();
        fileSha = fileData.sha;
      }
    } catch (e) {
      // File doesn't exist yet, that's ok
    }

    // Create or update the file
    const putData = {
      message: `Update reactions for ${pathname}`,
      content: content,
      branch: DATA_BRANCH,
    };

    if (fileSha) {
      putData.sha = fileSha;
    }

    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(putData),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`GitHub API error: ${response.status} - ${error.message}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to save reactions data:', error);
    throw error;
  }
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { pathname } = req.query;

    if (!pathname) {
      return res.status(400).json({ error: 'Missing pathname parameter' });
    }

    if (req.method === 'GET') {
      const data = await getReactionsData(pathname);
      return res.status(200).json(data);
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      const data = req.body;
      await saveReactionsData(pathname, data);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: error.message });
  }
}
