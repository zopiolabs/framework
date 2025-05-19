# Zopio CLI

A developer-first command-line interface for the Zopio B2B Framework.

## Features

- **Project Initialization**: Quickly bootstrap new Zopio projects
- **Code Generation**: Generate modules, components, and other code artifacts
- **Internationalization Support**: Manage translations and locales for your application
- **Developer Experience**: Designed with developer productivity in mind

## Installation

```bash
# Install globally
npm install -g zopio-cli

# Or use with npx
npx zopio-cli [command]
```

## Usage

### Initialize a new project

```bash
zopio init [options]
```

Options:
- `-t, --template <template>` - Template to use (default: "default")
- `-l, --locale <locale>` - Default locale for internationalization (default: "en")

### Generate a module

```bash
zopio generate <type> <name> [options]
```

Arguments:
- `type` - Type of module to generate (core | addon | data | i18n)
- `name` - Name of the module

Options:
- `-d, --directory <directory>` - Custom directory for the module

### Manage internationalization

```bash
zopio i18n [options]
```

Options:
- `-a, --add <locale>` - Add a new locale
- `-l, --list` - List all available locales
- `-e, --extract` - Extract translation keys from project

## Supported Locales

The Zopio framework supports the following locales out of the box:
- English (en)
- Turkish (tr)
- Spanish (es)
- German (de)

## Development

To contribute to the Zopio CLI:

```bash
# Clone the repository
git clone https://github.com/zopio/framework.git

# Navigate to CLI directory
cd framework/cli

# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build
```

## License

MIT
