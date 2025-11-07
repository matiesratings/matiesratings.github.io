# Maties Rating System Website

A comprehensive web platform for displaying and managing South African Table Tennis player ratings, match results, and tournament information. The system uses an ELO-based rating algorithm to calculate player rankings across multiple categories and divisions.

## Project Overview

This static website serves as the official platform for South African Table Tennis ratings, powered by Maties Table Tennis. It provides real-time access to player rankings, match history, tournament brackets, and detailed player statistics.

## Key Features

### 1. Player Ratings System

**Main Ratings Page (`index.html`)**

- Displays player rankings across 14 different categories:
  - Open Rating (combined)
  - Men's Rating
  - Women's Rating
  - Men's 40+ Rating
  - Men's 50+ Rating
  - Men's 60+ Rating
  - Boys U19, U15, U13, U11
  - Girls U19, U15, U13, U11
- Real-time category switching via dropdown selector
- Displays: Rank, Name, Club, Rating, Games Played, Win Percentage
- Sortable columns (click headers to sort)
- Responsive table design (hides certain columns on mobile)

**Filtering Capabilities:**

- Name search with auto-suggestion dropdown
- Club search with auto-suggestion dropdown
- Rating range filters (slider-based, currently commented out)
- Filter toggle button that doubles as reset
- Filters persist across category changes

**Data Display:**

- Shows top 100 players per category
- Clickable player names link to individual player pages
- Empty state handling ("Results coming soon...")

### 2. Match Results Database

**Matches Page (`matches.html`)**

- Comprehensive match results database
- Category filtering:
  - Open League
  - Men Only League
  - Women Only League
  - Junior Only League
  - Open/Mixed Singles
  - Men's Singles
  - Women's Singles
  - All age group categories (U19, U15, U13, U11 for Boys/Girls)
  - Other/All categories

**Advanced Filtering:**

- Player name search (searches both winner and loser)
- Winner-specific filter with suggestions
- Loser-specific filter with suggestions
- Event name search with suggestions
- Event type dropdown (dynamically populated)
- Province dropdown (dynamically populated)
- Stage dropdown (dynamically populated)

**Table Features:**

- Displays: Match ID, Date, Event Name, Event Type, Category, Province, Stage, Winner, Loser, Score (W-L format)
- Sortable by any column
- Mobile-responsive (hides less critical columns on small screens)
- Clickable player names link to player pages
- Shows most recent 100 matches by default

### 3. Individual Player Pages

**Player Profile (`player.html`)**

- Dynamic player information display:
  - Current rating (large display)
  - Club affiliation
  - Gender
  - Match statistics: Played, Won, Lost, Win Percentage
- Complete match history for the player:
  - All matches where player is winner or loser
  - Sorted by date (most recent first)
  - Same filtering capabilities as main matches page
  - Links to opponent profiles
- URL parameter-based: `player.html?name=PlayerName`
- Handles players with no rating data gracefully

### 4. All Players Directory

**All Players Page (`all_players.html`)**

- Complete directory of all registered players
- Displays: Maties ID, Name, Club, Gender
- Filtering by:
  - Name (with suggestions)
  - Club (with suggestions)
  - Gender (Both/Male/Female dropdown)
- Sortable columns
- Links to individual player pages

### 5. Tournament Bracket Visualization

**Tournament Draws (`draw.html`, tournament-specific pages)**

- **Group Stage Display:**

  - Visual group cards showing all players in each group
  - Player names with club affiliations
  - Clickable player links
  - Responsive grid layout
- **Knockout Bracket Visualization:**

  - Dynamic bracket rendering with SVG connections
  - Supports multiple rounds (R32, R16, QF, SF, Final)
  - Automatically calculates bracket width and spacing
  - Displays match scores when available
  - Handles singles and doubles matches
  - Responsive design with automatic line redrawing on resize
  - Stage headers for each round
- **Group Results:**

  - Displays completed group stage results
  - Organized by group

**Tournament-Specific Features:**

- Maties Open 2025 tournament hub (`tournaments/maties_open/maties_open.html`)
- Separate pages for each event category:
  - Men's Singles
  - U23 Men's Singles
  - Women's Singles
  - Men's 40+ Singles
  - Men's 50+ Singles
  - Men's 60+ Singles
  - Open Doubles
- Tournament information display:
  - Date and location
  - Contact information
  - Schedule PDF download
  - Draw PDF download
- Dynamic view toggles (Groups/Knockouts/Results) based on available data

### 6. Rating System Explanation

**How It Works Page (`explanation.html`)**

- Comprehensive explanation of the ELO rating system
- Embedded YouTube videos explaining the system
- Submission guidelines and templates
- Links to Excel templates for:
  - League Results
  - Tournament Results
  - New Player Registration
- Important notes about:
  - Minimum match requirements (8 matches for visible rating)
  - Inactivity rules (12+ months reset)
  - Submission deadlines (14 days)
  - Club submission limits

### 7. Data Management System

**Python Data Processing (`scr/data/update.py`)**

- CSV to JSON conversion pipeline
- Processes multiple data types:
  - Player ratings (multiple categories)
  - Match results
  - Player lists
  - Club extraction
- Historical data management:
  - Finds latest files by date in filename
  - Maps category names to standardized JSON filenames
  - Handles date-stamped historical files

**Data File Structure:**

- Source CSV files in `scr/data/csv/` (date-stamped)
- Processed JSON files in `scr/data/json/`
- Rating files: `{category}_ratings.json`
- Match data: `matches.json`
- Player directory: `all_players.json`
- Club list: `clubs.json`

**Tournament Data:**

- Tournament-specific JSON files in `tournaments/{tournament}/json/`
- Supports groups, knockouts, and results data structures
- Python scripts for tournament seeding and group generation

### 8. User Interface Features

**Navigation:**

- Responsive header with hamburger menu on mobile
- Consistent navigation across all pages
- Dynamic page titles
- Logo and branding elements

**Search and Suggestions:**

- Auto-complete suggestion boxes for:
  - Player names
  - Club names
  - Event names
  - Winners/Losers
- Click-to-select from suggestions
- Case-insensitive search
- Real-time filtering as you type

**Responsive Design:**

- Mobile-first approach
- Adaptive column visibility (hides less important columns on mobile)
- Flexible table layouts
- Touch-friendly interface elements
- Responsive bracket visualizations

**Visual Design:**

- Consistent color scheme (maroon, black, white)
- South African flag elements
- Table Tennis branding
- Clean, readable typography
- Professional table styling

### 9. Technical Capabilities

**Data Fetching:**

- Client-side JSON data loading
- Error handling for missing files
- Empty state management
- Loading state considerations

**Sorting:**

- Multi-column sorting support
- Toggle ascending/descending
- Maintains sort state per column
- Works with filtered data

**Filtering:**

- Multi-criteria filtering
- Combines multiple filter types
- Real-time filter application
- Reset functionality

**Performance:**

- Limits display to 100 records for performance
- Efficient DOM manipulation
- SVG-based bracket rendering
- Optimized event listeners

## Data Categories Supported

### Rating Categories

1. **Open Rating** - Combined men's and women's ratings
2. **Men's Rating** - Men's only rankings
3. **Women's Rating** - Women's only rankings
4. **Men's Vets 40+** - Men 40 years and older
5. **Men's Vets 50+** - Men 50 years and older
6. **Men's Vets 60+** - Men 60 years and older
7. **Boys U19** - Boys under 19
8. **Girls U19** - Girls under 19
9. **Boys U15** - Boys under 15
10. **Girls U15** - Girls under 15
11. **Boys U13** - Boys under 13
12. **Girls U13** - Girls under 13
13. **Boys U11** - Boys under 11
14. **Girls U11** - Girls under 11

### Match Event Types

- League matches (Open, Men Only, Women Only, Junior Only)
- Tournament matches (Singles, Doubles)
- Provincial competitions
- National competitions
- Club internal events

## File Structure Overview

```
/
├── index.html              # Main ratings page (stays at root for GitHub Pages)
├── pages/                  # HTML pages
│   ├── matches.html        # Match results database
│   ├── player.html         # Individual player profiles
│   ├── all_players.html    # Complete player directory
│   ├── explanation.html    # Rating system explanation
│   ├── draw.html           # Tournament bracket viewer
│   ├── knockout.html       # Knockout bracket (standalone)
│   └── leader.html         # Top players leaderboard
├── components/             # Reusable components (lowercase)
│   ├── header.html         # Site navigation header
│   └── footer.html         # Site footer
├── src/                    # Source files (lowercase)
│   ├── css/                # Stylesheets
│   │   ├── styles.css      # Main stylesheet (imports modules)
│   │   ├── variables.css    # CSS variables
│   │   ├── base.css        # Base styles
│   │   ├── components.css   # Component styles
│   │   ├── utilities.css    # Utility classes
│   │   └── responsive.css  # Responsive styles
│   ├── js/                 # JavaScript modules
│   │   ├── script.js       # Main ratings page logic
│   │   ├── matches.js      # Match results logic
│   │   ├── players.js      # All players page logic
│   │   ├── bracket.js      # Bracket rendering utilities
│   │   ├── draw.js         # Tournament draw logic
│   │   └── utils.js        # Shared utility functions
│   ├── data/
│   │   ├── csv/            # Source CSV files (date-stamped)
│   │   ├── json/           # Processed JSON data files
│   │   └── update.py       # Data processing script
│   └── img/                # Images and logos
├── tournaments/            # Tournament-specific pages (lowercase)
│   └── maties_open/        # Maties Open 2025
│       ├── maties_open.html
│       ├── mens.html
│       ├── womens.html
│       └── json/           # Tournament data files
├── templates/              # Excel templates for submissions
└── scripts/                # Utility scripts

```

## Data Flow

1. **Data Submission**: Clubs submit match results via Excel templates
2. **CSV Processing**: Python script (`update.py`) converts CSV to JSON
3. **Data Storage**: JSON files stored in `src/data/json/`
4. **Frontend Display**: JavaScript fetches JSON and renders in tables/brackets
5. **User Interaction**: Filtering, sorting, and navigation handled client-side

## Key JavaScript Functions

### Rating System (`script.js`)

- `loadSelectedData()` - Loads category-specific rating data
- `displayData()` - Renders player table
- `filterTable()` - Applies filters to displayed data
- `sortTable()` - Handles column sorting
- `updateNameSuggestions()` - Auto-complete for names
- `updateClubSuggestions()` - Auto-complete for clubs

### Match Results (`matches.js`)

- `loadMatchData()` - Fetches all match data
- `applyFilters()` - Multi-criteria filtering
- `populateDropdowns()` - Dynamic filter options
- `updateEventSuggestions()` - Event name suggestions

### Tournament Brackets (`draw.js`)

- `renderGroups()` - Displays group stage
- `renderKnockouts()` - Renders knockout bracket
- `renderGroupResults()` - Shows completed group results
- `drawLines()` - SVG bracket connections
- `adjustBracketWidth()` - Responsive bracket sizing

### Player Profiles (`player.html` inline)

- `loadPlayerInfo()` - Fetches player rating data
- `loadMatchData()` - Gets player's match history
- Filtering and sorting for match history

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Responsive design tested on various screen sizes
- No framework dependencies (vanilla JavaScript)

## Analytics

- Google Analytics integration (G-D3SNXPPJWG)
- Tracks page views and user interactions
- Loaded on all main pages

## Future Enhancement Possibilities

The system architecture supports:

- Additional tournament categories
- New rating categories
- Enhanced statistics (head-to-head records, streaks)
- Export functionality (CSV, PDF)
- Advanced filtering combinations
- Pagination for large datasets
- Player comparison tools
- Historical rating graphs
- Tournament management features

## Maintenance Notes

- Update CSV files in `scr/data/csv/` with date stamps
- Run `update.py` to regenerate JSON files
- Tournament JSON files follow specific structure (groups/knockouts/results)
- All player names should be consistent across files
- Club names should match exactly for filtering to work
- Rating calculations handled externally (not in this codebase)
