# ChurchKite Plugin Admin

This is a simple web application for managing WordPress plugins and their statuses. It provides an interface to interact with the WordPress API, allowing users to view and update plugin information.

## Features

- List all installed plugins
- Update plugin statuses
- User authentication for secure access

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