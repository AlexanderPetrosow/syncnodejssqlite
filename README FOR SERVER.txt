1) Установка node js, mysql последней версии с помощью chocolatey

1.1) При установке майскуля очень нужно добавить пользователей в mysql, диалоговое окно подскажет
user       root 
password   pass


user       ext_user
password   pass

1.2) Выполнить этот запрос в новом окне mysql. Это создание главной базы: 
CREATE DATABASE `main` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

CREATE TABLE `comments` (
  `lref` int NOT NULL AUTO_INCREMENT,
  `order_ref` int NOT NULL DEFAULT '0',
  `prefix` varchar(200) DEFAULT NULL,
  `delay` varchar(200) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  `perc_val` float DEFAULT NULL,
  PRIMARY KEY (`lref`,`order_ref`)
) ENGINE=InnoDB AUTO_INCREMENT=0 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


CREATE TABLE `orders` (
  `logicalref` int NOT NULL AUTO_INCREMENT,
  `ipAddress` text,
  `databasePath` text,
  `ID` int DEFAULT NULL,
  `exOrderID` text,
  `Coin` text,
  `BuyDate` int DEFAULT NULL,
  `SellSetDate` int DEFAULT NULL,
  `CloseDate` int DEFAULT NULL,
  `Quantity` float DEFAULT NULL,
  `BuyPrice` float DEFAULT NULL,
  `SellPrice` float DEFAULT NULL,
  `SpentBTC` float DEFAULT NULL,
  `GainedBTC` float DEFAULT NULL,
  `ProfitBTC` float DEFAULT NULL,
  `Source` int DEFAULT NULL,
  `Channel` int DEFAULT NULL,
  `ChannelName` text,
  `Status` int DEFAULT NULL,
  `Comment` text,
  `BaseCurrency` int DEFAULT '0',
  `BoughtQ` float DEFAULT NULL,
  `BTC1hDelta` float DEFAULT NULL,
  `Exchange1hDelta` float DEFAULT NULL,
  `SignalType` text,
  `SellReason` text,
  `FName` text,
  `deleted` int DEFAULT '0',
  `Emulator` int DEFAULT '0',
  `Imp` int DEFAULT '0',
  `BTC24hDelta` float DEFAULT '0',
  `Exchange24hDelta` float DEFAULT '0',
  `bvsvRatio` float DEFAULT '0',
  `BTC5mDelta` float DEFAULT '0',
  `IsShort` int DEFAULT '0',
  `Pump1H` float DEFAULT '0',
  `Dump1H` float DEFAULT '0',
  `d24h` float DEFAULT '0',
  `d3h` float DEFAULT '0',
  `d1h` float DEFAULT '0',
  `d15m` float DEFAULT '0',
  `d5m` float DEFAULT '0',
  `d1m` float DEFAULT '0',
  `dBTC1m` float DEFAULT '0',
  `PriceBug` float DEFAULT '0',
  `Vd1m` float DEFAULT '0',
  `Lev` int DEFAULT '1',
  `hVol` float DEFAULT '0',
  `hVolF` float DEFAULT '0',
  `dVol` float DEFAULT '0',
  `TaskID` int DEFAULT '0',
  PRIMARY KEY (`logicalref`),
  UNIQUE KEY `logicalref` (`logicalref`)
) ENGINE=InnoDB AUTO_INCREMENT=0 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


CREATE TABLE `btcusdt` (
  `idbtcusdt` int NOT NULL AUTO_INCREMENT,
  `btcusdtrate` decimal(10,5) NOT NULL,
  PRIMARY KEY (`idbtcusdt`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;



1.3) Скопируйте все процедуры из первого сервера. Сюда не вставляю так как очень много строк, Для этого в программе WorkBranch правой кнопкой мыши по Stored Procedures - copy to clipboard - create statement далее -
Перейдите в новый сервер Workbranch и выполните скопированный код в окне запроса  (выполняет в окне кода sql workbranch. Нажать на иконку +SQL)

1.4) Установить расписание запуска процедур (выполняет в окне кода sql workbranch. Нажать на иконку +SQL)

DELIMITER $$

CREATE EVENT IF NOT EXISTS Event_UpdateTempEmaView
ON SCHEDULE EVERY 1 HOUR
STARTS CURRENT_TIMESTAMP
DO 
CALL UpdateTempEmaView();
CALL UpdateTempBtcView();
CALL UpdateTempMinView();
CALL UpdateTempMaxView();
CALL UpdateTempMAvgView();
$$

DELIMITER ;


2) Создаём папку C:\Soft\NodeJsProg

	cd C:\Soft
	mkdir NodeJsProg


3) Скачиваем с гитхаба в эту папку файл index.js, pars.js   


	cd C:\Soft\NodeJsProg

	curl -L -o index.js "ссылка на гитхаб файл index.js"
	curl -L -o pars.js "ссылка на гитхаб файл pars.js"

если необходимо в этих файлах измените айпи адреса машины и логины пароли к базе или апи

Не выходя из этой папки
4) Выполняем инициализацию npm init -y

5) Установка зависимостей: npm install express basic-auth sqlite3 fs-extra express-basic-auth axios fs mysql mysql2

5.1) открытие порта 8443 

cmd

netsh advfirewall firewall add rule name="Open Port 8443" dir=in action=allow protocol=TCP localport=8443

6) Устанавливаем софт для запуска сервиса:

	curl -L -o nssm.zip  https://nssm.cc/release/nssm-2.24.zip

	mkdir nssm

	распоковать содержимое в папку C:\Soft\NodeJsProg\nssm

	cd C:\Soft\NodeJsProg\nssm\win64\

	.\nssm.exe install WinAPI "C:\Program Files\nodejs\node.exe" "C:\Soft\NodeJsProg\index.js"
	.\nssm.exe start WinAPI 
.\nssm.exe restart WinAPI 
	.\nssm.exe status WinAPI 


7) расписание для запуска парсинга, каждые 3 минуты сканирует на новые записи и если есть парсит
schtasks /create /sc minute /mo 3 /tn "RunParsComments" /tr "node C:\Soft\NodeJsProg\pars.js"
schtasks /change /tn "RunParsComments" /ru SYSTEM



8) Представления вы можете перенести также как и процедуры




