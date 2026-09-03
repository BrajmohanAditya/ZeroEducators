//    Command to change .env of frontend and restart server 
cd ~/Desktop
ssh -i mern-key.pem ubuntu@13.60.23.20    
pm2 restart tejas-backend

Press Ctrl + O
Press Enter
Press Ctrl + X

> after changing .env of frontend you have to run these command in bash 

npm run build
sudo rm -rf /var/www/html/*
sudo cp -r dist/* /var/www/html/
sudo systemctl restart nginx
//