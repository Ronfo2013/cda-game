# Copilot Instructions

## Project Context
- **Type:** Generic
- **Language:** Unknown
- **Root:** 100giorni-game

## Project Structure
```
100giorni-game/
├── 100giorni-game.code-workspace
├── INSTALL.txt
├── README.md
├── admin.html
├── api/
│   ├── config.php
│   ├── db_config.php
│   ├── images.php
│   └── leaderboard.php
├── css/
│   └── style.css
├── data/
│   └── leaderboard.json
├── db.sql
├── favicon.svg
├── index.html
├── js/
│   ├── audio.js
│   ├── config.js
│   ├── game.js
│   ├── leaderboard.js
│   └── main.js
└── progress.md
└── ... (1 more)
```

## Architecture Diagram
```mermaid
graph TD
    100giorni_game[🏠 100giorni-game]
    100giorni_game --> 100giorni_game_100giorni_game_code_workspace[📄 100giorni-game.code-workspace]
    100giorni_game --> 100giorni_game_INSTALL_txt[📄 INSTALL.txt]
    100giorni_game --> 100giorni_game_README_md[📝 README.md]
    100giorni_game --> 100giorni_game_admin_html[🌐 admin.html]
    100giorni_game --> 100giorni_game_api[📁 api]
    100giorni_game_api --> 100giorni_game_api_config_php[🐘 config.php]
    100giorni_game_api --> 100giorni_game_api_db_config_php[🐘 db_config.php]
    100giorni_game_api --> 100giorni_game_api_images_php[🐘 images.php]
    100giorni_game_api --> 100giorni_game_api_leaderboard_php[🐘 leaderboard.php]
    100giorni_game --> 100giorni_game_css[📁 css]
    100giorni_game_css --> 100giorni_game_css_style_css[🎨 style.css]
    100giorni_game --> 100giorni_game_data[📁 data]
    100giorni_game_data --> 100giorni_game_data_leaderboard_json[📋 leaderboard.json]
    100giorni_game --> 100giorni_game_db_sql[📄 db.sql]
```

## Key Files
- `README.md`

## Code Style
- Follow existing code patterns in this project
- Use modern syntax and best practices
- Prefer explicit types over implicit
- Match indentation and formatting of existing code

## Rules
- Don't suggest deprecated APIs
- Keep responses concise
- When modifying code, preserve existing structure
- Suggest tests when adding new functions
