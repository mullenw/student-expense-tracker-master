How I used GitHub Copilot:
I used GitHub Copilot to help map out parts of my React Native code. Including my SQLite setup, helper functions, and the structure for integrating a chart. Copilot helped me to quickly generate repetitive coding patterns. It helped the most with the filtering logic and database queries.

Suggestion I rejected or changed:
Copilot suggested multiple chart integrations using react-native-svg and victory-native that seemed good. However, they were not compatible with Expo Go. Since Expo Go does not load local native modules, these suggestions caused errors. I edited the code by adjusting the import structure and adding an error message so the rest of the app could run smoothly without crashing.

Where Copilot saved time:
Copilot helped to speed up formatting the UI and organizing repeated components such as the list items and input fields. It also helped me to generate the initial bar chart structure. It also saved me a lot of time coding the category totals. It gave me more time to focus on debugging and solve the compatibilty issues.