@echo off
setlocal enabledelayedexpansion
set ARCHIVE=C:\test\file.sqlite.gz
echo 1
set FNAME=!ARCHIVE!
echo 2
echo !FNAME!
echo 3
if /i "!FNAME:~-3!"==".gz" echo is gz
echo 4
