const { spawn } = require('child_process');

/**
 * Execute yt-dlp with arguments and capture output/error
 * @param {string[]} args Array of arguments for yt-dlp
 * @param {object} options Options object { timeout }
 * @returns {Promise<{stdout: string}>}
 */
function runYtDlp(args, { timeout = 45000 } = {}) {
  return new Promise((resolve, reject) => {
    // stdio: ignore stdin, pipe stdout/stderr
    const yt = spawn(args[0], args.slice(1), { stdio: ['ignore', 'pipe', 'pipe'] });

    let stdout = '';
    let stderr = '';
    
    // Safety timeout
    const timer = setTimeout(() => {
      yt.kill('SIGKILL');
      reject(new Error('yt-dlp timed out after ' + timeout + 'ms'));
    }, timeout);

    yt.stdout.on('data', d => (stdout += d.toString()));
    yt.stderr.on('data', d => (stderr += d.toString()));

    yt.on('close', code => {
      clearTimeout(timer);
      if (code === 0) return resolve({ stdout });
      
      // Construct a useful error message from stderr (first meaningful line)
      const errLines = stderr.trim().split('\n');
      const firstErr = errLines.find(l => l.includes('ERROR:') || l.includes('WARNING:')) || errLines[0];
      
      const err = new Error(`yt-dlp exited ${code}: ${firstErr || 'Unknown error'}`);
      err.code = code;
      err.stderr = stderr;
      reject(err);
    });

    yt.on('error', (err) => {
        clearTimeout(timer);
        reject(new Error(`Failed to spawn yt-dlp: ${err.message}`));
    });
  });
}

module.exports = { runYtDlp };
