# Copilot Instructions

## Project Context
- **Type:** Generic
- **Language:** Unknown
- **Root:** cda

## Project Structure
```
cda/
├── CHANGELOG.md
├── INSTALL.txt
├── README.md
├── admin.html
├── api/
│   ├── config.php
│   ├── db_config.php
│   ├── images.php
│   └── leaderboard.php
├── cda.code-workspace
├── contesto.md
├── css/
│   └── style.css
├── data/
│   ├── config.json
│   ├── images.json
│   └── leaderboard.json
├── db.sql
├── favicon.svg
└── index.html
└── ... (7 more)
```

## Architecture Diagram
```mermaid
graph TD
    cda[🏠 cda]
    cda --> cda_CHANGELOG_md[📝 CHANGELOG.md]
    cda --> cda_INSTALL_txt[📄 INSTALL.txt]
    cda --> cda_README_md[📝 README.md]
    cda --> cda_admin_html[🌐 admin.html]
    cda --> cda_api[📁 api]
    cda_api --> cda_api_config_php[🐘 config.php]
    cda_api --> cda_api_db_config_php[🐘 db_config.php]
    cda_api --> cda_api_images_php[🐘 images.php]
    cda_api --> cda_api_leaderboard_php[🐘 leaderboard.php]
    cda --> cda_cda_code_workspace[📄 cda.code-workspace]
    cda --> cda_contesto_md[📝 contesto.md]
    cda --> cda_css[📁 css]
    cda_css --> cda_css_style_css[🎨 style.css]
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
