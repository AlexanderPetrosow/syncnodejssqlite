1) Установка node js последней версии с помощью chocolatey

2) Создаём папку C:\Soft\NodeJsProg

cd C:\Soft
mkdir NodeJsProg

3) Скачиваем с гитхаба в эту папку файл sendJson.js

cd C:\Soft\NodeJsProg
curl -L -o sendJson.js "ссылка на гитхаб файл"

если необходимо то меняем айпи адреса и логин пароль апи внутри файла


Не выходя из этой папки 
4) Выполняем инициализацию npm init -y

5) Установка зависимостей: npm install express basic-auth sqlite3 qckwinsvc fs-extra express-basic-auth axios 

6) Устанавливаем расписание отправки 

schtasks /create /sc minute /mo 10 /tn "RunNodeScript" /tr "node C:\Soft\NodeJsProg\sendJson.js"
schtasks /change /tn "RunNodeScript" /ru SYSTEM