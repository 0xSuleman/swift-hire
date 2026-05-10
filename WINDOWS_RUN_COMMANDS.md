# SwiftHIre Windows Run Commands

Use these commands from PowerShell unless a section says otherwise.

## 1. Prerequisites

Install these first:

```powershell
winget install EclipseAdoptium.Temurin.17.JDK
winget install Apache.Maven
winget install OpenJS.NodeJS.LTS
winget install Oracle.MySQL
```

Close and reopen PowerShell after installing so `java`, `mvn`, `node`, `npm`, and `mysql` are available in `PATH`.

Check versions:

```powershell
java -version
mvn -version
node -v
npm -v
mysql --version
```

## 2. Go To Project

Replace the path with your local SwiftHIre folder:

```powershell
cd C:\path\to\SwiftHIre
```

## 3. Start MySQL

If MySQL is installed as a Windows service:

```powershell
net start MySQL80
```

If the service name is different, list MySQL services:

```powershell
Get-Service *mysql*
```

Then start the matching service:

```powershell
net start <service-name>
```

## 4. Create Database And App User

Log in as MySQL root:

```powershell
mysql -u root -p
```

Run these SQL commands inside the MySQL prompt:

```sql
CREATE DATABASE IF NOT EXISTS swift_hire;
CREATE USER IF NOT EXISTS 'swifthire'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON swift_hire.* TO 'swifthire'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

Verify the app user works:

```powershell
mysql -u swifthire -p -e "SELECT 1;"
```

When prompted, enter:

```text
your_password
```

## 5. Seed Demo Data And Admin Account

Run this once after the database exists:

```powershell
mysql -u swifthire -p swift_hire < seed.sql
```

Admin login:

```text
admin@swifthire.com
Admin@1234
```

## 6. Start Backend

Open a new PowerShell terminal:

```powershell
cd C:\path\to\SwiftHIre\backend
$env:MYSQLUSER = "swifthire"
$env:MYSQLPASSWORD = "your_password"
mvn spring-boot:run
```

Backend URL:

```text
http://localhost:8080
```

## 7. Start Frontend

Open another PowerShell terminal:

```powershell
cd C:\path\to\SwiftHIre\frontend
npm install
npm run dev
```

Frontend URL is usually:

```text
http://localhost:5173
```

If port `5173` is already busy, Vite will print another URL such as:

```text
http://localhost:5174
```

Use the URL printed by Vite.

## 8. Verify Backend

In another PowerShell terminal:

```powershell
curl.exe -s http://localhost:8080/api/auth/login `
  -X POST `
  -H "Content-Type: application/json" `
  -d "{\"email\":\"test@test.com\",\"password\":\"test\"}"
```

Expected response:

```json
{"success":false,"message":"Unregistered email, please register first."}
```

## 9. One-Time CMD Alternative

If you use Command Prompt instead of PowerShell, start the backend like this:

```cmd
cd C:\path\to\SwiftHIre\backend
set MYSQLUSER=swifthire
set MYSQLPASSWORD=your_password
mvn spring-boot:run
```

Start the frontend in another Command Prompt:

```cmd
cd C:\path\to\SwiftHIre\frontend
npm install
npm run dev
```
