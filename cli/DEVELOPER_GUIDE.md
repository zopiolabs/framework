# Zopio CLI Developer Guide

This guide provides detailed information for developers working with the Zopio CLI.

## Architecture

The Zopio CLI has been restructured to follow a clean, modular architecture:

```
framework/cli/
├── commands/         # Command implementations
│   ├── config.js     # Configuration management
│   ├── generate.js   # Code generation
│   ├── i18n.js       # Internationalization management
│   └── init.js       # Project initialization
├── templates/        # Code templates
│   ├── component.js  # React component templates
│   ├── config.js     # Configuration file template
│   ├── i18n-config.js # i18n configuration template
│   └── translation.js # Translation file templates
├── utils/            # Utility functions
│   └── helpers.js    # Common helper functions
├── scripts/          # Build and maintenance scripts
│   └── build.js      # Build script for distribution
├── zopio.js          # Main CLI entry point
├── package.json      # Package configuration
├── README.md         # User documentation
└── DEVELOPER_GUIDE.md # Developer documentation
```

## Internationalization Support

The CLI provides comprehensive support for internationalization based on the project's requirements:

- **Supported locales**: English (en), Turkish (tr), Spanish (es), German (de)
- **Default locale**: English (en)
- **Framework integration**: Works with both next-international and next-intl
- **Translation management**: Commands for adding locales and creating translation namespaces

## Adding New Commands

To add a new command to the CLI:

1. Create a new command file in the `commands/` directory
2. Export a Command object using commander
3. Import and add the command to `zopio.js`

Example:

```javascript
// commands/example.js
import { Command } from "commander";
import { logger } from "../utils/helpers.js";

export const exampleCommand = new Command("example")
  .description("Example command")
  .action(() => {
    logger.success("Example command executed");
  });

// In zopio.js
import { exampleCommand } from "./commands/example.js";
// ...
program.addCommand(exampleCommand);
```

## Adding New Templates

To add a new template:

1. Create a template file in the `templates/` directory
2. Export a function that returns the template string
3. Import and use the template in your command

Example:

```javascript
// templates/example.js
export default function exampleTemplate(name, options = {}) {
  return `// Example template for ${name}
console.log("Hello, ${name}!");
`;
}

// In your command
import exampleTemplate from "../templates/example.js";
// ...
const content = exampleTemplate(name, options);
```

## Testing

The CLI includes a test script that verifies all commands are working correctly:

```bash
node test.js
```

This will create a temporary project and run through all the CLI commands to ensure they function as expected.

## Building for Distribution

To build the CLI for distribution:

```bash
npm run build
```

This will:
1. Bundle the CLI using esbuild
2. Create a distribution package in the `dist/` directory
3. Make the CLI executable

## Common Development Tasks

### Adding a New Locale

To add support for a new locale in the templates:

1. Update the default locales in `utils/helpers.js`
2. Add translations for the new locale in `templates/translation.js`

### Adding a New Command Option

To add a new option to an existing command:

1. Open the command file in the `commands/` directory
2. Add the option using commander's `.option()` method
3. Handle the option in the action function

## Troubleshooting

### Common Issues

- **Module not found errors**: Ensure all imports use the correct path and extension (`.js`)
- **Permission denied**: Make sure the CLI is executable (`chmod +x zopio.js`)
- **ESM compatibility**: The CLI uses ES modules, ensure all imports/exports follow ESM syntax

### Debugging

For debugging:

```bash
NODE_DEBUG=zopio node zopio.js [command]
```

## Best Practices

1. Use the `logger` utility for consistent output formatting
2. Follow ESM import/export patterns
3. Use optional chaining and nullish coalescing for safer code
4. Prefer `for...of` loops over `.forEach()` methods
5. Use the `node:` protocol for Node.js built-in modules
