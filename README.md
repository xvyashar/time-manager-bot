# Time Manager Bot
This bot is made for handling your focus cycle with your friends and have fun with each other!

## How This Bot Works
This bot have to be joined to your group and converted to an admin to start its work as your time manager. It'll recieve a config from group admin that you specify your timezone UTC offset like: `+3:30`, your focus days, cycle, and cycle foucs and rest times. for example:
```plain
+3:30 (UTC offset)
mon,tue,wed,thu,fri (weekdays in first 3 words format)
16:00-18:00,20:00-21:00 (cycles life times)
30m-10m,45m-15m,1h-30m (each cycle focus and rest time)
```
> The above configuration will works in tehran timezone and in specified weekdays, it'll start blocking the group at 16:00 as start of cycle then it will be opend after 30 minutes just for 10 minutes as rest time and it will continue to other cycles and then seek back to the first of the cycle till a cycle life time finished (in this case 18:00) then it will start doing it again at 20:00

## Quick Start
- This bot used Mongodb so you have to install this on your machine
- create an `.env` file in project root folder, then add these 2 variable: `DATABASE_URL`, `BOT_TOKEN`
- `npm i`
- `npm start` (you are ready to go)

## Contribution Guide
Feel free to open issues and share me your opinions and new ideas, or pick one of issues, try to work on it and open a pull request, assign me as reviewer to apply your changes
