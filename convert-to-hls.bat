@echo off
title ZeroEducators - HLS Video Converter
color 0A
cls

echo ========================================================
echo         ZeroEducators - Video to HLS Converter
echo ========================================================
echo.

if "%~1"=="" (
    node "%~dp0converter\convert-hls.js"
) else (
    node "%~dp0converter\convert-hls.js" "%~1"
)

pause
