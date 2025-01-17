# Introduction

The purpose of this project is 2-fold

- First React project after learning the language a week before.
- I was fed up with the timetracking UI of ClickUp, as it was horribly slow and cumbersome.

# Functionality & Limitations

- UI with calender view where you can select a project you worked on and drag-drop it in the calender to assign time to it.
- Filter by tag (e.g. you team or customer that was assigned to tickets).
- It's quite specific for the way ClickUp was setup in Brainnwave. It won't be usable out-of-the-box.

# Usage

- Set CLICKUP_API_KEY environment variable to your ClickUp API key.
- Run `make start` to start the server.
- Visit http://localhost:8765/ to see the app.

# Limitations

- Specific for the Brainnwave ClickUp workspaces as of 8 November 2023.
- Tasks won't be updated in real time. You need to refresh the page, or possibly restart the server to see the latest changes (e.g. when you get assigned to a ticket after the server has started, it won't show up in 'Mine only' tickets).
- Archived tickets are a bit broken (could be ClickUp bug).
- No tests.
- Not necessarily best coding practices; it's a quick hack.
- Some dead code in server.py
- More...
