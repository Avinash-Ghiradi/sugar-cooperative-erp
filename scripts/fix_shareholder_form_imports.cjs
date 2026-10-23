const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../client/src/components/Shareholders/ShareholderForm.jsx');
let content = fs.readFileSync(filePath, 'utf8');

const oldLine = "import React, { useState, useEffect } from 'react';";
const newLine = "import React, { useState, useEffect, useRef, useMemo } from 'react';";

if (content.includes(oldLine)) {
  content = content.replace(oldLine, newLine);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('[PASS] Fixed missing useRef and useMemo imports in ShareholderForm.jsx');
} else {
  console.error('[FAIL] oldLine not found in ShareholderForm.jsx');
  process.exit(1);
}
