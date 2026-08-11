const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const JSONbig = require('json-bigint')({ storeAsString: true });

const app = express();

// Use json-bigint so large integer ids (userId / fileId) don't lose precision.
app.use(express.text({ type: 'application/json' }));
app.use((req, res, next) => {
  if (req.body && typeof req.body === 'string') {
    try {
      req.body = JSONbig.parse(req.body);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid JSON' });
    }
  }
  next();
});

const UPLOAD_BASE = process.env.UPLOAD_PATH || '/app/uploads';
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || `${2 * 1024 * 1024 * 1024}`, 10); // 2GB

app.post('/api/files/merge', async (req, res) => {
  try {
    const { userId, fileId, parts, fileName } = req.body;

    if (!fileName || typeof fileName !== 'string') {
      return res.status(400).json({ error: 'Invalid fileName parameter' });
    }

    // Block path traversal attempts.
    if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
      console.error(`Blocked path traversal attempt - fileName: ${fileName}, IP: ${req.ip}`);
      return res.status(400).json({ error: 'Invalid fileName: path traversal not allowed' });
    }

    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');

    console.log(`Merging file: userId=${userId}, fileId=${fileId}, parts=${parts}, fileName=${fileName}`);

    const allFiles = await fs.readdir(UPLOAD_BASE);
    const userFiles = allFiles.filter(f => f.startsWith(`${userId}-`));

    if (userFiles.length === 0) {
      return res.status(404).json({ error: 'No files found for user' });
    }

    const fileGroups = {};
    for (const file of userFiles) {
      const match = file.match(/^(\d+)-(-?\d+)-(\d+)$/);
      if (match) {
        const [, , fid, partNum] = match;
        if (!fileGroups[fid]) fileGroups[fid] = [];
        fileGroups[fid].push({ file, partNum: parseInt(partNum) });
      }
    }

    let actualFileId = null;
    let partFiles = null;
    for (const [fid, files] of Object.entries(fileGroups)) {
      if (files.length === parts) {
        actualFileId = fid;
        partFiles = files.sort((a, b) => a.partNum - b.partNum);
        break;
      }
    }

    if (!actualFileId || !partFiles) {
      return res.status(404).json({ error: `No file group with ${parts} parts found` });
    }

    const partPaths = [];
    for (let i = 0; i < parts; i++) {
      const partFile = partFiles.find(f => f.partNum === i);
      if (!partFile) {
        return res.status(404).json({ error: `Missing file part ${i}` });
      }
      partPaths.push(path.join(UPLOAD_BASE, partFile.file));
    }

    const mergedDir = path.join(UPLOAD_BASE, 'merged');
    await fs.mkdir(mergedDir, { recursive: true });

    const extension = sanitizedFileName.split('.').pop() || '';
    const mergedFileName = `${userId}-${actualFileId}${extension ? '.' + extension : ''}`;
    const mergedFilePath = path.join(mergedDir, mergedFileName);

    const resolvedPath = path.resolve(mergedFilePath);
    const resolvedMergedDir = path.resolve(mergedDir);
    if (!resolvedPath.startsWith(resolvedMergedDir)) {
      return res.status(400).json({ error: 'Invalid file path' });
    }

    const writeStream = require('fs').createWriteStream(mergedFilePath);
    let totalSize = 0;
    for (const partPath of partPaths) {
      const partData = await fs.readFile(partPath);
      if (totalSize + partData.length > MAX_FILE_SIZE) {
        try {
          writeStream.close();
          await fs.unlink(mergedFilePath);
        } catch (e) {}
        return res.status(413).json({ error: 'File too large' });
      }
      writeStream.write(partData);
      totalSize += partData.length;
    }
    writeStream.end();

    await new Promise((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });

    for (const partPath of partPaths) {
      try { await fs.unlink(partPath); } catch (e) {}
    }

    console.log(`Merged ${parts} parts into ${mergedFileName}, total size: ${totalSize} bytes`);
    res.json({ filePath: path.join('merged', mergedFileName), totalSize });
  } catch (error) {
    console.error('Merge error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Opengram file server listening on port ${PORT}`);
  console.log(`Upload base path: ${UPLOAD_BASE}`);
  console.log(`Max file size: ${MAX_FILE_SIZE} bytes`);
});
