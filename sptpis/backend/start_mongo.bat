@echo off
echo ===================================================
echo     TNSTC SMART TRANSPORT - LOCAL MONGODB RUNNER
echo ===================================================

if exist "mongodb-windows-x86_64-7.0.5\bin\mongod.exe" goto RUN_MONGO

echo [1/3] Downloading Portable MongoDB Server for Windows...
curl -L -o mongodb.zip https://fastdl.mongodb.org/windows/mongodb-windows-x86_64-7.0.5.zip

echo [2/3] Extracting MongoDB binaries (This might take a minute)...
powershell -Command "Expand-Archive -Path 'mongodb.zip' -DestinationPath '.' -Force"

echo [3/3] Setting up local database storage folder...
mkdir mongodata

:RUN_MONGO
echo [SUCCESS] Starting Local MongoDB Server!
echo The database is running locally at: mongodb://127.0.0.1:27017
echo Keep this window open while testing the Depot Dashboard!
echo.
mongodb-windows-x86_64-7.0.5\bin\mongod.exe --dbpath mongodata
