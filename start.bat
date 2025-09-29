@echo off
echo Installing dependencies...
npm install

echo Starting Journal-Mate server...
node server.js
pause