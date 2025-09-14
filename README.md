# ChurchKite Plugin Admin
## Registry API quick test

Set `REGISTRATION_API_KEY` in Netlify (already set via CI), then:

```
export SITE=https://churchkite-plugin-admin.netlify.app
export KEY=<your-registration-api-key>
curl -X POST "$SITE/api/registry/register" \
   -H "Content-Type: application/json" \
   -H "x-registration-key: $KEY" \
   -d '{"siteUrl":"https://example.com","pluginSlug":"metron-youtube-importer","pluginVersion":"1.2.3","wpVersion":"6.6.2"}'

```

## WordPress plugin setup

- In WP admin, set ChurchKite Admin URL to your admin site URL (e.g., `$SITE`).
- Set ChurchKite Registration Key to the same `REGISTRATION_API_KEY` value.
- Activate the plugin to auto-register; deactivation auto-deregisters. A daily heartbeat is scheduled.

This is a simple web application for managing WordPress plugins and their statuses. It provides an interface to interact with the WordPress API, allowing users to view and update plugin information.

## Features


## Admin UI Authentication

The SSR pages (`/`, `/plugins`, `/sites`, `/inventory`) are protected with HTTP Basic Auth.

- Set environment variables in Netlify:
   - `ADMIN_USER`: Username for the admin UI
   - `ADMIN_PASS`: Password for the admin UI

- Behavior:
   - Auth is enforced on all Netlify deploys (production, branch, and deploy previews). It is only bypassed when running locally (localhost).
   - Requests without valid credentials receive `401` and `WWW-Authenticate: Basic realm="ChurchKite Admin"`.
   - API endpoints under `/api/updates/*` remain public for WordPress sites to reach the service.

- Verify from terminal:

```bash
curl -sI https://<your-site>.netlify.app/sites | sed -n '1,10p'
curl -u "$ADMIN_USER:$ADMIN_PASS" -sI https://<your-site>.netlify.app/sites | sed -n '1,10p'
```

If `ADMIN_USER`/`ADMIN_PASS` are not configured, the server returns `500` for protected routes.

During local development on `localhost`, Basic Auth is bypassed for convenience.

You can set `PROD_HOST` to your canonical hostname (e.g., `churchkite-plugin-admin.netlify.app`) to make production detection explicit.

### Logout

Use the `/logout` route to clear Basic Auth in most browsers; it responds with `401` and a new `WWW-Authenticate` challenge, prompting the browser to forget cached credentials. Example:

```bash
open https://<your-site>.netlify.app/logout
```
## Project Structure

```
churchkite-plugin-admin
├── src
│   ├── app.ts                # Main entry point of the application
│   ├── server.ts             # Starts the server and listens for requests
│   ├── controllers           # Contains controllers for handling requests
│   │   └── plugins.controller.ts  # Handles plugin-related requests
│   ├── routes                # Defines application routes
│   │   └── plugins.ts        # Routes for plugin operations
│   ├── services              # Contains services for business logic
│   │   └── wordpress.service.ts  # Interacts with the WordPress API
│   ├── middlewares           # Middleware functions for the application
│   │   └── auth.ts           # Authentication middleware
│   ├── views                 # View templates for rendering HTML
│   │   ├── layout.ejs        # Main layout template
│   │   └── plugins.ejs       # Template for displaying plugins
│   └── types                 # TypeScript types and interfaces
│       └── index.ts          # Common types used in the application
├── public                    # Public assets
│   ├── css                   # CSS styles
│   │   └── styles.css        # Styles for the application
│   └── js                    # Client-side JavaScript
│       └── app.js            # JavaScript for user interactions
├── package.json              # npm configuration file
├── tsconfig.json             # TypeScript configuration file
├── .env.example              # Example environment variables
├── .gitignore                # Git ignore file
└── README.md                 # Project documentation
```

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/churchkite-plugin-admin.git
   cd churchkite-plugin-admin
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file based on the `.env.example` file and fill in the required environment variables.

4. Start the application:
   ```
   npm run start
   ```

## Usage

- Access the application at `http://admin.churchkite.com`.
- Log in with your credentials to manage plugins.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for details.