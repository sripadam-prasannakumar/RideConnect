@echo off
RMDIR /Q /S "frontend_project\rideconnect\.git"
git add .
git commit -m "Initialize repository with frontend and backend projects, and tracking map fixes"
git branch -M main
git remote add origin https://github.com/sripadam-prasannakumar/RideConnect.git
git push -u origin main --force
