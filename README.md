# SYA Zone - Video Platform

A demonstration video platform frontend and backend for SYA Zone.

## Features

*   Dynamic video listing from a backend API.
*   Functional search for videos (searches titles, descriptions, and tags).
*   Dark and Light theme toggle with localStorage persistence.
*   Responsive design.
*   Placeholders for Adsterra banner ads.
*   Logo placeholder.

## Project Structure
Use code with caution.
Markdown
sya-zone-project/
├── backend/
│ ├── server.js # Node.js Express server
│ └── package.json # Backend dependencies
├── public/
│ └── index.html # Main frontend file (HTML, CSS, JS)
└── README.md # This file
## Prerequisites

*   [Node.js](https://nodejs.org/) (which includes npm) installed on your system.

## Setup and Running

1.  **Clone the repository (or create these files manually):**
    If you have this on GitHub:
    ```bash
    git clone <your-repository-url>
    cd sya-zone-project
    ```
    Otherwise, create the directory structure and files as described.

2.  **Install Backend Dependencies:**
    Navigate to the `backend` directory and install the necessary Node.js packages.
    ```bash
    cd backend
    npm install
    ```

3.  **Start the Server:**
    From the `backend` directory, run:
    ```bash
    node server.js
    ```
    You should see a message like: `SYA Zone server running on http://localhost:3000`

4.  **Access the Website:**
    Open your web browser and go to `http://localhost:3000`.

## Customization

*   **Logo:** In `public/index.html`, search for `logo-placeholder` and replace the placeholder div or text with your actual logo image.
*   **Thumbnails:**
    *   Currently, video thumbnails are placeholders.
    *   To use actual images, place them in a new `public/images/` directory.
    *   Update the `thumbnail` paths in the `videos` array in `backend/server.js` (e.g., `"thumbnail": "images/my_thumbnail.jpg"`).
    *   The frontend JavaScript in `public/index.html` (`renderVideos` function) will then construct the correct image path.
*   **Adsterra Ads:** In `public/index.html`, search for "Adsterra Ad Space" comments and paste your Adsterra ad code snippets in the designated `div` elements.
*   **Video Data:** Modify the `videos` array in `backend/server.js` to add, remove, or edit video information.

## File Separation (Recommended for larger projects)

The `public/index.html` currently embeds CSS and JavaScript for simplicity. For better organization, you can separate them:

1.  Create `public/style.css`: Move all content from `<style>` tags in `index.html` to this file.
    Then link it in `index.html`'s `<head>`:
    ```html
    <link rel="stylesheet" href="style.css">
    ```
2.  Create `public/script.js`: Move all content from `<script>` tags (the one at the end of the body) in `index.html` to this file.
    Then link it in `index.html` before the closing `</body>` tag:
    ```html
    <script src="script.js"></script>
    ```
