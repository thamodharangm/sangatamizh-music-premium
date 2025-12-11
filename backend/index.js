// Redirect to the actual server entry point in src/
// This ensures that even if Render runs 'node index.js', it executes the correct modern codebase.
require('./src/server');
