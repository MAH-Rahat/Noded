# Requirements Document

## Introduction

NodedAlright is a full-stack personal hub web application — a single-screen, all-in-one dashboard built on a monolithic architecture using FastAPI (Python), PostgreSQL, and React + TypeScript. The UI follows a "Boss-Level Minimal" design system: a Bento Box Grid layout with a deep dark palette, crisp typography, and a single bold accent color.

The application is composed of four core modules:
1. The Ledger — financial tracking and visualization
2. The Routine & Relay — to-do list and habit tracker
3. The Canvas — distraction-free markdown notes
4. The Vault — encrypted storage for sensitive data and snippets

---

## Glossary

- **System**: The NodedAlright full-stack web application
- **Frontend**: The React + TypeScript single-page application
- **Backend**: The FastAPI Python server
- **Database**: The PostgreSQL relational database
- **Ledger**: The financial dashboard module
- **Routine_Relay**: The to-do and habit tracking module
- **Canvas**: The markdown notes module
- **Vault**: The encrypted personal data and snippets module
- **Bento_Grid**: The CSS Grid-based dashboard layout, optimized for mobile screens first with a multi-column enhancement for desktop viewports
- **Primary_Font**: Space Grotesk or Syne — the bold, geometric UI font used for all interface text
- **Task**: A to-do or habit item managed by the Routine_Relay
- **Note**: A markdown document managed by the Canvas
- **Transaction**: A financial income or expense record managed by the Ledger
- **Snippet**: A sensitive text entry, API key, or personal ID stored in the Vault
- **Vault_Session**: An authenticated, time-limited access window to the Vault after PIN/password re-entry
- **Rollover_Job**: The FastAPI background task that processes incomplete Tasks at midnight
- **Accent_Color**: The single bold highlight color (Electric Blue or Neon Green) used for interactive elements
- **PIN**: A numeric or alphanumeric secret used to authenticate access to the Vault
- **Donut_Chart**: A circular chart with a hollow center used to display proportional data by category
- **Bar_Chart**: A rectangular bar chart used to display comparative values across time periods
- **Sparkline**: A compact, inline mini line-chart rendered without axes or labels, used to show a trend at a glance
- **Radial_Progress_Ring**: A circular SVG or canvas ring that fills proportionally to represent a percentage value
- **Heatmap_Calendar**: A grid of colored cells representing daily activity intensity over a date range, styled similarly to GitHub's contribution graph
- **Streak_Counter**: A numeric display showing the count of consecutive days on which all Tasks were completed
- **Count_Up_Animation**: A JavaScript-driven animation that increments a numeric display from zero to its final value on mount
- **Skeleton_Loader**: A placeholder UI element rendered in the shape of the expected content while data is being fetched
- **Empty_State_Illustration**: A minimal line-art SVG graphic displayed when a module contains no data
- **Global_Stats_Bar**: A compact horizontal strip fixed at the top of the viewport displaying key real-time summary metrics
- **Note_Tag**: A user-defined colored label attached to a Note for visual categorization
- **Snippet_Type_Icon**: A distinct icon rendered on a Snippet card to indicate the category of the stored secret (API key, password, or personal ID)
- **Category_Badge**: A styled pill or chip element rendered on a Snippet card to display its assigned category
- **Page_Transition**: A CSS or JavaScript animation applied when navigating between full-screen views (e.g., entering or exiting Canvas writing mode)
- **Login_Page**: A dedicated full-screen view rendered before authentication, containing the login form
- **Register_Page**: A dedicated full-screen view containing the registration form with fields for username, email, password, and confirm password
- **Auth_Card**: The centered card container rendered on the Login_Page and Register_Page, styled with the dark design system
- **Remember_Me**: A toggle on the login form that, when enabled, extends JWT persistence in localStorage beyond the browser session
- **Search_Overlay**: A floating panel rendered over the dashboard that displays grouped search results from Notes, Tasks, and Transactions
- **Export_Menu**: A dropdown or context menu accessible from a module card header that exposes data export actions
- **Push_Notification**: A browser-delivered alert sent via the Web Push API to remind the user of a scheduled Task
- **Notification_Permission**: The browser permission state for receiving push notifications — one of: `granted`, `denied`, or `not_asked`
- **Onboarding_Overlay**: A multi-step modal displayed to first-time users immediately after registration to introduce the app's modules
- **PWA**: Progressive Web App — a web application configured with a manifest and service worker to support installation and offline access
- **Service_Worker**: A background script registered by the Frontend that intercepts network requests and manages caching for offline support
- **App_Shell**: The minimal set of HTML, CSS, JS, and font assets cached by the Service_Worker to enable offline rendering
- **Budget_Limit**: A user-defined monthly spending cap set per category in the Ledger
- **Budget_Progress_Bar**: A horizontal bar rendered per category in the Ledger transaction list showing the ratio of spent amount to Budget_Limit
- **Pinned_Note**: A Note marked by the user to always appear at the top of the Canvas note list
- **Token_Blocklist**: A server-side store of invalidated JWTs used to prevent reuse after logout
- **Password_Reset_Token**: A time-limited, single-use token generated by the Backend and delivered via email to authenticate a password reset request

---

## Requirements

### Requirement 1: Dashboard Layout

**User Story:** As a user, I want a mobile-first personal hub dashboard, so that I can access all four modules comfortably on my phone with an enhanced multi-column layout on desktop.

#### Acceptance Criteria

1. THE Frontend SHALL render all four modules (Ledger, Routine_Relay, Canvas, Vault) in a single-column stacked layout as the default (mobile-first) presentation.
2. WHEN the viewport width is 768px or wider, THE Frontend SHALL enhance the layout into a multi-column CSS Grid Bento_Grid arrangement.
3. THE Bento_Grid SHALL use slightly rounded card corners and a surface color of Matte Dark Gray (#1A1C23) for each module card.
4. THE Frontend SHALL render the page background using #000000 or Deep Gunmetal (#0F1115).
5. THE Frontend SHALL render all body text in high-contrast white or muted silver.
6. THE Frontend SHALL apply the Accent_Color exclusively to submit buttons, active Routine_Relay toggles, and Ledger graph lines.
7. THE Frontend SHALL use Space Grotesk or Syne as the Primary_Font for all UI text, and JetBrains Mono for financial numbers and code blocks.
8. THE Frontend SHALL render a Global_Stats_Bar as a compact horizontal strip at the top of the viewport displaying: current date, total Notes count, number of Tasks completed today, and current account balance.
9. WHEN data for the Global_Stats_Bar is being fetched, THE Frontend SHALL render Skeleton_Loader placeholders for each metric within the strip.
10. WHEN navigating between full-screen views, THE Frontend SHALL apply a Page_Transition consisting of a simultaneous fade and slight upward slide animation with a duration not exceeding 300ms.
11. WHEN a module card is loading data, THE Frontend SHALL render Skeleton_Loader elements matching the shape and dimensions of the expected content within that card.
12. WHEN a module contains no data, THE Frontend SHALL render an Empty_State_Illustration in a minimal line-art style centered within the module card.

---

### Requirement 2: The Ledger — Financial Dashboard

**User Story:** As a user, I want to log and visualize my income and expenses, so that I can track my monthly financial burn rate at a glance.

#### Acceptance Criteria

1. THE Database SHALL maintain an `incomes` table, an `expenses` table, and a `categories` table to store all financial records.
2. WHEN a user submits a new transaction, THE Backend SHALL validate the amount, category, and date fields before persisting the Transaction to the Database.
3. IF a submitted transaction contains a missing or invalid amount, THEN THE Backend SHALL return an HTTP 422 response with a descriptive validation error.
4. THE Backend SHALL expose a paginated endpoint that returns Transactions sorted by date in descending order.
5. THE Frontend SHALL render a line graph in the top-right area of the Ledger card showing monthly burn rate (total expenses minus total income per calendar month) using Recharts.
6. THE Frontend SHALL render the Ledger graph line using the Accent_Color.
7. THE Frontend SHALL render a typed list of recent Transactions below the graph, displaying amount, category, and date for each entry using JetBrains Mono for numeric values.
8. WHEN a user deletes a Transaction, THE Backend SHALL remove the record from the Database and THE Frontend SHALL update the graph and transaction list without a full page reload.
9. THE Frontend SHALL render a Donut_Chart within the Ledger card displaying expense breakdown by category, with each category segment rendered in a distinct color.
10. THE Frontend SHALL render a Bar_Chart within the Ledger card displaying total income and total expenses as side-by-side bars for each calendar month.
11. WHEN the Ledger card mounts, THE Frontend SHALL animate the total balance, total income, and total expenses figures using a Count_Up_Animation that increments each value from zero to its final amount.
12. THE Frontend SHALL render a Sparkline adjacent to each Transaction category row in the list, showing that category's spending trend over the most recent 6 data points.
13. THE Frontend SHALL render each income Transaction row with a green tint background and each expense Transaction row with a red tint background within the transaction list.

---

### Requirement 3: The Routine & Relay — To-Do and Habit Tracker

**User Story:** As a user, I want to manage daily tasks and habits with a visual timeline, so that I can track my progress and stay consistent.

#### Acceptance Criteria

1. THE Frontend SHALL render Tasks in a vertical timeline layout on the left side of the Routine_Relay card, with a checkbox and label for each Task.
2. THE Frontend SHALL render a progress bar within the Routine_Relay card reflecting the ratio of completed Tasks to total Tasks for the current day.
3. THE Frontend SHALL apply the Accent_Color to the progress bar fill and to the checkbox toggle of active (completed) Tasks.
4. WHEN a user checks a Task, THE Frontend SHALL update the Task state to `completed` and THE Backend SHALL persist the state change to the Database.
5. WHEN a user reorders Tasks via drag-and-drop, THE Frontend SHALL update the display order immediately and THE Backend SHALL persist the new order to the Database.
6. THE Frontend SHALL manage Task state transitions using a TypeScript state machine with the states: `pending`, `completed`, and `delayed`.
7. WHEN the Rollover_Job executes at midnight, THE Backend SHALL set all Tasks with state `pending` from the previous day to state `delayed` and create new `pending` copies for the current day.
8. IF the Rollover_Job fails to execute, THEN THE Backend SHALL log the error with a timestamp and retry the job at the next scheduled interval.
9. WHEN a user creates a new Task, THE Backend SHALL validate that the title field is non-empty before persisting the Task to the Database.
10. IF a Task creation request contains an empty title, THEN THE Backend SHALL return an HTTP 422 response with a descriptive error.
11. THE Frontend SHALL render a Radial_Progress_Ring prominently at the top of the Routine_Relay card displaying the percentage of Tasks completed for the current day, with the ring fill using the Accent_Color.
12. THE Frontend SHALL render a Heatmap_Calendar within the Routine_Relay card showing Task completion history for the past 30 days, with each day cell colored at a higher intensity when all Tasks were completed on that day.
13. WHEN a user marks a Task as completed, THE Frontend SHALL display an animated checkmark micro-animation on the completed Task row with a duration not exceeding 400ms.
14. THE Frontend SHALL render a Streak_Counter within the Routine_Relay card displaying the number of consecutive days on which all Tasks were completed.

---

### Requirement 4: The Canvas — Notes App

**User Story:** As a user, I want to write and save markdown notes in a distraction-free environment, so that I can capture ideas and information cleanly.

#### Acceptance Criteria

1. THE Frontend SHALL render a list of Note titles within the Canvas card on the Bento_Grid.
2. WHEN a user clicks a Note, THE Frontend SHALL transition to a full-screen writing mode by fading out the Bento_Grid and rendering only the Note editor.
3. WHEN a user exits full-screen writing mode, THE Frontend SHALL fade the Bento_Grid back in and restore the previous layout state.
4. THE Frontend SHALL parse the raw markdown content of a Note into rendered HTML in real-time as the user types, displaying a live preview.
5. WHEN a user saves a Note, THE Backend SHALL persist the raw markdown text to a `TEXT` column in the Database without transformation.
6. THE Backend SHALL expose endpoints to create, read, update, and delete Notes.
7. IF a Note save request contains an empty body, THEN THE Backend SHALL return an HTTP 422 response with a descriptive error.
8. WHEN a user deletes a Note, THE Backend SHALL remove the record from the Database and THE Frontend SHALL remove the Note from the title list without a full page reload.
9. THE Frontend SHALL render Note content using JetBrains Mono within code blocks inside the markdown preview.
10. THE Frontend SHALL render each Note as a card in a grid view within the Canvas module, displaying the first two lines of the Note's content as a visual preview snippet.
11. THE Frontend SHALL render a Note_Tag colored dot indicator on each Note card corresponding to the tag assigned to that Note.
12. THE Frontend SHALL render the word count and estimated reading time (calculated at 200 words per minute) on each Note card.
13. THE Backend SHALL persist a Note_Tag label and color value alongside each Note record in the Database.
14. WHEN a user assigns or changes a Note_Tag, THE Backend SHALL update the tag fields for that Note and THE Frontend SHALL reflect the updated tag color on the Note card without a full page reload.

---

### Requirement 5: The Vault — Encrypted Personal Data & Snippets

**User Story:** As a user, I want to store sensitive text, API keys, and personal IDs in an encrypted vault, so that my private data is protected at rest.

#### Acceptance Criteria

1. THE Vault card SHALL render as a locked section of the Bento_Grid, displaying no Snippet content until the user authenticates.
2. WHEN a user attempts to access the Vault, THE Frontend SHALL prompt the user to re-enter their PIN or password before revealing any Snippet content.
3. WHEN a user submits a correct PIN or password, THE Backend SHALL create a Vault_Session with a fixed expiry of 15 minutes and return a session token to the Frontend.
4. WHEN a Vault_Session expires, THE Frontend SHALL lock the Vault card and require re-authentication before displaying Snippet content.
5. WHEN a user saves a Snippet, THE Backend SHALL encrypt the Snippet content using the Python `cryptography` library (Fernet symmetric encryption) before persisting the ciphertext to the Database.
6. THE Database SHALL store only the ciphertext of Snippet content; plaintext SHALL never be written to the Database.
7. WHEN a user retrieves a Snippet during an active Vault_Session, THE Backend SHALL decrypt the ciphertext and return the plaintext to the Frontend over HTTPS.
8. IF a user submits an incorrect PIN or password 5 consecutive times, THEN THE Backend SHALL lock the Vault for 10 minutes and return an HTTP 429 response.
9. WHEN a user deletes a Snippet, THE Backend SHALL permanently remove the ciphertext record from the Database.
10. THE Backend SHALL store the encryption key outside the Database, in an environment variable or secrets manager, never in source code.
11. THE Frontend SHALL render a Snippet_Type_Icon on each Snippet card: a key icon for API key Snippets, a lock icon for password Snippets, and an ID card icon for personal ID Snippets.
12. THE Frontend SHALL render a Category_Badge on each Snippet card displaying the Snippet's assigned category label.
13. THE Backend SHALL persist a Snippet type field (one of: `api_key`, `password`, `personal_id`) and a category label alongside each Snippet record in the Database.

---

### Requirement 6: Authentication and Session Management

**User Story:** As a user, I want secure access to my personal hub with a polished login and registration experience, so that my data is protected from unauthorized access and onboarding feels seamless.

#### Acceptance Criteria

**Backend**

1. THE Backend SHALL require authentication for all API endpoints that read or write user data.
2. WHEN a user logs in with valid credentials, THE Backend SHALL issue a signed JWT with an expiry of 24 hours.
3. WHEN a request is received with an expired or invalid JWT, THE Backend SHALL return an HTTP 401 response.
4. THE Backend SHALL store user passwords as salted hashes using bcrypt; plaintext passwords SHALL never be stored in the Database.
5. IF a login attempt is made with incorrect credentials, THEN THE Backend SHALL return an HTTP 401 response without revealing whether the username or password was incorrect.
6. WHEN a new user submits a registration request, THE Backend SHALL validate that the username is non-empty, the email is a valid format, and the password is at least 8 characters before creating the user record.
7. IF a registration request contains a duplicate username or email, THEN THE Backend SHALL return an HTTP 409 response with a descriptive error message.
8. WHEN a registration request is valid, THE Backend SHALL create the user record and immediately issue a signed JWT, returning it in the same response.

**Frontend — Login Page**

9. THE Frontend SHALL render a dedicated full-screen Login_Page before the user is authenticated, using the #0F1115 background and Primary_Font.
10. THE Frontend SHALL render the login form inside a centered Auth_Card with a surface color of #1A1C23 and slightly rounded corners.
11. WHEN a login form input receives focus, THE Frontend SHALL apply a subtle border glow using the Accent_Color on that input field.
12. THE Frontend SHALL render a Remember_Me toggle on the login form; WHEN the toggle is enabled, THE Frontend SHALL persist the JWT in localStorage beyond the browser session.
13. WHEN a user submits the login form, THE Frontend SHALL display a loading spinner on the submit button for the duration of the auth request.
14. WHEN a login request returns an HTTP 401 response, THE Frontend SHALL render a visible error message within the Auth_Card without a full page reload.
15. WHEN a login request succeeds, THE Frontend SHALL store the JWT and redirect the user to the dashboard.

**Frontend — Register Page**

16. THE Frontend SHALL render a dedicated full-screen Register_Page containing fields for username, email, password, and confirm password, styled identically to the Login_Page.
17. WHEN a user submits the registration form with a password shorter than 8 characters, THE Frontend SHALL render a validation error message and SHALL NOT submit the request to the Backend.
18. WHEN a user submits the registration form with a non-matching confirm password value, THE Frontend SHALL render a validation error message and SHALL NOT submit the request to the Backend.
19. WHEN a user submits the registration form with any empty field, THE Frontend SHALL render a validation error message and SHALL NOT submit the request to the Backend.
20. WHEN a user submits the registration form, THE Frontend SHALL display a loading spinner on the submit button for the duration of the auth request.
21. WHEN a registration request returns an error response, THE Frontend SHALL render the error message within the Auth_Card without a full page reload.
22. WHEN a registration request succeeds, THE Frontend SHALL store the returned JWT and redirect the user to the dashboard without requiring a separate login step.

**Frontend — Shared Behavior**

23. WHEN a user navigates between the Login_Page and Register_Page, THE Frontend SHALL apply a smooth animated transition with a duration not exceeding 300ms and SHALL NOT perform a full page reload.
24. THE Frontend SHALL render the submit button on both the Login_Page and Register_Page using the Accent_Color as the background.

---

### Requirement 7: API Design and Data Integrity

**User Story:** As a developer, I want a consistent and reliable API, so that the frontend and backend remain decoupled and maintainable.

#### Acceptance Criteria

1. THE Backend SHALL expose all endpoints under a versioned path prefix (e.g., `/api/v1/`).
2. THE Backend SHALL return all responses in JSON format with consistent envelope structure containing `data`, `error`, and `status` fields.
3. WHEN a request is received with a malformed JSON body, THE Backend SHALL return an HTTP 400 response with a descriptive error message.
4. THE Backend SHALL enforce foreign key constraints in the Database to maintain referential integrity between Transactions, Tasks, Notes, Snippets, and their associated user records.
5. THE Backend SHALL apply database migrations using a versioned migration tool (e.g., Alembic) so that schema changes are tracked and reproducible.

---

### Requirement 8: User Profile & Settings

**User Story:** As a user, I want to view and update my profile and personalize the app's appearance, so that the hub reflects my preferences and my account stays up to date.

#### Acceptance Criteria

1. THE Frontend SHALL render a Settings page accessible by clicking a gear or profile icon in the Global_Stats_Bar.
2. WHEN a user navigates to the Settings page, THE Frontend SHALL display the user's current display name and email in editable fields.
3. WHEN a user submits an updated display name or email, THE Backend SHALL validate the fields and persist the changes to the Database.
4. IF an updated email is already associated with another account, THEN THE Backend SHALL return an HTTP 409 response with a descriptive error message.
5. THE Frontend SHALL render a change-password section on the Settings page containing fields for current password, new password, and confirm new password.
6. WHEN a user submits a password change request, THE Backend SHALL verify the current password against the stored hash before updating the password record.
7. IF the current password field does not match the stored hash, THEN THE Backend SHALL return an HTTP 401 response and THE Frontend SHALL render a visible error message.
8. WHEN a user submits a new password shorter than 8 characters, THE Frontend SHALL render a validation error and SHALL NOT submit the request to the Backend.
9. THE Frontend SHALL render an Accent_Color selector on the Settings page offering at least three options: Electric Blue, Neon Green, and Violet Purple.
10. WHEN a user selects an Accent_Color, THE Frontend SHALL apply the chosen color to all Accent_Color-styled elements across the dashboard without a full page reload.
11. THE Frontend SHALL render a background color toggle on the Settings page offering #000000 and #0F1115 as options.
12. WHEN a user selects a background color, THE Frontend SHALL apply the chosen color to the page background without a full page reload.
13. THE Backend SHALL persist the user's Accent_Color preference and background color preference to the Database and return them as part of the authenticated user profile response.

---

### Requirement 9: Search & Quick Access

**User Story:** As a user, I want to search across all my content from a single entry point, so that I can quickly navigate to any note, task, or transaction without manually browsing each module.

#### Acceptance Criteria

1. THE Frontend SHALL render a search icon in the Global_Stats_Bar that, when clicked, opens the Search_Overlay.
2. WHEN the user presses a designated keyboard shortcut (e.g., Cmd+K or Ctrl+K), THE Frontend SHALL open the Search_Overlay.
3. WHEN the Search_Overlay is open, THE Frontend SHALL render a focused text input field for the search query.
4. WHEN a user types a query into the search input, THE Backend SHALL search Note titles, Task titles, and Transaction categories simultaneously and return matching results.
5. THE Frontend SHALL render search results inside the Search_Overlay grouped by module section: Notes, Tasks, and Transactions.
6. WHEN a search query returns no results, THE Frontend SHALL render an empty state message within the Search_Overlay.
7. WHEN a user clicks a search result, THE Frontend SHALL close the Search_Overlay and navigate directly to the corresponding item within its module.
8. WHEN the user presses the Escape key while the Search_Overlay is open, THE Frontend SHALL close the Search_Overlay.
9. THE Backend SHALL return search results within 300ms for datasets up to 1000 combined records across all three modules.

---

### Requirement 10: Data Export

**User Story:** As a user, I want to export my notes and transactions, so that I can back up my data or use it in other tools.

#### Acceptance Criteria

1. THE Frontend SHALL render an Export_Menu accessible from the Canvas module card header.
2. WHEN a user selects the export option from the Canvas Export_Menu, THE Backend SHALL package all of the user's Notes as individual `.md` files and return them as a single ZIP archive.
3. THE Frontend SHALL trigger a file download of the ZIP archive in the user's browser upon receiving the export response.
4. THE Frontend SHALL render an Export_Menu accessible from the Ledger module card header.
5. WHEN a user selects the export option from the Ledger Export_Menu, THE Backend SHALL serialize all of the user's Transactions into CSV format with columns for date, amount, category, and type (income or expense).
6. THE Frontend SHALL trigger a file download of the CSV file in the user's browser upon receiving the export response.
7. WHEN an export request is in progress, THE Frontend SHALL display a loading indicator on the Export_Menu trigger element.
8. IF an export request fails, THEN THE Frontend SHALL render a visible error message within the module card without a full page reload.

---

### Requirement 11: Notifications & Reminders

**User Story:** As a user, I want to set due times on tasks and receive push notifications, so that I am reminded of important tasks at the right moment.

#### Acceptance Criteria

1. THE Frontend SHALL render an optional due time input field on the Task creation and edit form.
2. WHEN a user sets a due time on a Task, THE Backend SHALL persist the due time alongside the Task record in the Database.
3. WHEN a Task's due time is reached, THE Backend SHALL dispatch a Push_Notification to the user via the Web Push API reminding them of the Task.
4. THE Backend SHALL schedule and dispatch Push_Notifications using a background job that polls for due Tasks at regular intervals.
5. WHEN a user logs in for the first time, THE Frontend SHALL request Notification_Permission from the browser.
6. THE Frontend SHALL render the current Notification_Permission state (`granted`, `denied`, or `not_asked`) on the Settings page.
7. WHEN a Task has a due time set, THE Frontend SHALL render a clock icon and the formatted due time on that Task's row in the Routine_Relay card.
8. WHERE the app is installed as a PWA, Push_Notifications SHALL be delivered via the PWA push notification mechanism on iOS and Android.

---

### Requirement 12: Onboarding Flow

**User Story:** As a new user, I want a guided introduction to the app immediately after registration, so that I can quickly understand the four modules and create my first task.

#### Acceptance Criteria

1. WHEN a user completes registration, THE Frontend SHALL render the Onboarding_Overlay as a multi-step modal over the dashboard.
2. THE Onboarding_Overlay SHALL consist of exactly four steps: (1) a Welcome screen displaying the app name and tagline, (2) a module tour screen visually highlighting each of the four Bento_Grid cards in sequence, (3) a prompt screen guiding the user to create their first Task, and (4) a Done screen with a call-to-action button linking to the dashboard.
3. THE Frontend SHALL render a skip control on every step of the Onboarding_Overlay that, when activated, immediately dismisses the overlay.
4. WHEN a user completes or skips the Onboarding_Overlay, THE Backend SHALL record the onboarding completion state for that user in the Database.
5. WHEN a user who has previously completed or skipped onboarding logs in, THE Frontend SHALL NOT render the Onboarding_Overlay.
6. THE Onboarding_Overlay SHALL use the dark design system background (#0F1115 or #1A1C23) with Accent_Color highlights on active step indicators and call-to-action elements.

---

### Requirement 13: Progressive Web App (PWA)

**User Story:** As a user, I want to install the app on my phone and use it offline, so that I can access my hub without a browser tab and without an internet connection.

#### Acceptance Criteria

1. THE Frontend SHALL include a valid web app manifest specifying the app name, icons, a theme color of #0F1115, and `display: standalone`.
2. THE Frontend SHALL be installable via the "Add to Home Screen" prompt on iOS and Android devices.
3. THE Frontend SHALL register a Service_Worker that caches the App_Shell (HTML, CSS, JS, and fonts) on installation.
4. WHEN the user is offline, THE Frontend SHALL serve the cached App_Shell and display a minimal offline indicator within the Global_Stats_Bar.
5. WHEN the user is offline, THE Frontend SHALL serve the last cached data for read operations.
6. WHEN the user is offline and attempts a write operation, THE Frontend SHALL display a message indicating that the operation is unavailable offline.
7. WHEN the user selects a background color preference, THE Frontend SHALL update the PWA theme color in the manifest to match the selected background color.

---

### Requirement 14: Budget Limits (Ledger)

**User Story:** As a user, I want to set monthly spending limits per category, so that I can monitor my budget and receive visual warnings when I am close to or over my limit.

#### Acceptance Criteria

1. THE Frontend SHALL render a budget limit input field per category within the Ledger settings or category management view.
2. WHEN a user saves a Budget_Limit for a category, THE Backend SHALL persist the limit value per category per user in the Database.
3. THE Frontend SHALL render a Budget_Progress_Bar for each category in the Ledger transaction list, displaying the ratio of total spending to the Budget_Limit for the current month.
4. WHEN a user's spending in a category reaches 80% of the Budget_Limit, THE Frontend SHALL display a warning badge on the Ledger card in the Bento_Grid.
5. WHEN a user's spending in a category exceeds 100% of the Budget_Limit, THE Frontend SHALL display an over-budget alert badge on the Ledger card in the Bento_Grid.
6. THE Donut_Chart SHALL visually distinguish any category segment that has exceeded its Budget_Limit, using a red fill or a warning indicator on that segment.
7. WHEN a user exports Ledger data as CSV, THE Backend SHALL include the Budget_Limit value for each category as an additional column in the export.

---

### Requirement 15: Note Pinning (Canvas)

**User Story:** As a user, I want to pin important notes to the top of my Canvas, so that I can access my most relevant notes without scrolling.

#### Acceptance Criteria

1. THE Frontend SHALL render a pin action control on each Note card in the Canvas grid view.
2. WHEN a user pins a Note, THE Backend SHALL persist the pinned state of that Note in the Database.
3. THE Frontend SHALL render all Pinned_Notes before non-pinned Notes in the Canvas grid view, visually distinguished with a pin icon.
4. THE System SHALL enforce a maximum of 3 Pinned_Notes per user at any time.
5. WHEN a user attempts to pin a fourth Note, THE Frontend SHALL display an inline error message on the Note card indicating that the pin limit of 3 has been reached, and SHALL NOT submit a pin request to the Backend.
6. WHEN a user unpins a Note, THE Backend SHALL update the pinned state to false in the Database and THE Frontend SHALL move the Note back to its chronological position in the Canvas grid without a full page reload.

---

### Requirement 16: Logout & Session Control

**User Story:** As a user, I want a clear logout action and full control over my session, so that I can securely end my session from any device.

#### Acceptance Criteria

1. THE Frontend SHALL render a logout button accessible from the Global_Stats_Bar or the Settings page.
2. WHEN a user clicks the logout button, THE Frontend SHALL apply the Page_Transition animation before redirecting to the Login_Page.
3. WHEN a user clicks the logout button, THE Frontend SHALL clear the stored JWT from localStorage and sessionStorage.
4. WHEN a user clicks the logout button, THE Frontend SHALL send a logout request to the Backend before clearing the JWT.
5. THE Backend SHALL expose a logout endpoint that adds the submitted JWT to the Token_Blocklist, invalidating it server-side.
6. WHEN an invalidated token is used in a subsequent API request, THE Backend SHALL return an HTTP 401 response.
7. THE Settings page SHALL display the current session's login time and token expiry time.

---

### Requirement 17: Password Reset / Forgot Password

**User Story:** As a user, I want to reset my password via email if I forget it, so that I can regain access to my account without contacting support.

#### Acceptance Criteria

1. THE Frontend SHALL render a "Forgot password?" link below the login form on the Login_Page.
2. WHEN a user clicks "Forgot password?", THE Frontend SHALL render a password reset request view containing a single email input field.
3. WHEN a user submits their email on the password reset request view, THE Backend SHALL generate a time-limited Password_Reset_Token (valid for 1 hour) and send a reset link containing the token to the provided email address.
4. IF the submitted email does not match any registered account, THEN THE Backend SHALL return a generic success response to prevent email enumeration.
5. WHEN a user clicks the reset link, THE Frontend SHALL render a password reset form containing a new password field and a confirm new password field.
6. WHEN a user submits the password reset form, THE Backend SHALL validate that the Password_Reset_Token is unexpired and unused, then update the user's password hash and mark the token as used.
7. IF the Password_Reset_Token is expired or already used, THEN THE Backend SHALL return an HTTP 410 response and THE Frontend SHALL display an error message with a link to request a new reset email.
8. WHEN a password reset succeeds, THE Frontend SHALL redirect the user to the Login_Page and display a success message confirming the password has been updated.
