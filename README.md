# Baby Logbook

I want to build a mobile app tracker called Baby log where I can easily log and track activities related to my new baby. Ask me any questions you need to fully understand what I want from this feature and how I envision it.  Also recommend any connectors I should be using to do this effectively. 

HOME PAGE/LANDING PAGE: 

The hero actions are to 'log' and 'view day' which should be what is on the home page. 

Log: 
1. I can select one of a few activities that I want to log. 
2. For each activity, there should be a tile that has an icon and a label for the activity. Choose an icon that describes the activity. 
3. Each activity is either instantaneous or a start/stop event. If it's instantaneous, give me a few fields to fill out when logging. Once I fill out the fields, record that activity. If it's start/stop, give me a few fields to fill out. Once i'm done, start a timer. I may choose to start the timer and then fill out the fields while the timer is on - give me that option. 
4. When an activity is logged, log the date/time and the answer to all the fields. 
5. If I long-press on the tile for the activity, give me an option to change its settings. In the settings I should be able to add/remove fields for that activity and change its type from instantaneous to start/stop and vice versa. 

View day:
1. This is a calendar view that shows what activities have happened that day. Color code/icon code the activities so its easy for me to quickly see what has happened. 
2. The entries in the calendar view should be clickable - when i click on an individual entry it should show me more details of that log that I entered when I made that entry. 
3. I should also be able to click on a button on that widget called 'View all days' and step into a calendar view where I can scroll across days to see the logs. 

OTHER PAGES: 
With a hamburger menu I should be able to navigate to other pages on the app as well: 
1. Calendar: which is the same as the 'View all days' that we could navigate from the View day widget on the home page. 
2. Insights: Create charts to showcase the trends from the logs entered. Provide suggested trends on the page for me to add, allow me to delete any that have already been added, and allow me to describe what trend i want to see through a chatbot interaction on that page 
3. Activities: This page has a list of activities on the home page and their corresponding attributes like fields associated with that activity and whether it is instantaneous or start/stop. This page allows me to: edit activities, add new ones, delete existing ones. It also has a toggle next to each activity that allows me to show or hide it - when i turn the toggle to hide, the underlying information stays stored but that activity is not visible on the home page for logging or in the calendar or insights views.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://newbornlog.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/d8a16259-5d4c-45b7-ba1b-9d10fb3d29aa).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
