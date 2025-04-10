# Agent Guidelines for Heinemann Store Project

## Introduction
This document serves as a guide for AI agents working on the Heinemann Store project. It outlines best practices, project structure, and expectations for contributions.

## Project Overview
The Heinemann Store is a Shopify-based e-commerce platform integrated with BigCommerce. Familiarize yourself with both platforms' documentation to provide optimal assistance.

## Code Structure
- `/shopify-bc` - Main project directory
- Configuration files are located at the root level
- Component directories follow a modular approach

## Best Practices
1. Follow established code style guidelines
2. Maintain compatibility with Shopify and BigCommerce APIs
3. Document all functions and components clearly
4. Use TypeScript types/interfaces where applicable
5. Write unit tests for new functionalities

## Common Tasks
- Component development
- API integration
- Performance optimization
- Bug fixing
- Feature implementation

## Version Control
- Create descriptive commit messages
- Reference issue numbers when applicable
- Follow branch naming conventions

## Getting Started
To begin working on this project, first review the existing codebase to understand the architecture and patterns being used.

## Environment Setup After Repository Clone

### Prerequisites
- Python 3.8 or higher
- Node.js 14+ and npm
- ngrok account (for tunnel creation)

### Installation Steps
1. Clone the repository:
   ```bash
   git clone [repository-url]
   cd shopify-bc
   ```

2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Install Node.js dependencies:
   ```bash
   npm install
   ```

4. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit the `.env` file with your specific configuration values.

5. Install and configure ngrok:
   ```bash
   npm install -g ngrok
   ngrok authtoken [your-auth-token]
   ```

### Starting the Servers

1. Start the Flask server:
   ```bash
   python app.py
   ```
   Verify the server is running by checking `http://localhost:5000` in your browser.

2. In a separate terminal, start ngrok to expose the Flask server:
   ```bash
   ngrok http 5000
   ```
   Take note of the ngrok URL (e.g., https://abc123.ngrok.io).

3. Update your Shopify app's webhook URLs with the ngrok URL if needed.

### Common Setup Issues and Solutions

- **Missing dependencies error**: Run `pip install -r requirements.txt --upgrade` to ensure all packages are properly installed.
- **Port already in use**: Change the Flask port in app.py or kill the process using the port.
- **ngrok connection refused**: Make sure your Flask server is running before starting ngrok.
- **ngrok tunnel timeout**: Restart ngrok and verify your authentication token is correct.
- **Environment variable issues**: Ensure all required variables in the .env file are properly set.
- **macOS Python issues**:
  - **Multiple Python versions**: Use `which python3` to verify which Python version is running
  - **Permission errors**: Use `sudo pip3 install --user [package]` for system directories or create a virtual environment
  - **SSL certificate errors**: Run `Install Certificates.command` from your Python.app folder
  - **Homebrew Python conflicts**: Use `brew doctor` to identify conflicts between Homebrew and system Python
  - **M1/M2 Mac compatibility**: Ensure packages have arm64 support or use Rosetta 2 for x86 packages

### Verification Steps
After setup, run the following check to ensure everything is configured correctly:
```bash
python verify_setup.py
```
This will validate your environment and connections to both Shopify and BigCommerce.

## Troubleshooting
For common issues, refer to:
- Shopify Developer Documentation
- BigCommerce API Documentation
- Project-specific notes in code comments

## Contact
For questions that cannot be answered through existing documentation, guide developers to contact the project maintainers.
